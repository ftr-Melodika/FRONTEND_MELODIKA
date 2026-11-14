// Archivo: src/screens/CancionScreen.js
// Una canción: acordes, rasgueo, tempo y capo. Se elige entre aprenderla o tocarla:
// - Aprenderla: 1) cada acorde, cuerda por cuerda y después rasgueado; 2) los cambios entre
//   acordes de la canción; 3) tocarla.
// - Tocarla: los acordes avanzan por el mástil y se rasguea cada uno cuando llega a la línea.
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { ScreenHeader } from '../components/ScreenHeader';
import { Icono } from '../components/icono/Icono';
import { Button } from '../components/Button';
import { GuitarNeck } from '../components/leccion/GuitarNeck';
import { PracticaConDeteccion } from '../components/leccion/PracticeStep';
import { RiffStep } from '../components/leccion/RiffStep';
import { CANCIONES, REFERENCIAS_RASGUEO } from '../data/canciones';
import {
  acordesDeCancion, acordesDeCompas, aprendizajeDeCancion, formaDeAcorde, nivelDeCancion, riffDeCancion, VELOCIDADES,
} from '../utils/canciones';
import { FUENTE_TITULO } from '../theme/fuentes';

// Los pasos de "Aprenderla"
const PASOS_APRENDER = ['acordes', 'cambios', 'tocar'];
const TITULO_PASO = { acordes: 'Los acordes', cambios: 'Los cambios', tocar: 'Tocala' };

