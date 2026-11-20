// Archivo: src/screens/SolicitudesScreen.js
// Portal social: aceptar o rechazar solicitudes, ver las enviadas y la lista de amigos.
import { useContext, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Button } from '../components/Button';
import { ListaSkeleton } from '../components/Skeleton';
import { ScreenHeader } from '../components/ScreenHeader';
import { AvatarUsuario } from '../components/AvatarUsuario';
import { AuthContext } from '../context/AuthContext';
import { amistadesService } from '../services/amistadesService';
import { useSolicitudes, useAmigos, useActualizarAlEnfocar } from '../hooks/useConsultas';

const VACIO = {
  recibidas: 'No tenés solicitudes pendientes.',
  enviadas: 'No enviaste solicitudes. Usá "Agregar amigo" o buscá músicos en tus grupos.',
  amigos: 'Todavía no tenés amigos. Usá "Agregar amigo" o buscá músicos en tus grupos.',
};

export function SolicitudesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { perfil } = useContext(AuthContext);
  const miId = perfil?.id;

  const [pestana, setPestana] = useState('recibidas');
  // Con caché: si ya se vieron, aparecen al instante y se actualizan en segundo plano.
  // Al aceptar, rechazar o cancelar, el servicio vence la caché y las listas se piden de nuevo solas.
  const consultaSolicitudes = useSolicitudes(miId);
  const consultaAmigos = useAmigos(miId);
  useActualizarAlEnfocar(consultaSolicitudes);
  useActualizarAlEnfocar(consultaAmigos);
  const listas = {
    recibidas: consultaSolicitudes.data?.recibidas ?? [],
    enviadas: consultaSolicitudes.data?.enviadas ?? [],
    amigos: consultaAmigos.data ?? [],
  };
  const loading = consultaSolicitudes.isPending || consultaAmigos.isPending;
  const [errorAccion, setErrorAccion] = useState(null);
  const errorConsulta = [consultaSolicitudes, consultaAmigos].find((c) => c.isError && c.data === undefined)?.error.message;
  const error = errorAccion || errorConsulta || null;
  const [procesandoId, setProcesandoId] = useState(null);

  const ejecutar = async (amistadId, accion) => {
    setProcesandoId(amistadId);
    setErrorAccion(null);
    try {
      await accion();
    } catch (e) {
      setErrorAccion(e.message);
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
        <ScreenHeader
          title="Solicitudes y amigos"
          right={<Button title="Agregar amigo" onPress={() => navigation.navigate('AgregarAmigo')} style={styles.botonAgregar} />}
        />

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

        {loading && <ListaSkeleton cantidad={4} alto={60} />}
        <FlatList
          data={listas[pestana]}
          keyExtractor={(item) => String(item.amistadId)}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
        />
      </View>
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
  botonAgregar: { width: 160, minHeight: 40, paddingVertical: 6, marginVertical: 0 },
  boton: { width: 120, minHeight: 42, paddingVertical: 8, marginVertical: 4 },
});
