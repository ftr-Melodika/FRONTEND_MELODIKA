// Archivo: src/screens/GrupoChatScreen.js
// Chat de un grupo. Los mensajes nuevos se consultan cada 5 segundos mientras la pantalla está visible.
import { useCallback, useContext, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Button } from '../components/Button';
import { LoadingModal } from '../components/LoadingModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { AuthContext } from '../context/AuthContext';
import { gruposService } from '../services/gruposService';

const INTERVALO_MS = 5000;
const MAXIMO_CARACTERES = 1000;

// Agrega mensajes sin repetir: uno recién enviado también puede llegar en la consulta periódica
function combinar(actuales, nuevos) {
  const ids = new Set(actuales.map((m) => m.id));
  return [...actuales, ...nuevos.filter((m) => !ids.has(m.id))];
}

function horaDe(fecha) {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function GrupoChatScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { perfil } = useContext(AuthContext);
  const miId = perfil?.id;
  const { grupoId, nombre: nombreInicial } = route.params;

  const [grupo, setGrupo] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [hayMasAnteriores, setHayMasAnteriores] = useState(false);
  const [cargandoAnteriores, setCargandoAnteriores] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [sinConexion, setSinConexion] = useState(false);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [uniendo, setUniendo] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [confirmandoSalida, setConfirmandoSalida] = useState(false);

  // La consulta periódica lee siempre el último mensaje conocido, sin reiniciar el intervalo
  const ultimoIdRef = useRef(null);
  const recordarUltimo = (lista) => {
    if (lista.length > 0) ultimoIdRef.current = lista[lista.length - 1].id;
    return lista;
  };

  const cargarTodo = useCallback(async () => {
    const detalle = await gruposService.obtener(miId, grupoId);
    let lista = [];
    let hayMas = false;
    if (detalle?.unido) {
      const respuesta = await gruposService.mensajes(miId, grupoId);
      lista = respuesta.mensajes;
      hayMas = respuesta.hayMasAnteriores;
    }
    return { detalle, lista, hayMas };
  }, [miId, grupoId]);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      (async () => {
        setError(null);
        try {
          const { detalle, lista, hayMas } = await cargarTodo();
          if (cancelado) return;
          setGrupo(detalle);
          setHayMasAnteriores(hayMas);
          setMensajes(recordarUltimo(lista));
        } catch (e) {
          if (!cancelado) setError(e.message);
        } finally {
          if (!cancelado) setLoading(false);
        }
      })();
      return () => { cancelado = true; };
    }, [cargarTodo])
  );

  // Depende de "unido" para arrancar también cuando el usuario se une desde esta misma pantalla
  const unido = !!grupo?.unido;
  useFocusEffect(
    useCallback(() => {
      if (!unido) return undefined;
      let cancelado = false;
      const consultarNuevos = async () => {
        try {
          const params = ultimoIdRef.current ? { despues: ultimoIdRef.current } : undefined;
          const { mensajes: nuevos } = await gruposService.mensajes(miId, grupoId, params);
          if (cancelado) return;
          setSinConexion(false);
          if (nuevos.length > 0) setMensajes((actuales) => recordarUltimo(combinar(actuales, nuevos)));
        } catch (e) {
          if (!cancelado) setSinConexion(true);
        }
      };
      const intervalo = setInterval(consultarNuevos, INTERVALO_MS);
      return () => {
        cancelado = true;
        clearInterval(intervalo);
      };
    }, [unido, miId, grupoId])
  );

  const cargarAnteriores = async () => {
    if (cargandoAnteriores || mensajes.length === 0) return;
    setCargandoAnteriores(true);
    try {
      const { mensajes: anteriores, hayMasAnteriores: hayMas } = await gruposService.mensajes(miId, grupoId, { antes: mensajes[0].id });
      const ids = new Set(mensajes.map((m) => m.id));
      setMensajes((actuales) => [...anteriores.filter((m) => !ids.has(m.id)), ...actuales]);
      setHayMasAnteriores(hayMas);
    } catch (e) {
      setErrorEnvio(e.message);
    } finally {
      setCargandoAnteriores(false);
    }
  };

  const enviar = async () => {
    const contenido = texto.trim();
    if (!contenido || enviando) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const mensaje = await gruposService.enviarMensaje(miId, grupoId, contenido);
      setTexto('');
      setMensajes((actuales) => recordarUltimo(combinar(actuales, [mensaje])));
    } catch (e) {
      // El texto queda en la caja para poder reintentar sin volver a escribirlo
      setErrorEnvio(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const unirse = async () => {
    setUniendo(true);
    setError(null);
    try {
      await gruposService.unirse(miId, grupoId);
      const { detalle, lista, hayMas } = await cargarTodo();
      setGrupo(detalle);
      setHayMasAnteriores(hayMas);
      setMensajes(recordarUltimo(lista));
    } catch (e) {
      setError(e.message);
    } finally {
      setUniendo(false);
    }
  };

  const salir = async () => {
    setSaliendo(true);
    setErrorEnvio(null);
    try {
      await gruposService.salir(miId, grupoId);
      navigation.goBack();
    } catch (e) {
      setErrorEnvio(e.message);
      setSaliendo(false);
      setConfirmandoSalida(false);
    }
  };

  // La lista está invertida para arrancar abajo de todo, como cualquier chat
  const invertidos = [...mensajes].reverse();

  const renderMensaje = ({ item }) => {
    const nombre = item.remitente?.nombre || 'Usuario eliminado';
    return (
      <View style={[styles.burbuja, item.esMio ? styles.burbujaMia : styles.burbujaOtro]}>
        {!item.esMio && (
          <TouchableOpacity
            disabled={!item.remitente}
            onPress={() => navigation.navigate('PerfilPublico', { perfilId: item.remitente.id })}
          >
            <Text style={styles.remitente} numberOfLines={1}>{nombre}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.contenido}>{item.contenido}</Text>
        <Text style={styles.hora}>{horaDe(item.createdAt)}</Text>
      </View>
    );
  };

  const volver = <Button title="← Volver" variant="back" onPress={() => navigation.goBack()} />;

  return (
    <Background>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
          <ScreenHeader title={grupo?.nombre || nombreInicial || 'Grupo'} right={volver} />

          {!!error && <Text style={styles.error}>{error}</Text>}

          {!!grupo && !grupo.unido && (
            <View style={styles.sinUnir}>
              {!!grupo.descripcion && <Text style={styles.descripcion}>{grupo.descripcion}</Text>}
              <Text style={styles.descripcion}>Unite al grupo para leer y mandar mensajes.</Text>
              <Button title="Unirme" onPress={unirse} loading={uniendo} style={styles.botonUnirme} />
            </View>
          )}

          {!!grupo?.unido && (
            <View style={styles.fila}>
              <View style={styles.columnaChat}>
                {sinConexion && <Text style={styles.aviso}>Sin conexión: reintentando...</Text>}

                <FlatList
                  style={styles.flex}
                  data={invertidos}
                  inverted
                  keyExtractor={(m) => String(m.id)}
                  renderItem={renderMensaje}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.mensajes}
                  ListEmptyComponent={
                    !loading ? <Text style={styles.vacio}>Todavía no hay mensajes. ¡Saludá al grupo!</Text> : null
                  }
                  ListFooterComponent={
                    hayMasAnteriores ? (
                      <Button title="Ver mensajes anteriores" variant="link" onPress={cargarAnteriores} disabled={cargandoAnteriores} style={styles.anteriores} />
                    ) : null
                  }
                />

                {!!errorEnvio && <Text style={styles.error}>{errorEnvio}</Text>}

                <View style={styles.redactor}>
                  <TextInput
                    style={styles.entrada}
                    placeholder="Escribí un mensaje..."
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={texto}
                    onChangeText={setTexto}
                    maxLength={MAXIMO_CARACTERES}
                    multiline
                  />
                  <Button title="Enviar" onPress={enviar} loading={enviando} disabled={!texto.trim()} style={styles.botonEnviar} />
                </View>
              </View>

              <View style={styles.columnaMiembros}>
                <Text style={styles.miembrosTitulo}>Miembros ({grupo.totalMiembros ?? 0})</Text>
                <FlatList
                  style={styles.flex}
                  data={grupo.miembros || []}
                  keyExtractor={(m) => String(m.id)}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.miembro}
                      onPress={() => navigation.navigate('PerfilPublico', { perfilId: item.id })}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.miembroNombre} numberOfLines={1}>{item.nombre}{item.id === miId ? ' (vos)' : ''}</Text>
                      <Text style={styles.miembroUsuario} numberOfLines={1}>@{item.username}</Text>
                    </TouchableOpacity>
                  )}
                />
                {confirmandoSalida ? (
                  <Button title="Confirmar salida" variant="danger" onPress={salir} loading={saliendo} style={styles.botonSalir} />
                ) : (
                  <Button title="Salir del grupo" variant="secondary" onPress={() => setConfirmandoSalida(true)} style={styles.botonSalir} />
                )}
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
      <LoadingModal visible={loading} text="Abriendo el grupo..." />
    </Background>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, padding: 20 },
  fila: { flex: 1, flexDirection: 'row', gap: 14 },
  columnaChat: { flex: 1 },
  columnaMiembros: { width: '26%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  miembrosTitulo: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  miembro: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  miembroNombre: { color: '#fff', fontSize: 13, fontWeight: '600' },
  miembroUsuario: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  botonSalir: { minHeight: 40, paddingVertical: 6, marginVertical: 0, marginTop: 8 },
  mensajes: { flexGrow: 1, paddingVertical: 6 },
  burbuja: { maxWidth: '78%', borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 6 },
  burbujaMia: { alignSelf: 'flex-end', backgroundColor: 'rgba(178,140,255,0.45)' },
  burbujaOtro: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.12)' },
  remitente: { color: '#a3fba3', fontSize: 12, fontWeight: 'bold', marginBottom: 2 },
  contenido: { color: '#fff', fontSize: 15, lineHeight: 20 },
  hora: { color: 'rgba(255,255,255,0.6)', fontSize: 10, alignSelf: 'flex-end', marginTop: 2 },
  anteriores: { alignSelf: 'center', marginVertical: 8 },
  redactor: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 6 },
  entrada: { flex: 1, minHeight: 44, maxHeight: 100, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.3)', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 15 },
  botonEnviar: { width: 100, minHeight: 44, paddingVertical: 8, marginVertical: 0 },
  sinUnir: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  descripcion: { color: 'rgba(255,255,255,0.85)', fontSize: 15, textAlign: 'center', marginBottom: 10 },
  botonUnirme: { width: 220 },
  error: { color: '#ffb3bd', fontSize: 14, textAlign: 'center', marginVertical: 6 },
  aviso: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginBottom: 4 },
  vacio: { color: 'rgba(255,255,255,0.8)', fontSize: 15, textAlign: 'center', marginTop: 20 },
});
