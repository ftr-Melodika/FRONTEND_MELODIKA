// Archivo: src/screens/RankingGrupoScreen.js
// Ranking de XP entre los miembros de un grupo que aceptaron la invitación.
import { Icono, TextoConIcono, COLORES_ICONO } from '../components/icono/Icono';
import { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { ListaSkeleton } from '../components/Skeleton';
import { ScreenHeader } from '../components/ScreenHeader';
import { AuthContext } from '../context/AuthContext';
import { useRankingGrupo, useActualizarAlEnfocar, mensajeError } from '../hooks/useConsultas';

const MEDALLAS = [
  { nombre: 'medalla1', acento: COLORES_ICONO.oro },
  { nombre: 'medalla2', acento: COLORES_ICONO.plata },
  { nombre: 'medalla3', acento: COLORES_ICONO.bronce },
];

export function RankingGrupoScreen({ route, navigation }) {
  const { grupoId, nombre: nombreGrupo } = route.params;
  const insets = useSafeAreaInsets();
  const { perfil } = useContext(AuthContext);
  // Con caché: si ya se vio, aparece al instante y se actualiza en segundo plano
  const consulta = useRankingGrupo(perfil?.id, grupoId);
  useActualizarAlEnfocar(consulta);
  const ranking = consulta.data?.participantes ?? [];
  const loading = consulta.isPending;
  const error = mensajeError(consulta);

  const renderItem = ({ item, index }) => {
    const posicion = item.posicion ?? index + 1;
    const esYo = (item.id && item.id === perfil?.id) || item.username === perfil?.username;
    const nombre = item.username || item.nombre || 'Jugador';
    return (
      <TouchableOpacity
        style={[styles.row, esYo && styles.rowYo]}
        onPress={() => navigation.navigate('PerfilPublico', { perfilId: item.id })}
        activeOpacity={0.7}
      >
        {MEDALLAS[posicion - 1] ? (
          <View style={styles.medalla}><Icono {...MEDALLAS[posicion - 1]} tamano={32} /></View>
        ) : (
          <Text style={styles.posicion}>#{posicion}</Text>
        )}
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarInicial]}>
            <Text style={styles.inicial}>{nombre.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.nombre} numberOfLines={1}>@{nombre}{esYo ? '  (vos)' : ''}</Text>
        <TextoConIcono nombre="llama" tamano={16} acento={COLORES_ICONO.llama} contenedorStyle={styles.rachaFila} style={styles.racha}>{item.racha ?? 0}</TextoConIcono>
        <Text style={styles.xp}>{item.xp ?? 0} XP</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20) }]}>
        <ScreenHeader title={nombreGrupo ? `Ranking · ${nombreGrupo}` : 'Ranking del grupo'} />

        {!!error && <Text style={styles.mensaje}>{error}</Text>}
        {!loading && !error && ranking.length === 0 && (
          <Text style={styles.mensaje}>Nadie aceptó la invitación todavía.</Text>
        )}

        {loading && <ListaSkeleton cantidad={6} alto={54} />}
        <FlatList
          data={ranking}
          keyExtractor={(item, index) => String(item.id ?? item.username ?? index)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          initialNumToRender={12}
          windowSize={5}
        />
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, width: '100%' },
  mensaje: { color: 'rgba(255,255,255,0.8)', fontSize: 15, textAlign: 'center', marginTop: 20 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 15, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  rowYo: { borderColor: '#b28cff', backgroundColor: 'rgba(178,140,255,0.15)' },
  medalla: { width: 44, alignItems: 'center' },
  posicion: { color: '#fff', fontSize: 18, fontWeight: 'bold', width: 44, textAlign: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, marginHorizontal: 12, borderWidth: 1, borderColor: '#b28cff' },
  avatarInicial: { backgroundColor: '#b28cff', justifyContent: 'center', alignItems: 'center' },
  inicial: { color: '#fff', fontWeight: 'bold' },
  nombre: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 },
  rachaFila: { width: 60, justifyContent: 'flex-end' },
  racha: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  xp: { color: '#a3fba3', fontSize: 15, fontWeight: 'bold', width: 90, textAlign: 'right' },
});
