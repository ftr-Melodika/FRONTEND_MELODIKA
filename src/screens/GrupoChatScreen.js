// Archivo: src/screens/GrupoChatScreen.js
// Chat de un grupo. Los mensajes nuevos se consultan cada 5 segundos mientras la pantalla está visible.
// A la derecha, dos pestañas: los miembros (y el código, si el grupo es privado) y el ranking del grupo.
// A un grupo privado se entra con su código.
import { useCallback, useContext, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Button } from '../components/Button';
import { LoadingModal } from '../components/LoadingModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { EntradaCodigo } from '../components/grupos/EntradaCodigo';
import { AuthContext } from '../context/AuthContext';
import { gruposService } from '../services/gruposService';
import { rankingsService } from '../services/rankingsService';

const INTERVALO_MS = 5000;
const MAXIMO_CARACTERES = 1000;
const PESTANAS = [
  { id: 'miembros', titulo: 'Miembros' },
  { id: 'ranking', titulo: 'Ranking' },
];
const SIN_RANKING = { activo: false, unido: false, participantes: [] };

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
  const [ranking, setRanking] = useState(SIN_RANKING);
  const [accionRanking, setAccionRanking] = useState(false);
  const [pestana, setPestana] = useState('miembros');

  // Si el ranking falla no tiramos abajo el chat: simplemente no se muestran las acciones de ranking
  const cargarRanking = useCallback(async () => {
    try {
      setRanking(await rankingsService.deGrupo(miId, grupoId));
    } catch (e) {
      setRanking(SIN_RANKING);
    }
  }, [miId, grupoId]);

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
          if (detalle?.unido) cargarRanking();
        } catch (e) {
          if (!cancelado) setError(e.message);
        } finally {
          if (!cancelado) setLoading(false);
        }
      })();
      return () => { cancelado = true; };
    }, [cargarTodo, cargarRanking])
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

  const recargarTrasUnirse = async () => {
    const { detalle, lista, hayMas } = await cargarTodo();
    setGrupo(detalle);
    setHayMasAnteriores(hayMas);
    setMensajes(recordarUltimo(lista));
    cargarRanking();
  };

  const unirse = async () => {
    setUniendo(true);
    setError(null);
    try {
      await gruposService.unirse(miId, grupoId);
      await recargarTrasUnirse();
    } catch (e) {
      setError(e.message);
    } finally {
      setUniendo(false);
    }
  };

  // Grupo privado: si el código está mal, el error lo muestra la caja del código
  const unirseConCodigo = async (codigo) => {
    await gruposService.unirse(miId, grupoId, codigo);
    await recargarTrasUnirse();
  };

  // Crea el ranking y manda la invitación al grupo; quien invita queda adentro
  const invitarARanking = async () => {
    setAccionRanking(true);
    setErrorEnvio(null);
    try {
      await rankingsService.invitar(miId, grupoId);
      await cargarRanking();
      // La invitación llega como mensaje del chat: la pedimos ya, sin esperar los 5 segundos
      const params = ultimoIdRef.current ? { despues: ultimoIdRef.current } : undefined;
      const { mensajes: nuevos } = await gruposService.mensajes(miId, grupoId, params);
      if (nuevos.length > 0) setMensajes((actuales) => recordarUltimo(combinar(actuales, nuevos)));
    } catch (e) {
      setErrorEnvio(e.message);
    } finally {
      setAccionRanking(false);
    }
  };

  const aceptarRanking = async () => {
    setAccionRanking(true);
    setErrorEnvio(null);
    try {
      await rankingsService.aceptar(miId, grupoId);
      await cargarRanking();
    } catch (e) {
      setErrorEnvio(e.message);
    } finally {
      setAccionRanking(false);
    }
  };

  const verRanking = () => navigation.navigate('RankingGrupo', { grupoId, nombre: grupo?.nombre || nombreInicial });

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
    if (item.tipo === 'invitacion_ranking') {
      const quien = item.esMio ? 'Invitaste al grupo' : `${item.remitente?.nombre || 'Alguien'} invitó al grupo`;
      return (
        <View style={styles.invitacion}>
          <Text style={styles.invitacionTitulo}>Ranking del grupo</Text>
          <Text style={styles.invitacionTexto}>{quien} a competir por XP.</Text>
          {ranking.unido ? (
            <Button title="Ver ranking" variant="secondary" onPress={verRanking} style={styles.invitacionBoton} />
          ) : (
            <Button title="Aceptar" onPress={aceptarRanking} loading={accionRanking} style={styles.invitacionBoton} />
          )}
        </View>
      );
    }
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

  const volver = <Button title="Volver" icono="volver" variant="back" onPress={() => navigation.goBack()} />;

  return (
    <Background>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
          <ScreenHeader title={grupo?.nombre || nombreInicial || 'Grupo'} right={volver} />

          {!!error && <Text style={styles.error}>{error}</Text>}

          {!!grupo && !grupo.unido && (
            <View style={styles.sinUnir}>
              {!!grupo.descripcion && <Text style={styles.descripcion}>{grupo.descripcion}</Text>}
              {grupo.esPrivado ? (
                <>
                  <Text style={styles.descripcion}>🔒 Este grupo es privado. Pedile el código a alguien del grupo.</Text>
                  <EntradaCodigo onEntrar={unirseConCodigo} textoBoton="Unirme" style={styles.codigoSinUnir} />
                </>
              ) : (
                <>
                  <Text style={styles.descripcion}>Unite al grupo para leer y mandar mensajes.</Text>
                  <Button title="Unirme" onPress={unirse} loading={uniendo} style={styles.botonUnirme} />
                </>
              )}
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
                <View style={styles.pestanas}>
                  {PESTANAS.map(({ id, titulo }) => (
                    <TouchableOpacity
                      key={id}
                      style={[styles.pestana, pestana === id && styles.pestanaActiva]}
                      onPress={() => setPestana(id)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: pestana === id }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.pestanaTexto}>{titulo}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {pestana === 'miembros' && (
                  <>
                    {grupo.esPrivado && !!grupo.codigo && (
                      <View style={styles.codigoCaja}>
                        <Text style={styles.codigoEtiqueta}>🔒 Código para invitar</Text>
                        <Text style={styles.codigo} selectable>{grupo.codigo}</Text>
                      </View>
                    )}
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
                  </>
                )}

                {pestana === 'ranking' && (
                  <>
                    {!ranking.activo && (
                      <Text style={styles.rankingAyuda}>Todavía no hay ranking. Invitá al grupo: cada uno entra al aceptar.</Text>
                    )}
                    {ranking.activo && !ranking.unido && (
                      <Text style={styles.rankingAyuda}>El grupo tiene un ranking. Aceptá para competir por XP.</Text>
                    )}
                    {ranking.activo && (
                      <FlatList
                        style={styles.flex}
                        data={ranking.participantes}
                        keyExtractor={(p) => String(p.id)}
                        ListEmptyComponent={<Text style={styles.rankingAyuda}>Nadie aceptó todavía.</Text>}
                        renderItem={({ item }) => (
                          <View style={[styles.puesto, item.id === miId && styles.puestoMio]}>
                            <Text style={styles.puestoNumero}>#{item.posicion}</Text>
                            <Text style={styles.puestoNombre} numberOfLines={1}>@{item.username}{item.id === miId ? ' (vos)' : ''}</Text>
                            <Text style={styles.puestoXp}>{item.xp ?? 0} XP</Text>
                          </View>
                        )}
                      />
                    )}
                    {ranking.unido ? (
                      <Button title="Ver ranking completo" variant="secondary" onPress={verRanking} style={styles.botonSalir} />
                    ) : ranking.activo ? (
                      <Button title="Aceptar y entrar" onPress={aceptarRanking} loading={accionRanking} style={styles.botonSalir} />
                    ) : (
                      <Button title="Invitar a ranking" onPress={invitarARanking} loading={accionRanking} style={styles.botonSalir} />
                    )}
                  </>
                )}

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
  pestanas: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  pestana: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  pestanaActiva: { backgroundColor: 'rgba(178,140,255,0.3)', borderColor: '#b28cff' },
  pestanaTexto: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  codigoCaja: { alignItems: 'center', padding: 8, marginBottom: 8, borderRadius: 10, backgroundColor: 'rgba(163,251,163,0.1)', borderWidth: 1, borderColor: 'rgba(163,251,163,0.5)' },
  codigoEtiqueta: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  codigo: { color: '#a3fba3', fontSize: 18, fontWeight: 'bold', letterSpacing: 2, marginTop: 2 },
  codigoSinUnir: { width: '60%' },
  rankingAyuda: { color: 'rgba(255,255,255,0.75)', fontSize: 12, textAlign: 'center', marginVertical: 6 },
  puesto: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  puestoMio: { backgroundColor: 'rgba(178,140,255,0.15)', borderRadius: 6 },
  puestoNumero: { color: '#fff', fontSize: 12, fontWeight: 'bold', width: 26 },
  puestoNombre: { color: '#fff', fontSize: 12, flex: 1 },
  puestoXp: { color: '#a3fba3', fontSize: 12, fontWeight: 'bold' },
  columnaMiembros: { width: '30%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
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
  invitacion: { alignSelf: 'center', width: '78%', borderRadius: 14, padding: 12, marginBottom: 8, backgroundColor: 'rgba(163,251,163,0.12)', borderWidth: 1, borderColor: '#a3fba3', alignItems: 'center' },
  invitacionTitulo: { color: '#a3fba3', fontSize: 15, fontWeight: 'bold' },
  invitacionTexto: { color: '#fff', fontSize: 14, textAlign: 'center', marginVertical: 4 },
  invitacionBoton: { width: 160, minHeight: 40, paddingVertical: 6, marginVertical: 0, marginTop: 6 },
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
