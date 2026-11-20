// Archivo: src/screens/CancionesScreen.js
// Catálogo de canciones para tocar con lo aprendido. Se puede buscar por título o artista
// y filtrar las fáciles (solo usan los acordes del curso "Acordes"). Las canciones vienen del backend.
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { ScreenHeader } from '../components/ScreenHeader';
import { Button } from '../components/Button';
import { ListaSkeleton } from '../components/Skeleton';
import { useCanciones, useActualizarAlEnfocar, mensajeError } from '../hooks/useConsultas';
import { acordesDeCancion, filtrarCanciones, nivelDeCancion, rasgueosDeCancion, textoDeRasgueo } from '../utils/canciones';

const FILTROS = [
  { id: null, titulo: 'Todas' },
  { id: 'Fácil', titulo: 'Fáciles' },
  { id: 'Intermedia', titulo: 'Intermedias' },
];

function TarjetaCancion({ cancion, onPress }) {
  const nivel = nivelDeCancion(cancion);
  const acordes = acordesDeCancion(cancion);
  const rasgueos = rasgueosDeCancion(cancion);
  const rasgueo = rasgueos.length === 1 ? textoDeRasgueo(rasgueos[0].patron) : `${rasgueos.length} patrones`;
  return (
    <TouchableOpacity
      style={styles.tarjeta}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${cancion.titulo}, de ${cancion.artista}. ${nivel}. Acordes: ${acordes.join(', ')}`}
    >
      <View style={styles.tarjetaArriba}>
        <View style={styles.tarjetaTextos}>
          <Text style={styles.titulo} numberOfLines={1}>{cancion.titulo}</Text>
          <Text style={styles.artista} numberOfLines={1}>{cancion.artista}</Text>
        </View>
        <Text style={[styles.nivel, nivel === 'Fácil' ? styles.nivelFacil : styles.nivelIntermedio]}>{nivel}</Text>
      </View>
      <View style={styles.acordes}>
        {acordes.map((a) => <Text key={a} style={styles.acorde}>{a}</Text>)}
      </View>
      <Text style={styles.datos}>
        ~{cancion.bpm} BPM  •  Rasgueo: {rasgueo}{cancion.capo ? `  •  Capo ${cancion.capo}` : ''}
      </Text>
    </TouchableOpacity>
  );
}

export function CancionesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [busqueda, setBusqueda] = useState('');
  const [nivel, setNivel] = useState(null);
  // Con caché: las canciones aparecen al instante y se actualizan en segundo plano (cambios de tempo, rasgueo…)
  const consulta = useCanciones();
  useActualizarAlEnfocar(consulta);
  const todas = consulta.data ?? [];
  const cargando = consulta.isPending;
  const error = mensajeError(consulta);
  const canciones = useMemo(() => filtrarCanciones(todas, busqueda, nivel), [todas, busqueda, nivel]);

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
        <ScreenHeader title="Canciones" />

        <View style={styles.barra}>
          <TextInput
            style={styles.buscador}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar canción o artista"
            placeholderTextColor="rgba(255,255,255,0.55)"
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Buscar canción o artista"
          />
          <View style={styles.filtros} accessibilityRole="tablist">
            {FILTROS.map((f) => {
              const activo = f.id === nivel;
              return (
                <TouchableOpacity
                  key={f.titulo}
                  style={[styles.filtro, activo && styles.filtroActivo]}
                  onPress={() => setNivel(f.id)}
                  activeOpacity={0.8}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activo }}
                >
                  <Text style={styles.filtroTexto}>{f.titulo}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <FlatList
          data={canciones}
          keyExtractor={(c) => c.id}
          numColumns={2}
          columnWrapperStyle={styles.columnas}
          contentContainerStyle={[styles.lista, { paddingBottom: Math.max(insets.bottom, 16) }]}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={8}
          windowSize={5}
          renderItem={({ item }) => <TarjetaCancion cancion={item} onPress={() => navigation.navigate('Cancion', { id: item.id, cancion: item })} />}
          ListEmptyComponent={
            cargando ? <ListaSkeleton cantidad={4} alto={92} style={styles.cargando} />
              : error ? (
                <View style={styles.errorCaja}>
                  <Text style={styles.vacio}>{error}</Text>
                  <Button title="Reintentar" onPress={() => consulta.refetch()} />
                </View>
              )
                : <Text style={styles.vacio}>{todas.length ? 'No encontramos canciones con esa búsqueda.' : 'Todavía no hay canciones.'}</Text>
          }
          ListFooterComponent={
            <Text style={styles.nota}>
              Las fáciles se tocan con un golpe por acorde y solo usan los acordes del curso "Acordes" (Em, Am, D, A, E, C, G y B7). Las intermedias tienen rasgueo o suman otros acordes, como los de cejilla.
            </Text>
          }
        />
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', paddingTop: 12 },
  barra: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 10 },
  buscador: { flexGrow: 1, flexBasis: 220, minHeight: 44, paddingHorizontal: 14, borderRadius: 10, color: '#fff', fontSize: 15, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  filtros: { flexDirection: 'row', gap: 6 },
  filtro: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)' },
  filtroActivo: { backgroundColor: '#4c52d9' },
  filtroTexto: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  lista: { gap: 10 },
  columnas: { gap: 10 },
  tarjeta: { flex: 1, padding: 14, borderRadius: 16, backgroundColor: 'rgba(17,17,34,0.85)', borderWidth: 1, borderColor: 'rgba(178,140,255,0.25)', gap: 8 },
  tarjetaArriba: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tarjetaTextos: { flex: 1 },
  titulo: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  artista: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  nivel: { fontSize: 12, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  nivelFacil: { color: '#0d3a17', backgroundColor: '#a3fba3' },
  nivelIntermedio: { color: '#3d2a00', backgroundColor: '#ffd35c' },
  acordes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  acorde: { color: '#fff', fontSize: 13, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden', backgroundColor: 'rgba(76,82,217,0.6)' },
  datos: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  cargando: { marginTop: 30 },
  errorCaja: { alignItems: 'center', gap: 12 },
  vacio: { color: '#fff', textAlign: 'center', marginTop: 30, fontSize: 15 },
  nota: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginTop: 6 },
});
