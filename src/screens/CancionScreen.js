// Archivo: src/screens/CancionScreen.js
// Una canción: acordes, rasgueo, tempo y capo. Se elige entre aprenderla o tocarla:
// - Aprenderla: 1) cada acorde, cuerda por cuerda y después rasgueado; 2) los cambios entre
//   acordes de la canción; 3) tocarla.
// - Tocarla: los acordes avanzan por el mástil y se rasguea cada uno cuando llega a la línea.
import { useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Background } from '../components/Background';
import { ScreenHeader } from '../components/ScreenHeader';
import { Icono } from '../components/icono/Icono';
import { Button } from '../components/Button';
import { GuitarNeck } from '../components/leccion/GuitarNeck';
import { PracticaConDeteccion } from '../components/leccion/PracticaConDeteccion';
import { RiffStep } from '../components/leccion/RiffStep';
import { Rasgueo } from '../components/canciones/Rasgueo';
import { AuthContext } from '../context/AuthContext';
import { cancionesService } from '../services/cancionesService';
import { useFavoritasCanciones } from '../hooks/useConsultas';
import { useAlternarFavorita } from '../hooks/useAlternarFavorita';
import {
  acordesDeCancion, aprendizajeDeCancion, cuentaDeRasgueo, formaDeAcorde, nivelDeCancion, rasgueosDeCancion,
  OPCIONES_VELOCIDAD, riffDeCancion, VELOCIDADES, estrellasDeResultado,
} from '../utils/canciones';
import { FUENTE_TITULO } from '../theme/fuentes';

// Los pasos de "Aprenderla"
const PASOS_APRENDER = ['acordes', 'cambios', 'tocar'];
const COLORES_DIVISOR = ['rgba(178,140,255,0)', '#b28cff', '#4c52d9', '#b28cff', 'rgba(178,140,255,0)'];
const TITULO_PASO = { acordes: 'Los acordes', cambios: 'Los cambios', tocar: 'Tocala' };
// Los botones de acordes van siempre en un renglón: si no entran a su tamaño, se achican todos por igual
const ANCHO_ACORDE = 68;
const ALTO_ACORDE = 52;
const LETRA_ACORDE = 19;
const SEPARACION_ACORDES = 10;
const ESCALA_MINIMA_ACORDES = 0.45; // Más chico ya no se lee

function Dato({ etiqueta, valor }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.datoValor}>{valor}</Text>
    </View>
  );
}

// Al lado de los datos: el corazón para marcar o desmarcar la canción como favorita
function DatoFavorita({ favorita, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.dato, styles.datoFavorita]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={favorita ? 'Quitar de favoritas' : 'Marcar como favorita'}
      accessibilityState={{ selected: favorita }}
    >
      <Text style={styles.datoEtiqueta}>Favorita</Text>
      <Text style={[styles.corazon, favorita && styles.corazonActivo]}>{favorita ? '♥' : '♡'}</Text>
    </TouchableOpacity>
  );
}

