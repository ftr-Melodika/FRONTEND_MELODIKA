// Archivo: src/components/home/CourseList.js
// Primera vista del Home. El curso en el que vas es el protagonista (grande, con tu avance);
// los demás cursos quedan al costado, más chicos. Al tocar uno se ven sus ejercicios.
import { useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Icono, COLORES_ICONO } from '../icono/Icono';
import { Pulsable } from '../Pulsable';
import { capitalizar } from '../../services/leccionesService';
import { COLORES, FUENTES, useReducirMovimiento } from '../../theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const TAM_ANILLO = 128;
const GROSOR = 10;
const RADIO = (TAM_ANILLO - GROSOR) / 2;
const PERIMETRO = 2 * Math.PI * RADIO;

// La lista de cursos del backend puede traer el avance o no: si no viene, no se muestra la barra
function avanceDe(curso) {
  const total = Number(curso.totalLecciones);
  const hechas = Number(curso.leccionesCompletadas);
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(hechas)) return null;
  return { total, hechas: Math.min(hechas, total), fraccion: Math.min(hechas, total) / total };
}

// Anillo de avance que se llena una vez al aparecer
function Anillo({ fraccion, reducir, children }) {
  const progreso = useRef(new Animated.Value(reducir ? fraccion : 0)).current;
  useEffect(() => {
    if (reducir) { progreso.setValue(fraccion); return; }
    Animated.timing(progreso, { toValue: fraccion, duration: 900, delay: 350, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [fraccion, reducir, progreso]);
  const offset = progreso.interpolate({ inputRange: [0, 1], outputRange: [PERIMETRO, 0] });

  return (
    <View style={styles.anilloCaja}>
      <Svg width={TAM_ANILLO} height={TAM_ANILLO} style={styles.anilloSvg}>
        <Circle cx={TAM_ANILLO / 2} cy={TAM_ANILLO / 2} r={RADIO} stroke={COLORES.tinta} strokeOpacity={0.15} strokeWidth={GROSOR} fill="none" />
        <AnimatedCircle
          cx={TAM_ANILLO / 2} cy={TAM_ANILLO / 2} r={RADIO}
          stroke={COLORES.tinta} strokeWidth={GROSOR} strokeLinecap="round" fill="none"
          strokeDasharray={`${PERIMETRO} ${PERIMETRO}`} strokeDashoffset={offset}
          rotation={-90} origin={`${TAM_ANILLO / 2}, ${TAM_ANILLO / 2}`}
        />
      </Svg>
      {children}
    </View>
  );
}

function CursoActual({ curso, onPress, reducir }) {
  const avance = avanceDe(curso);
  const empezado = !!avance?.hechas;
  const accion = curso.completado ? 'Repasar' : empezado ? 'Continuar' : 'Empezar';

  return (
    <Pulsable
      onPress={() => onPress(curso)}
      style={styles.actual}
      accessibilityRole="button"
      accessibilityLabel={`${curso.nombre}. ${avance ? `${avance.hechas} de ${avance.total} ejercicios. ` : ''}${accion}`}
    >
      <Anillo fraccion={curso.completado ? 1 : avance?.fraccion ?? 0} reducir={reducir}>
        <Icono nombre={curso.completado ? 'completado' : 'guitarra'} tamano={52} color={COLORES.tinta} acento={curso.completado ? COLORES_ICONO.verde : COLORES.indigo} />
      </Anillo>

      <View style={styles.actualTexto}>
        <Text style={styles.actualNivel}>{curso.nivel ? capitalizar(curso.nivel) : 'Curso'}</Text>
        <Text style={styles.actualNombre} numberOfLines={2}>{curso.nombre}</Text>
        {avance && (
          <Text style={styles.actualAvance}>
            {avance.hechas} de {avance.total} ejercicios
          </Text>
        )}
        <View style={styles.cta}>
          <Text style={styles.ctaTexto}>{accion}</Text>
          <Icono nombre="adelante" tamano={18} color="#fff" acento={COLORES.violeta} />
        </View>
      </View>
    </Pulsable>
  );
}

function CursoSecundario({ curso, previo, onPress }) {
  const bloqueado = !curso.desbloqueado;
  const avance = avanceDe(curso);
  const detalle = curso.completado
    ? 'Completado'
    : bloqueado
      ? previo ? `Terminá «${previo.nombre}» para abrirlo` : 'Bloqueado'
      : avance?.hechas ? `${avance.hechas} de ${avance.total} ejercicios` : 'Sin empezar';

  return (
    <Pulsable
      onPress={() => onPress(curso)}
      style={[styles.secundario, bloqueado && styles.secundarioBloqueado]}
      accessibilityRole="button"
      accessibilityState={{ disabled: bloqueado }}
      accessibilityLabel={`${curso.nombre}, ${detalle}`}
    >
      <View style={styles.secundarioIcono}>
        <Icono
          nombre={curso.completado ? 'completado' : bloqueado ? 'candado' : 'guitarra'}
          tamano={26}
          acento={curso.completado ? COLORES_ICONO.verde : undefined}
        />
      </View>
      <View style={styles.secundarioTexto}>
        <Text style={styles.secundarioNombre} numberOfLines={2}>{curso.nombre}</Text>
        {!!curso.nivel && <Text style={styles.secundarioNivel}>{capitalizar(curso.nivel)}</Text>}
      </View>
      {avance && !bloqueado && (
        <View style={styles.barra}><View style={[styles.barraLlena, { width: `${Math.round(avance.fraccion * 100)}%` }]} /></View>
      )}
      <Text style={[styles.detalle, curso.completado && styles.detalleOk]} numberOfLines={2}>{detalle}</Text>
    </Pulsable>
  );
}

export function CourseList({ cursos, onSelect }) {
  const reducir = useReducirMovimiento();
  // El curso "actual": el primero desbloqueado que todavía no terminaste
  const actual = useMemo(
    () => cursos.find((c) => c.desbloqueado && !c.completado) || cursos.find((c) => c.desbloqueado) || cursos[0],
    [cursos]
  );
  const otros = cursos.filter((c) => c !== actual);

  // Única animación de entrada: primero aparece el curso actual y después los demás
  const entrada = useRef([new Animated.Value(reducir ? 1 : 0), new Animated.Value(reducir ? 1 : 0)]).current;
  useEffect(() => {
    if (reducir) { entrada.forEach((v) => v.setValue(1)); return undefined; }
    const anim = Animated.stagger(140, entrada.map((v) => Animated.timing(v, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true })));
    anim.start();
    return () => anim.stop();
  }, [reducir, entrada]);
  const aparecer = (v) => ({ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] });

  if (!actual) {
    return (
      <View style={styles.vacio}>
        <Text style={styles.vacioTitulo}>Todavía no hay cursos</Text>
        <Text style={styles.vacioTexto}>Cuando se publique el primero, lo vas a ver acá.</Text>
      </View>
    );
  }

  return (
    <View style={styles.seccion}>
      <Animated.View style={[styles.colActual, aparecer(entrada[0])]}>
        <CursoActual curso={actual} onPress={onSelect} reducir={reducir} />
      </Animated.View>

      {otros.length > 0 && (
        <Animated.View style={[styles.colOtros, aparecer(entrada[1])]}>
          <Text style={styles.otrosTitulo}>Más cursos</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.otrosLista}>
            {otros.map((curso) => (
              <CursoSecundario key={curso.id} curso={curso} previo={cursos[cursos.indexOf(curso) - 1]} onPress={onSelect} />
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  seccion: { flex: 1, flexDirection: 'row', gap: 22, paddingVertical: 8 },
  colActual: { flex: 1.35, justifyContent: 'center' },
  colOtros: { flex: 1, minWidth: 0 },

  actual: { flexDirection: 'row', alignItems: 'center', gap: 22, backgroundColor: COLORES.violeta, borderRadius: 28, padding: 24 },
  anilloCaja: { width: TAM_ANILLO, height: TAM_ANILLO, alignItems: 'center', justifyContent: 'center' },
  anilloSvg: { position: 'absolute' },
  actualTexto: { flex: 1, minWidth: 0 },
  actualNivel: { color: COLORES.tinta, fontSize: 14, fontFamily: FUENTES.cuerpoNegrita, opacity: 0.8 },
  actualNombre: { color: COLORES.tinta, fontSize: 30, lineHeight: 34, fontFamily: FUENTES.display, marginTop: 2 },
  actualAvance: { color: COLORES.tinta, fontSize: 15, fontFamily: FUENTES.cuerpoMedio, marginTop: 6 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginTop: 16, backgroundColor: COLORES.tinta, borderRadius: 24, paddingVertical: 11, paddingHorizontal: 20, minHeight: 44 },
  ctaTexto: { color: '#fff', fontSize: 16, fontFamily: FUENTES.cuerpoNegrita },

  otrosTitulo: { color: '#fff', fontSize: 20, fontFamily: FUENTES.displaySuave, marginBottom: 10 },
  otrosLista: { gap: 12, paddingBottom: 8 },
  secundario: { backgroundColor: COLORES.profundo, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: COLORES.linea },
  secundarioBloqueado: { backgroundColor: 'transparent', borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.3)' },
  secundarioIcono: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 10 },
  secundarioTexto: { minWidth: 0 },
  secundarioNombre: { color: '#fff', fontSize: 18, lineHeight: 22, fontFamily: FUENTES.displaySuave },
  secundarioNivel: { color: COLORES.textoSuave, fontSize: 13, fontFamily: FUENTES.cuerpoMedio, marginTop: 2 },
  barra: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 12, overflow: 'hidden' },
  barraLlena: { height: '100%', backgroundColor: COLORES.menta, borderRadius: 3 },
  detalle: { color: COLORES.textoSuave, fontSize: 13, fontFamily: FUENTES.cuerpoMedio, marginTop: 8 },
  detalleOk: { color: COLORES.menta },

  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  vacioTitulo: { color: '#fff', fontSize: 22, fontFamily: FUENTES.display },
  vacioTexto: { color: COLORES.textoSuave, fontSize: 15, fontFamily: FUENTES.cuerpo, marginTop: 6 },
});
