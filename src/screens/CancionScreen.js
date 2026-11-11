// Archivo: src/screens/CancionScreen.js
// Una canción: tempo, compás, capo, acordes (tocando uno se ve cómo se arma), rasgueo con
// metrónomo y la estructura compás por compás. Se pueden practicar los cambios con el micrófono.
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { ScreenHeader } from '../components/ScreenHeader';
import { Icono } from '../components/icono/Icono';
import { Button } from '../components/Button';
import { GuitarNeck } from '../components/leccion/GuitarNeck';
import { PracticaConDeteccion } from '../components/leccion/PracticeStep';
import { Metronomo } from '../components/canciones/Metronomo';
import { CANCIONES, RASGUEOS } from '../data/canciones';
import { FORMAS_ACORDES, tituloDeAcorde } from '../utils/acordes';
import { acordesDeCancion, acordesDeCompas, nivelDeCancion, secuenciaDeCancion } from '../utils/canciones';
import { FUENTE_TITULO } from '../theme/fuentes';

function Dato({ etiqueta, valor }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.datoValor}>{valor}</Text>
    </View>
  );
}

// Cómo se arma un acorde, encima de la pantalla
function DiagramaAcorde({ nombre, onCerrar }) {
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
            <Text style={styles.tituloModal}>{nombre} · {tituloDeAcorde(nombre)}</Text>
            <GuitarNeck posiciones={FORMAS_ACORDES[nombre]} />
            <Text style={styles.ayudaModal}>Los números son los dedos. Las cuerdas con ✕ no se tocan.</Text>
            <Button title="Cerrar" variant="secondary" onPress={onCerrar} />
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
}