// Cómo se arma un acorde, encima de la pantalla
function DiagramaAcorde({ cancion, nombre, onCerrar }) {
  return (
    <Modal
      visible={!!nombre}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
      supportedOrientations={['landscape', 'landscape-left', 'landscape-right', 'portrait']}
    >
      <Pressable style={styles.fondoModal} onPress={onCerrar} accessibilityLabel="Cerrar">
        {!!nombre && (
          <Pressable style={styles.tarjetaModal} onPress={() => {}}>
            <Text style={styles.tituloModal}>{nombre}</Text>
            <GuitarNeck posiciones={formaDeAcorde(cancion, nombre)} />
            <Text style={styles.ayudaModal}>
              Los números son los dedos. Las cuerdas con ✕ no se tocan.{cancion.capo ? ` Con capo, el traste 0 es el capo (traste ${cancion.capo}).` : ''}
            </Text>
            <Button title="Cerrar" variant="secondary" onPress={onCerrar} />
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
}

// Una opción de dos o más, como botones
function Opciones({ opciones, valor, onCambiar }) {
  return (
    <View style={styles.opciones}>
      {opciones.map((o) => (
        <TouchableOpacity
          key={o.titulo}
          style={[styles.opcion, valor === o.valor && styles.opcionActiva]}
          onPress={() => onCambiar(o.valor)}
          activeOpacity={0.8}
          accessibilityRole="radio"
          accessibilityState={{ selected: valor === o.valor }}
        >
          <Text style={styles.opcionTexto}>{o.titulo}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function CancionScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { perfil } = useContext(AuthContext);
  const id = route.params?.id;
  // Se muestra la que trae la lista mientras se pide la versión actual al backend
  // (si alguien cambió el tempo o el rasgueo, se usa lo último)
  const [original, setOriginal] = useState(route.params?.cancion?.id === id ? route.params.cancion : null);
  const [cargando, setCargando] = useState(!original);
  const [error, setError] = useState(null);
  const [acordeAbierto, setAcordeAbierto] = useState(null);
  // modo: null (la ficha de la canción) | 'aprender' | 'tocar'
  const [modo, setModo] = useState(null);
  const [paso, setPaso] = useState(0);
  const [conCapo, setConCapo] = useState(true);
  // Se elige adentro de "Tocala" (x0.5 o x1); cada vez que se entra arranca en la original
  const [velocidad, setVelocidad] = useState(VELOCIDADES.original);
  const [anchoAcordes, setAnchoAcordes] = useState(0);
  const favoritas = useFavoritasCanciones(perfil?.id).data ?? [];
  const alternarFavorita = useAlternarFavorita(perfil?.id);

  // Sin capo, la app espera las notas de las formas tal cual (suena más grave que la grabación)
  const cancion = useMemo(() => (original && !conCapo ? { ...original, capo: 0 } : original), [original, conCapo]);
  const aprendizaje = useMemo(() => (cancion ? aprendizajeDeCancion(cancion) : null), [cancion]);
  const riff = useMemo(() => (cancion ? riffDeCancion(cancion, velocidad) : null), [cancion, velocidad]);
  const rasgueos = useMemo(() => (cancion ? rasgueosDeCancion(cancion) : []), [cancion]);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      setError(null);
      try {
        const datos = await cancionesService.obtener(id);
        if (!cancelado && datos) setOriginal(datos);
      } catch (e) {
        // Si ya se tiene la de la lista, se sigue con esa
        if (!cancelado) setError(e.message);
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => { cancelado = true; };
  }, [id]);

  const volver = (
    <TouchableOpacity style={styles.volver} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Volver a Canciones">
      <Icono nombre="volver" tamano={18} />
      <Text style={styles.volverTexto}>Canciones</Text>
    </TouchableOpacity>
  );
  const relleno = { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) };

  if (!original) {
    return (
      <Background>
        <View style={[styles.container, relleno]}>
          <ScreenHeader title="Canción" right={volver} />
          {cargando
            ? <ActivityIndicator color="#fff" size="large" />
            : <Text style={styles.texto}>{error || 'No encontramos esta canción.'}</Text>}
        </View>
      </Background>
    );
  }

  // Al tocarla hasta el final a velocidad original se guardan las estrellas (el backend se queda con el mejor resultado).
  // Si no se pudo guardar no se molesta: se vuelve a guardar la próxima vez que se toque.
  const guardarEstrellas = ({ aciertos, total }) => {
    if (velocidad !== VELOCIDADES.original || !perfil?.id) return;
    cancionesService.guardarEstrellas(perfil.id, id, estrellasDeResultado(aciertos, total)).catch(() => {});
  };

  const salir = () => {
    setModo(null);
    setPaso(0);
    setVelocidad(VELOCIDADES.original);
  };

  if (modo) {
    const pasoActual = modo === 'tocar' ? 'tocar' : PASOS_APRENDER[paso];
    const siguiente = () => {
      setPaso((p) => p + 1);
      setVelocidad(VELOCIDADES.original);
    };
    const titulo = modo === 'tocar'
      ? `Tocar: ${cancion.titulo}`
      : `Aprender ${cancion.titulo} · ${paso + 1}/${PASOS_APRENDER.length} ${TITULO_PASO[pasoActual]}`;
    return (
      <Background>
        <View style={[styles.container, relleno, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <ScreenHeader title={titulo} />
          {pasoActual === 'acordes' && (
            <PracticaConDeteccion
              key="acordes"
              secuencia={aprendizaje.acordes}
              onBack={salir}
              onFinish={siguiente}
              textoFinal="Siguiente: los cambios →"
              permitirSaltear={false}
            />
          )}
          {pasoActual === 'cambios' && (
            <PracticaConDeteccion
              key="cambios"
              secuencia={aprendizaje.cambios}
              onBack={() => setPaso(0)}
              onFinish={siguiente}
              textoFinal="Siguiente: tocala →"
              permitirSaltear={false}
            />
          )}
          {pasoActual === 'tocar' && (
            <RiffStep
              key={`tocar-${velocidad}-${conCapo}`}
              riff={riff}
              onBack={modo === 'tocar' ? salir : () => setPaso(1)}
              onFinish={salir}
              textoFinal="¡Listo!"
              permitirSaltear={false}
              velocidad={velocidad}
              velocidades={OPCIONES_VELOCIDAD}
              onCambiarVelocidad={setVelocidad}
              onTerminado={guardarEstrellas}
            />
          )}
        </View>
      </Background>
    );
  }

  const acordes = acordesDeCancion(cancion);
  // Cuánto se achican los acordes para entrar en un renglón (1 = su tamaño normal)
  const anchoNecesario = acordes.length * ANCHO_ACORDE + (acordes.length - 1) * SEPARACION_ACORDES;
  const escala = anchoAcordes > 0 && anchoNecesario > anchoAcordes ? Math.max(ESCALA_MINIMA_ACORDES, anchoAcordes / anchoNecesario) : 1;
  const tamanoAcorde = { width: ANCHO_ACORDE * escala, height: ALTO_ACORDE * escala };

  return (
    <Background>
      <View style={[styles.container, relleno]}>
        <ScreenHeader title={cancion.titulo} right={volver} />

        {/* Sin scroll: dos columnas con lo justo. Si en una pantalla muy baja no entra, la columna se puede deslizar. */}
        <View style={styles.fila}>
          <ScrollView style={styles.columna} contentContainerStyle={styles.columnaContenido} showsVerticalScrollIndicator={false} bounces={false}>
            <Text style={styles.artista}>{cancion.artista}</Text>
            <View style={styles.datos}>
              <Dato etiqueta="Tempo" valor={`~${original.bpm} BPM`} />
              {original.capo > 0 && <Dato etiqueta="Capo" valor={`Traste ${original.capo}`} />}
              <Dato etiqueta="Nivel" valor={nivelDeCancion(cancion)} />
              {perfil?.id ? <DatoFavorita favorita={favoritas.includes(original.id)} onPress={() => alternarFavorita(original)} /> : null}
            </View>

            <Text style={styles.subtitulo}>Acordes</Text>
            <View style={[styles.acordes, { gap: SEPARACION_ACORDES * escala }]} onLayout={(e) => setAnchoAcordes(e.nativeEvent.layout.width)}>
              {acordes.map((a) => (
                <TouchableOpacity key={a} style={[styles.acorde, tamanoAcorde]} onPress={() => setAcordeAbierto(a)} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={`Ver cómo se arma ${a}`}>
                  <Text style={[styles.acordeTexto, { fontSize: LETRA_ACORDE * escala }]} numberOfLines={1} adjustsFontSizeToFit>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.subtitulo}>Rasgueo</Text>
            {rasgueos.map((r) => {
              const cuenta = cuentaDeRasgueo(r.patron);
              const compases = r.compases.map((c) => c.acordes.join(' ')).filter((a, i, todos) => todos.indexOf(a) === i).join('  ·  ');
              return (
                <View key={r.patron} style={styles.rasgueo}>
                  {rasgueos.length > 1 && <Text style={styles.rasgueoCompases}>{compases}</Text>}
                  <Rasgueo rasgueo={{ nombre: compases, golpes: r.golpes, cuenta }} />
                </View>
              );
            })}
          </ScrollView>

          {/* La barra que divide las dos columnas: un degradé violeta que se desvanece en las puntas */}
          <LinearGradient colors={COLORES_DIVISOR} style={styles.divisor} />

          <View style={[styles.columna, styles.acciones]}>
            <TouchableOpacity style={styles.eleccion} onPress={() => setModo('aprender')} activeOpacity={0.85} accessibilityRole="button">
              <Text style={styles.eleccionTitulo}>📘 Aprenderla</Text>
              <Text style={styles.eleccionTexto}>Paso a paso, hasta tocarla entera.</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.eleccion} onPress={() => setModo('tocar')} activeOpacity={0.85} accessibilityRole="button">
              <Text style={styles.eleccionTitulo}>🎸 Tocarla</Text>
              <Text style={styles.eleccionTexto}>Directo a tempo, con los acordes en el mástil.</Text>
            </TouchableOpacity>

            {original.capo > 0 && (
              <View style={styles.capo}>
                <Text style={styles.ayuda}>Capo en el traste {original.capo}. Sin capo suena más grave.</Text>
                <Opciones
                  valor={conCapo}
                  onCambiar={setConCapo}
                  opciones={[{ valor: true, titulo: 'Con capo' }, { valor: false, titulo: 'Sin capo' }]}
                />
              </View>
            )}
          </View>
        </View>
      </View>

      <DiagramaAcorde cancion={cancion} nombre={acordeAbierto} onCerrar={() => setAcordeAbierto(null)} />
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', paddingTop: 12 },
  fila: { flex: 1, flexDirection: 'row', gap: 20, paddingBottom: 12 },
  columna: { flex: 1 },
  divisor: { width: 4, borderRadius: 2, marginVertical: 4 },
  columnaContenido: { gap: 10 },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 12, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)' },
  volverTexto: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  artista: { color: 'rgba(255,255,255,0.9)', fontSize: 19, fontWeight: '600' },
  datos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dato: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.3)' },
  datoEtiqueta: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600' },
  datoValor: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  datoFavorita: { alignItems: 'center' },
  corazon: { color: 'rgba(255,255,255,0.85)', fontSize: 22, lineHeight: 22 },
  corazonActivo: { color: '#ffb3bd' },
  texto: { color: '#fff', fontSize: 16, lineHeight: 22 },
  subtitulo: { color: '#fff', fontSize: 21, fontWeight: 'bold', fontFamily: FUENTE_TITULO, marginTop: 8 },
  ayuda: { color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 21 },
  acordes: { flexDirection: 'row', overflow: 'hidden' },
  acorde: { paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: 'rgba(30,26,92,0.88)', borderWidth: 1.5, borderColor: '#b28cff' },
  acordeTexto: { color: '#fff', fontWeight: 'bold' },
  rasgueo: { gap: 4 },
  rasgueoCompases: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: 'bold' },
  acciones: { gap: 12 },
  eleccion: { flex: 1, justifyContent: 'center', padding: 18, borderRadius: 16, backgroundColor: 'rgba(30,26,92,0.88)', borderWidth: 1.5, borderColor: '#b28cff', gap: 6 },
  eleccionTitulo: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  eleccionTexto: { color: 'rgba(255,255,255,0.9)', fontSize: 16, lineHeight: 22 },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcion: { minHeight: 48, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.3)' },
  opcionActiva: { backgroundColor: '#4c52d9' },
  opcionTexto: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  capo: { padding: 14, borderRadius: 14, backgroundColor: 'rgba(255,211,92,0.12)', borderWidth: 1, borderColor: 'rgba(255,211,92,0.4)', gap: 6 },
  fondoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  tarjetaModal: { width: '100%', maxWidth: 640, padding: 16, borderRadius: 18, backgroundColor: '#2b2660', gap: 10 },
  tituloModal: { color: '#fff', fontSize: 20, fontWeight: 'bold', fontFamily: FUENTE_TITULO, textAlign: 'center' },
  ayudaModal: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center' },
});
