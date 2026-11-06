// Archivo: src/screens/SolicitudesScreen.js
// Portal social: aceptar o rechazar solicitudes, ver las enviadas y la lista de amigos.
import { useCallback, useContext, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Button } from '../components/Button';
import { LoadingModal } from '../components/LoadingModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { AvatarUsuario } from '../components/AvatarUsuario';
import { AuthContext } from '../context/AuthContext';
import { amistadesService } from '../services/amistadesService';

const VACIO = {
  recibidas: 'No tenés solicitudes pendientes.',
  enviadas: 'No enviaste solicitudes. Buscá músicos en el ranking global.',
  amigos: 'Todavía no tenés amigos. Buscá músicos en el ranking global.',
};

export function SolicitudesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { perfil } = useContext(AuthContext);
  const miId = perfil?.id;

  const [pestana, setPestana] = useState('recibidas');
  const [listas, setListas] = useState({ recibidas: [], enviadas: [], amigos: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);

  const pedirListas = useCallback(async () => {
    const [solicitudes, amigos] = await Promise.all([
      amistadesService.obtenerSolicitudes(miId),
      amistadesService.obtenerAmigos(miId),
    ]);
    return { ...solicitudes, amigos };
  }, [miId]);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const datos = await pedirListas();
          if (!cancelado) setListas(datos);
        } catch (e) {
          if (!cancelado) setError(e.message);
        } finally {
          if (!cancelado) setLoading(false);
        }
      })();
      return () => { cancelado = true; };
    }, [pedirListas])
  );

  const ejecutar = async (amistadId, accion) => {
    setProcesandoId(amistadId);
    setError(null);
    try {
      await accion();
      setListas(await pedirListas());
    } catch (e) {
      setError(e.message);
    } finally {
      setProcesandoId(null);
    }
  };

  const responder = (amistadId, accion) =>
    ejecutar(amistadId, () => amistadesService.responderSolicitud(miId, amistadId, accion));
  const cancelar = (amistadId) =>
    ejecutar(amistadId, () => amistadesService.eliminarAmistad(miId, amistadId));

  const renderItem = ({ item }) => {
    const ocupado = procesandoId === item.amistadId;
    return (
      <View style={styles.fila}>
        <TouchableOpacity
          style={styles.usuario}
          onPress={() => navigation.navigate('PerfilPublico', { perfilId: item.perfil.id })}
          activeOpacity={0.7}
        >
          <AvatarUsuario nombre={item.perfil.nombre} foto={item.perfil.avatarUrl} />
          <View style={styles.textos}>
            <Text style={styles.nombre} numberOfLines={1}>{item.perfil.nombre}</Text>
            <Text style={styles.username} numberOfLines={1}>@{item.perfil.username}</Text>
          </View>
        </TouchableOpacity>

        {pestana === 'recibidas' && (
          <View style={styles.botones}>
            <Button title="Aceptar" onPress={() => responder(item.amistadId, 'aceptar')} loading={ocupado} disabled={!!procesandoId} style={styles.boton} />
            <Button title="Rechazar" variant="danger" onPress={() => responder(item.amistadId, 'rechazar')} disabled={!!procesandoId} style={styles.boton} />
          </View>
        )}
        {pestana === 'enviadas' && (
          <Button title="Cancelar" variant="secondary" onPress={() => cancelar(item.amistadId)} loading={ocupado} disabled={!!procesandoId} style={styles.boton} />
        )}
      </View>
    );
  };

  const pestanas = [
    { id: 'recibidas', titulo: 'Recibidas' },
    { id: 'enviadas', titulo: 'Enviadas' },
    { id: 'amigos', titulo: 'Amigos' },
  ];

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
        <ScreenHeader title="Solicitudes y amigos" />

        <View style={styles.pestanas}>
          {pestanas.map(({ id, titulo }) => (
            <TouchableOpacity
              key={id}
              style={[styles.pestana, pestana === id && styles.pestanaActiva]}
              onPress={() => setPestana(id)}
              activeOpacity={0.8}
            >
              <Text style={styles.pestanaTexto}>{titulo} ({listas[id].length})</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}
        {!loading && !error && listas[pestana].length === 0 && <Text style={styles.vacio}>{VACIO[pestana]}</Text>}

        <FlatList
          data={listas[pestana]}
          keyExtractor={(item) => String(item.amistadId)}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
        />
      </View>
      <LoadingModal visible={loading} text="Buscando solicitudes..." />
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  pestanas: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  pestana: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  pestanaActiva: { backgroundColor: 'rgba(178,140,255,0.3)', borderColor: '#b28cff' },
  pestanaTexto: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  error: { color: '#ffb3bd', fontSize: 14, textAlign: 'center', marginBottom: 10 },
  vacio: { color: 'rgba(255,255,255,0.8)', fontSize: 15, textAlign: 'center', marginTop: 20 },
  lista: { paddingBottom: 20 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingVertical: 6, paddingHorizontal: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  usuario: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 },
  textos: { flex: 1, minWidth: 0 },
  nombre: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  username: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },
  botones: { flexDirection: 'row', gap: 8 },
  boton: { width: 120, minHeight: 42, paddingVertical: 8, marginVertical: 4 },
});
