// Archivo: src/screens/RankingScreen.js
// Los rankings en los que participo, uno por grupo. Ya no hay ranking global:
// se entra aceptando la invitación que alguien manda al chat de un grupo.
import { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Button } from '../components/Button';
import { ListaSkeleton } from '../components/Skeleton';
import { ScreenHeader } from '../components/ScreenHeader';
import { AuthContext } from '../context/AuthContext';
import { useMisRankings, useActualizarAlEnfocar, mensajeError } from '../hooks/useConsultas';

const textoParticipantes = (n) => `${n ?? 0} ${n === 1 ? 'participante' : 'participantes'}`;

export function RankingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { perfil } = useContext(AuthContext);
  // Con caché: si ya se vio, aparece al instante y se actualiza en segundo plano
  const consulta = useMisRankings(perfil?.id);
  useActualizarAlEnfocar(consulta);
  const rankings = consulta.data ?? [];
  const loading = consulta.isPending;
  const error = mensajeError(consulta);

  const abrir = (item) => navigation.navigate('RankingGrupo', { grupoId: item.grupoId, nombre: item.grupoNombre });

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20) }]}>
        <ScreenHeader title="Mis rankings" />

        {!!error && <Text style={styles.mensaje}>{error}</Text>}
        {!loading && !error && rankings.length === 0 && (
          <View style={styles.vacioCaja}>
            <Text style={styles.mensaje}>
              Todavía no estás en ningún ranking. Invitá a tus amigos desde el chat de un grupo, o aceptá una invitación.
            </Text>
            <Button title="Ir a mis grupos" variant="secondary" onPress={() => navigation.navigate('Grupos')} style={styles.vacioBoton} />
          </View>
        )}

        {loading && <ListaSkeleton cantidad={4} alto={62} />}
        <FlatList
          data={rankings}
          keyExtractor={(item) => String(item.grupoId)}
          contentContainerStyle={{ paddingBottom: 20 }}
          initialNumToRender={10}
          windowSize={5}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.fila} onPress={() => abrir(item)} activeOpacity={0.7}>
              <View style={styles.textos}>
                <Text style={styles.nombre} numberOfLines={1}>{item.grupoNombre}</Text>
                <Text style={styles.detalle}>{textoParticipantes(item.totalParticipantes)}</Text>
              </View>
              {!!item.miPosicion && <Text style={styles.posicion}>#{item.miPosicion}</Text>}
            </TouchableOpacity>
          )}
        />
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, width: '100%' },
  mensaje: { color: 'rgba(255,255,255,0.8)', fontSize: 15, textAlign: 'center', marginTop: 20 },
  vacioCaja: { alignItems: 'center' },
  vacioBoton: { width: 220, marginTop: 12 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  textos: { flex: 1, minWidth: 0 },
  nombre: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  detalle: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  posicion: { color: '#a3fba3', fontSize: 18, fontWeight: 'bold' },
});
