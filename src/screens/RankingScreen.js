// Archivo: src/screens/RankingScreen.js
import { useCallback, useContext, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { LoadingModal } from '../components/LoadingModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { AuthContext } from '../context/AuthContext';
import { perfilesService } from '../services/perfilesService';

const MEDALLAS = ['🥇', '🥈', '🥉'];

export function RankingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { perfil } = useContext(AuthContext);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const datos = await perfilesService.obtenerRanking();
          if (!cancelado) setRanking(datos);
        } catch (e) {
          if (!cancelado) setError(e.message);
        } finally {
          if (!cancelado) setLoading(false);
        }
      })();
      return () => { cancelado = true; };
    }, [])
  );

  const renderItem = ({ item, index }) => {
    const posicion = item.posicion ?? index + 1;
    const esYo = (item.id && item.id === perfil?.id) || item.username === perfil?.username;
    const nombre = item.username || item.nombre || 'Jugador';
    return (
      <View style={[styles.row, esYo && styles.rowYo]}>
        <Text style={styles.posicion}>{MEDALLAS[posicion - 1] || `#${posicion}`}</Text>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarInicial]}>
            <Text style={styles.inicial}>{nombre.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.nombre} numberOfLines={1}>@{nombre}{esYo ? '  (vos)' : ''}</Text>
        <Text style={styles.racha}>🔥 {item.racha ?? 0}</Text>
        <Text style={styles.xp}>{item.xp ?? 0} XP</Text>
      </View>
    );
  };

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20) }]}>
        <ScreenHeader title="Ranking global" />

        {!!error && <Text style={styles.mensaje}>{error}</Text>}
        {!loading && !error && ranking.length === 0 && (
          <Text style={styles.mensaje}>Todavía no hay jugadores en el ranking.</Text>
        )}

        <FlatList
          data={ranking}
          keyExtractor={(item, index) => String(item.id ?? item.username ?? index)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
      <LoadingModal visible={loading} text="Cargando ranking..." />
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, width: '100%' },
  mensaje: { color: 'rgba(255,255,255,0.8)', fontSize: 15, textAlign: 'center', marginTop: 20 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 15, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  rowYo: { borderColor: '#b28cff', backgroundColor: 'rgba(178,140,255,0.15)' },
  posicion: { color: '#fff', fontSize: 18, fontWeight: 'bold', width: 44, textAlign: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, marginHorizontal: 12, borderWidth: 1, borderColor: '#b28cff' },
  avatarInicial: { backgroundColor: '#b28cff', justifyContent: 'center', alignItems: 'center' },
  inicial: { color: '#fff', fontWeight: 'bold' },
  nombre: { color: '#fff', fontSize: 15, fontWeight: '600', flex: 1 },
  racha: { color: 'rgba(255,255,255,0.8)', fontSize: 14, width: 60, textAlign: 'right' },
  xp: { color: '#a3fba3', fontSize: 15, fontWeight: 'bold', width: 90, textAlign: 'right' },
});