function Dato({ etiqueta, valor }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.datoValor}>{valor}</Text>
    </View>
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
  const original = CANCIONES.find((c) => c.id === route.params?.id);
  const [acordeAbierto, setAcordeAbierto] = useState(null);
  // modo: null (la ficha de la canción) | 'aprender' | 'tocar'
  const [modo, setModo] = useState(null);
  const [paso, setPaso] = useState(0);
  const [conCapo, setConCapo] = useState(true);
  const [velocidad, setVelocidad] = useState(VELOCIDADES.lenta);

  // Sin capo, la app espera las notas de las formas tal cual (suena más grave que la grabación)
  const cancion = useMemo(() => (original && !conCapo ? { ...original, capo: 0 } : original), [original, conCapo]);
  const aprendizaje = useMemo(() => (cancion ? aprendizajeDeCancion(cancion) : null), [cancion]);
  const riff = useMemo(() => (cancion ? riffDeCancion(cancion, velocidad) : null), [cancion, velocidad]);

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
          <Text style={styles.texto}>No encontramos esta canción.</Text>
        </View>
      </Background>
    );
  }

  const salir = () => {
    setModo(null);
    setPaso(0);
  };

  if (modo) {
    const pasoActual = modo === 'tocar' ? 'tocar' : PASOS_APRENDER[paso];
    const siguiente = () => setPaso((p) => p + 1);
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
            />
          )}
        </View>
      </Background>
    );
  }

  const acordes = acordesDeCancion(cancion);

  return (
    <Background>
      <View style={[styles.container, relleno]}>
        <ScreenHeader title={cancion.titulo} right={volver} />

        <View style={styles.fila}>
          <ScrollView style={styles.columna} contentContainerStyle={[styles.columnaContenido, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Text style={styles.artista}>{cancion.artista}</Text>
            <View style={styles.datos}>
              <Dato etiqueta="Tempo" valor={`~${original.bpm} BPM`} />
              <Dato etiqueta="Compás" valor="4/4" />
              <Dato etiqueta="Capo" valor={original.capo ? `Traste ${original.capo}` : 'No'} />
              <Dato etiqueta="Nivel" valor={nivelDeCancion(cancion)} />
            </View>
            <Text style={styles.texto}>{cancion.consejo}</Text>

            <Text style={styles.subtitulo}>Acordes</Text>
            <Text style={styles.ayuda}>Tocá un acorde para ver cómo se arma.</Text>
            <View style={styles.acordes}>
              {acordes.map((a) => (
                <TouchableOpacity key={a} style={styles.acorde} onPress={() => setAcordeAbierto(a)} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={`Ver cómo se arma ${a}`}>
                  <Text style={styles.acordeTexto}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.subtitulo}>Progresión</Text>
            <Text style={styles.ayuda}>Cada cuadro es un compás de 4 tiempos y se repite en toda la canción.</Text>
            <View style={styles.compases}>
              {cancion.progresion.map((compas, i) => (
                <View key={i} style={styles.compas}>
                  {acordesDeCompas(compas).map((a, j) => (
                    <Text key={j} style={styles.compasAcorde} onPress={() => setAcordeAbierto(a)}>{a}</Text>
                  ))}
                </View>
              ))}
            </View>

            <Text style={styles.subtitulo}>Rasgueo</Text>
            <Text style={styles.rasgueo}>{cancion.rasgueo}</Text>
            <Text style={styles.ayuda}>{REFERENCIAS_RASGUEO}</Text>
          </ScrollView>

          <ScrollView style={styles.columna} contentContainerStyle={[styles.columnaContenido, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Text style={styles.subtitulo}>¿Qué querés hacer?</Text>
            <TouchableOpacity style={styles.eleccion} onPress={() => setModo('aprender')} activeOpacity={0.85} accessibilityRole="button">
              <Text style={styles.eleccionTitulo}>📘 Aprenderla</Text>
              <Text style={styles.eleccionTexto}>
                Paso a paso: cada acorde (cuerda por cuerda y después rasgueado), los cambios entre acordes y al final la tocás entera.
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.eleccion} onPress={() => setModo('tocar')} activeOpacity={0.85} accessibilityRole="button">
              <Text style={styles.eleccionTitulo}>🎸 Tocarla</Text>
              <Text style={styles.eleccionTexto}>
                Directo a tempo: los acordes avanzan por el mástil y rasgueás cada uno cuando llega a la línea.
              </Text>
            </TouchableOpacity>

            <Text style={styles.subtitulo}>Velocidad para tocarla</Text>
            <Opciones
              valor={velocidad}
              onCambiar={setVelocidad}
              opciones={[
                { valor: VELOCIDADES.lenta, titulo: `Lenta (${Math.round(original.bpm * VELOCIDADES.lenta)} BPM)` },
                { valor: VELOCIDADES.original, titulo: `Original (${original.bpm} BPM)` },
              ]}
            />

            {original.capo > 0 && (
              <View style={styles.capo}>
                <Text style={styles.subtitulo}>Capo en el traste {original.capo}</Text>
                <Text style={styles.texto}>
                  El capo es una pinza que aprieta todas las cuerdas en un traste. Los acordes se arman igual, contando los trastes desde el capo, y así suenan como en la grabación. Si no tenés, tocala igual: suena más grave, pero los acordes son los mismos.
                </Text>
                <Opciones
                  valor={conCapo}
                  onCambiar={setConCapo}
                  opciones={[{ valor: true, titulo: `Con capo (traste ${original.capo})` }, { valor: false, titulo: 'Sin capo' }]}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      <DiagramaAcorde cancion={cancion} nombre={acordeAbierto} onCerrar={() => setAcordeAbierto(null)} />
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', paddingTop: 12 },
  fila: { flex: 1, flexDirection: 'row', gap: 16 },
  columna: { flex: 1 },
  columnaContenido: { gap: 8 },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 12, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)' },
  volverTexto: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  artista: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
  datos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dato: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.3)' },
  datoEtiqueta: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '600' },
  datoValor: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  texto: { color: '#fff', fontSize: 14, lineHeight: 20 },
  subtitulo: { color: '#fff', fontSize: 17, fontWeight: 'bold', fontFamily: FUENTE_TITULO, marginTop: 6 },
  ayuda: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  acordes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  acorde: { minWidth: 56, minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: '#4c52d9' },
  acordeTexto: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  compases: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  compas: { flexDirection: 'row', gap: 8, minWidth: 54, minHeight: 40, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  compasAcorde: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  rasgueo: { color: '#fff', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  eleccion: { padding: 12, borderRadius: 14, backgroundColor: 'rgba(76,82,217,0.85)', gap: 4 },
  eleccionTitulo: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  eleccionTexto: { color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 18 },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcion: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.3)' },
  opcionActiva: { backgroundColor: '#4c52d9' },
  opcionTexto: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  capo: { padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,211,92,0.12)', borderWidth: 1, borderColor: 'rgba(255,211,92,0.4)', gap: 6 },
  fondoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  tarjetaModal: { width: '100%', maxWidth: 640, padding: 16, borderRadius: 18, backgroundColor: '#2b2660', gap: 10 },
  tituloModal: { color: '#fff', fontSize: 20, fontWeight: 'bold', fontFamily: FUENTE_TITULO, textAlign: 'center' },
  ayudaModal: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center' },
});