export function CancionScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const cancion = CANCIONES.find((c) => c.id === route.params?.id);
  const [acordeAbierto, setAcordeAbierto] = useState(null);
  const [practicando, setPracticando] = useState(false);
  const [conCapo, setConCapo] = useState(false);
  const secuencia = useMemo(() => (cancion ? secuenciaDeCancion(cancion, conCapo) : []), [cancion, conCapo]);

  const volver = (
    <TouchableOpacity style={styles.volver} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Volver a Canciones">
      <Icono nombre="volver" tamano={18} />
      <Text style={styles.volverTexto}>Canciones</Text>
    </TouchableOpacity>
  );
  const relleno = { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) };

  if (!cancion) {
    return (
      <Background>
        <View style={[styles.container, relleno]}>
          <ScreenHeader title="Canción" right={volver} />
          <Text style={styles.texto}>No encontramos esta canción.</Text>
        </View>
      </Background>
    );
  }

  const rasgueo = RASGUEOS[cancion.rasgueo];
  const acordes = acordesDeCancion(cancion);

  if (practicando) {
    return (
      <Background>
        <View style={[styles.container, relleno, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <ScreenHeader title={`Practicar: ${cancion.titulo}`} />
          <PracticaConDeteccion
            secuencia={secuencia}
            onBack={() => setPracticando(false)}
            onFinish={() => setPracticando(false)}
            textoFinal="¡Listo!"
            permitirSaltear={false}
          />
        </View>
      </Background>
    );
  }

  return (
    <Background>
      <View style={[styles.container, relleno]}>
        <ScreenHeader title={cancion.titulo} right={volver} />

        <View style={styles.fila}>
          <ScrollView style={styles.columna} contentContainerStyle={[styles.columnaContenido, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Text style={styles.artista}>{cancion.artista} · {cancion.anio}</Text>
            <View style={styles.datos}>
              <Dato etiqueta="Tempo" valor={`~${cancion.bpm} BPM`} />
              <Dato etiqueta="Compás" valor={cancion.compas} />
              <Dato etiqueta="Tonalidad" valor={cancion.tonalidad} />
              <Dato etiqueta="Capo" valor={cancion.capo ? `Traste ${cancion.capo}` : 'No'} />
              <Dato etiqueta="Nivel" valor={nivelDeCancion(cancion)} />
            </View>
            <Text style={styles.texto}>{cancion.consejo}</Text>

            <Text style={styles.subtitulo}>Acordes</Text>
            <Text style={styles.ayuda}>Tocá un acorde para ver cómo se arma.</Text>
            <View style={styles.acordes}>
              {acordes.map((a) => (
                <TouchableOpacity key={a} style={styles.acorde} onPress={() => setAcordeAbierto(a)} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={`Ver cómo se arma ${tituloDeAcorde(a)}`}>
                  <Text style={styles.acordeTexto}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.subtitulo}>Rasgueo: {rasgueo.nombre}</Text>
            <Text style={styles.ayuda}>{rasgueo.descripcion}</Text>
            <Metronomo bpmOriginal={cancion.bpm} pulsos={cancion.pulsosPorCompas} rasgueo={rasgueo} />
            {cancion.rasgueo !== 'basico' && cancion.pulsosPorCompas === 4 && (
              <Text style={styles.ayuda}>¿Te cuesta? Empezá con el rasgueo básico (↓ ↓ ↓ ↓) y bajá el tempo con el −.</Text>
            )}
          </ScrollView>

          <ScrollView style={styles.columna} contentContainerStyle={[styles.columnaContenido, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Text style={styles.subtitulo}>Estructura</Text>
            <Text style={styles.ayuda}>Cada cuadro es un compás ({cancion.compas}). Repetí cada parte las veces que pida la canción.</Text>
            {cancion.secciones.map((seccion) => (
              <View key={seccion.nombre} style={styles.seccion}>
                <Text style={styles.seccionNombre}>{seccion.nombre}</Text>
                <View style={styles.compases}>
                  {seccion.compases.map((compas, i) => (
                    <View key={i} style={styles.compas}>
                      {acordesDeCompas(compas).map((a, j) => (
                        <Text key={j} style={styles.compasAcorde} onPress={() => setAcordeAbierto(a)}>{a}</Text>
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {cancion.capo > 0 && (
              <View style={styles.capo}>
                <Text style={styles.subtitulo}>Capo en el traste {cancion.capo}</Text>
                <Text style={styles.texto}>
                  El capo es una pinza que aprieta todas las cuerdas en un traste. Los acordes se arman igual, contando los trastes desde el capo, y así suenan como en la grabación. Si no tenés, tocala igual: suena más grave, pero los acordes son los mismos.
                </Text>
                <View style={styles.opcionesCapo}>
                  {[{ valor: false, titulo: 'Sin capo' }, { valor: true, titulo: `Con capo (traste ${cancion.capo})` }].map((o) => (
                    <TouchableOpacity
                      key={o.titulo}
                      style={[styles.opcionCapo, conCapo === o.valor && styles.opcionCapoActiva]}
                      onPress={() => setConCapo(o.valor)}
                      activeOpacity={0.8}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: conCapo === o.valor }}
                    >
                      <Text style={styles.acordeTexto}>{o.titulo}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <Button
              title="Practicar los cambios"
              iconoDerecha="adelante"
              onPress={() => setPracticando(true)}
              style={styles.practicar}
            />
            <Text style={styles.ayuda}>
              El micrófono te escucha y avanza cuando suena cada acorde, en el orden de la canción{cancion.capo ? (conCapo ? ', con capo' : ', sin capo') : ''}.
            </Text>
          </ScrollView>
        </View>
      </View>

      <DiagramaAcorde nombre={acordeAbierto} onCerrar={() => setAcordeAbierto(null)} />
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
  seccion: { padding: 10, borderRadius: 12, backgroundColor: 'rgba(17,17,34,0.8)', gap: 6 },
  seccionNombre: { color: '#b28cff', fontSize: 14, fontWeight: 'bold' },
  compases: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  compas: { flexDirection: 'row', gap: 8, minWidth: 54, minHeight: 40, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  compasAcorde: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  capo: { padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,211,92,0.12)', borderWidth: 1, borderColor: 'rgba(255,211,92,0.4)', gap: 6 },
  opcionesCapo: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcionCapo: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.3)' },
  opcionCapoActiva: { backgroundColor: '#4c52d9' },
  practicar: { marginTop: 8, backgroundColor: '#4c52d9' },
  fondoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  tarjetaModal: { width: '100%', maxWidth: 640, padding: 16, borderRadius: 18, backgroundColor: '#2b2660', gap: 10 },
  tituloModal: { color: '#fff', fontSize: 20, fontWeight: 'bold', fontFamily: FUENTE_TITULO, textAlign: 'center' },
  ayudaModal: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center' },
});
