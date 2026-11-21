// Archivo: src/components/home/CourseList.js
// Primera vista del Home: todos los cursos como tarjetas. Al tocar uno se ven sus ejercicios.
import { useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Icono, COLORES_ICONO } from '../icono/Icono';

// La lista de cursos del backend puede traer el avance o no: si no viene, no se muestra la barra
function avanceDe(curso) {
  const total = Number(curso.totalLecciones);
  const hechas = Number(curso.leccionesCompletadas);
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(hechas)) return null;
  return { total, hechas, porcentaje: Math.round((Math.min(hechas, total) / total) * 100) };
}

// Círculo alrededor del logo del curso en el que estás: se va llenando con tu avance
function Anillo({ tam, fraccion, children }) {
  const grosor = 5;
  const radio = (tam - grosor) / 2;
  const perimetro = 2 * Math.PI * radio;
  return (
    <View style={{ width: tam, height: tam, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
      <Svg width={tam} height={tam} style={StyleSheet.absoluteFill}>
        <Circle cx={tam / 2} cy={tam / 2} r={radio} stroke="#fff" strokeOpacity={0.3} strokeWidth={grosor} fill="none" />
        <Circle
          cx={tam / 2} cy={tam / 2} r={radio} stroke="#a3fba3" strokeWidth={grosor} strokeLinecap="round" fill="none"
          strokeDasharray={`${perimetro} ${perimetro}`} strokeDashoffset={perimetro * (1 - fraccion)}
          rotation={-90} origin={`${tam / 2}, ${tam / 2}`}
        />
      </Svg>
      {children}
    </View>
  );
}

function TarjetaCurso({ curso, numero, onPress, actual, onLayout }) {
  const bloqueado = !curso.desbloqueado;
  const avance = avanceDe(curso);
  const estado = curso.completado ? 'Completado' : bloqueado ? 'Bloqueado' : avance?.hechas ? 'En curso' : 'Disponible';

  const icono = (
    <Icono
      nombre={curso.completado ? 'completado' : bloqueado ? 'candado' : 'guitarra'}
      tamano={actual ? 44 : 34}
      acento={curso.completado ? COLORES_ICONO.verde : undefined}
    />
  );

  return (
    <TouchableOpacity
      style={[styles.tarjeta, actual && styles.tarjetaActual, curso.completado && styles.tarjetaCompletada, bloqueado && styles.tarjetaBloqueada]}
      onPress={() => onPress(curso)}
      onLayout={onLayout}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${curso.nombre}, ${estado}`}
    >
      {actual ? (
        <Anillo tam={84} fraccion={curso.completado ? 1 : avance?.hechas ? avance.hechas / avance.total : 0}>{icono}</Anillo>
      ) : (
        <View style={styles.icono}>{icono}</View>
      )}
      <Text style={styles.numero}>CURSO {numero}</Text>
      <View style={[styles.cajaNombre, actual && styles.cajaNombreActual]}>
        <Text style={[styles.nombre, actual && styles.nombreActual]} numberOfLines={2}>{curso.nombre}</Text>
      </View>

      {actual && !curso.completado && avance && (
        <View style={styles.barra}>
          <View style={[styles.barraLlena, { width: `${avance.porcentaje}%` }]} />
        </View>
      )}
      {actual && !curso.completado && (
        <Text style={styles.estado}>{avance ? `${avance.hechas} de ${avance.total}  •  ${estado}` : estado}</Text>
      )}
      {bloqueado && <Text style={styles.estado}>Bloqueado</Text>}
    </TouchableOpacity>
  );
}

export function CourseList({ cursos, onSelect }) {
  // El curso "actual": el primero desbloqueado que todavía no terminaste
  const actual = cursos.find((c) => c.desbloqueado && !c.completado) || cursos.find((c) => c.desbloqueado);
  const scrollRef = useRef(null);
  const medidas = useRef({ ancho: 0, x: null, tam: 0 });

  // Cuando ya sabemos el ancho de la lista y dónde está la tarjeta actual, la centramos
  const centrarActual = () => {
    const { ancho, x, tam } = medidas.current;
    if (!ancho || x === null || !scrollRef.current) return;
    scrollRef.current.scrollTo({ x: Math.max(0, x + tam / 2 - ancho / 2), animated: false });
  };

  return (
    <View style={styles.seccion}>
      <Text style={styles.titulo}>Elegí un curso para ver sus ejercicios</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.lista}
        onLayout={(e) => { medidas.current.ancho = e.nativeEvent.layout.width; centrarActual(); }}
      >
        {cursos.map((curso, i) => (
          <TarjetaCurso
            key={curso.id}
            curso={curso}
            numero={i + 1}
            onPress={onSelect}
            actual={curso === actual}
            onLayout={curso === actual ? (e) => {
              medidas.current.x = e.nativeEvent.layout.x;
              medidas.current.tam = e.nativeEvent.layout.width;
              centrarActual();
            } : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  seccion: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', paddingTop: 14, overflow: 'hidden' },
  titulo: { color: '#fff', fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  lista: { alignItems: 'center', paddingHorizontal: 20, gap: 16, flexGrow: 1, justifyContent: 'center' },
  tarjeta: { width: 180, minHeight: 160, borderRadius: 18, padding: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(76, 82, 217, 0.55)', borderWidth: 2, borderColor: '#b28cff' },
  tarjetaActual: { width: 240, minHeight: 230, padding: 18, borderColor: '#fff' },
  tarjetaCompletada: { backgroundColor: 'rgba(168, 132, 255, 0.45)', borderColor: '#fff' },
  tarjetaBloqueada: { backgroundColor: 'rgba(91, 82, 148, 0.6)', borderColor: 'rgba(255,255,255,0.3)', opacity: 0.75 },
  icono: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 8 },
  // Alto fijo de 2 líneas: así todas las tarjetas miden lo mismo tenga el título 1 o 2 líneas
  cajaNombre: { height: 40, justifyContent: 'center' },
  cajaNombreActual: { height: 48 },
  nombre: { color: '#fff', fontSize: 16, lineHeight: 20, fontWeight: 'bold', textAlign: 'center' },
  nombreActual: { fontSize: 19, lineHeight: 24 },
  numero: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 2 },
  barra: { width: '100%', height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 10, overflow: 'hidden' },
  barraLlena: { height: '100%', backgroundColor: '#a3fba3' },
  estado: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600', marginTop: 8 },
});
