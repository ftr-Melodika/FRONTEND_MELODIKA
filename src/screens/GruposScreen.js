// Archivo: src/screens/GruposScreen.js
// Tres apartados: los grupos en los que estás, buscar grupos y crear uno nuevo.
// En la búsqueda se ven todos los grupos; a los privados (🔒) se entra con su código.
import { useCallback, useContext, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { ScreenHeader } from '../components/ScreenHeader';
import { CrearGrupo } from '../components/grupos/CrearGrupo';
import { EntradaCodigo } from '../components/grupos/EntradaCodigo';
import { AuthContext } from '../context/AuthContext';
import { gruposService } from '../services/gruposService';

const nombreConCandado = (grupo) => `${grupo.esPrivado ? '🔒 ' : ''}${grupo.nombre}`;

const APARTADOS = [
  { id: 'mios', titulo: 'Mis grupos' },
  { id: 'buscar', titulo: 'Buscar grupos' },
  { id: 'crear', titulo: 'Crear grupo' },
];

const textoMiembros = (n) => `${n ?? 0} ${n === 1 ? 'miembro' : 'miembros'}`;

function MisGrupos({ miId, onAbrir, onBuscar }) {
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      (async () => {
        try {
          const datos = await gruposService.misGrupos(miId);
          if (!cancelado) { setGrupos(datos); setError(null); }
        } catch (e) {
          if (!cancelado) setError(e.message);
        } finally {
          if (!cancelado) setCargando(false);
        }
      })();
      return () => { cancelado = true; };
    }, [miId])
  );

  if (error) return <Text style={styles.error}>{error}</Text>;
  if (cargando) return <Text style={styles.vacio}>Cargando tus grupos...</Text>;
  if (grupos.length === 0) {
    return (
      <View style={styles.vacioCaja}>
        <Text style={styles.vacio}>Todavía no estás en ningún grupo.</Text>
        <Button title="Buscar grupos" variant="secondary" onPress={onBuscar} style={styles.vacioBoton} />
      </View>
    );
  }

  return (
    <FlatList
      data={grupos}
      keyExtractor={(g) => String(g.id)}
      contentContainerStyle={styles.lista}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.fila} onPress={() => onAbrir(item)} activeOpacity={0.7}>
          <View style={styles.textos}>
            <Text style={styles.nombre} numberOfLines={1}>{nombreConCandado(item)}</Text>
            <Text style={styles.detalle} numberOfLines={1}>
              {item.ultimoMensaje
                ? `${item.ultimoMensaje.remitenteNombre || 'Usuario'}: ${item.ultimoMensaje.contenido}`
                : 'Todavía no hay mensajes'}
            </Text>
          </View>
          <Text style={styles.miembros}>{textoMiembros(item.totalMiembros)}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

function BuscarGrupos({ miId, onAbrir }) {
  const [texto, setTexto] = useState('');
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [uniendoId, setUniendoId] = useState(null);
  // Grupo privado al que se le está escribiendo el código (se abre la caja debajo de su fila)
  const [codigoParaId, setCodigoParaId] = useState(null);
  const [conCodigo, setConCodigo] = useState(false);

  const buscar = useCallback(async (consulta) => {
    setCargando(true);
    setError(null);
    try {
      setGrupos(await gruposService.buscar(miId, consulta.trim()));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [miId]);

  // Al entrar mostramos los grupos más grandes, sin que haga falta escribir
  useFocusEffect(useCallback(() => { buscar(''); }, [buscar]));

  const unirse = async (grupo) => {
    if (grupo.esPrivado) {
      setCodigoParaId((actual) => (actual === grupo.id ? null : grupo.id));
      return;
    }
    setUniendoId(grupo.id);
    setError(null);
    try {
      await gruposService.unirse(miId, grupo.id);
      onAbrir(grupo);
    } catch (e) {
      setError(e.message);
    } finally {
      setUniendoId(null);
    }
  };

  // Los errores (código incorrecto) los muestra la caja del código
  const unirseConCodigoDe = (grupo) => async (codigo) => {
    await gruposService.unirse(miId, grupo.id, codigo);
    onAbrir(grupo);
  };

  const unirseSoloConCodigo = async (codigo) => {
    const { grupo } = await gruposService.unirseConCodigo(miId, codigo);
    onAbrir(grupo);
  };

  return (
    <View style={styles.flex}>
      {conCodigo && (
        <View style={styles.cajaCodigo}>
          <Text style={styles.cajaCodigoTitulo}>Escribí el código del grupo privado (distingue mayúsculas)</Text>
          <EntradaCodigo onEntrar={unirseSoloConCodigo} autoFocus />
        </View>
      )}

      <View style={styles.buscador}>
        <View style={styles.flex}>
          <InputField
            placeholder="Buscar por nombre o tema"
            value={texto}
            onChangeText={setTexto}
            onSubmitEditing={() => buscar(texto)}
            returnKeyType="search"
          />
        </View>
        <Button title="Buscar" onPress={() => buscar(texto)} style={styles.botonBuscar} />
        <Button
          title={conCodigo ? 'Cerrar' : 'Tengo un código'}
          variant="secondary"
          onPress={() => setConCodigo((v) => !v)}
          style={styles.botonCodigo}
        />
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}
      {!error && !cargando && grupos.length === 0 && (
        <Text style={styles.vacio}>No encontramos grupos. ¡Podés crear el primero!</Text>
      )}

      <FlatList
        data={grupos}
        keyExtractor={(g) => String(g.id)}
        contentContainerStyle={styles.lista}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={styles.tarjeta}>
            <View style={styles.filaInterna}>
              <View style={styles.textos}>
                <Text style={styles.nombre} numberOfLines={1}>{nombreConCandado(item)}</Text>
                {!!item.descripcion && <Text style={styles.detalle} numberOfLines={2}>{item.descripcion}</Text>}
                <Text style={styles.miembrosTexto}>
                  {textoMiembros(item.totalMiembros)}{item.esPrivado ? '  ·  Privado: se entra con código' : ''}
                </Text>
              </View>
              {item.unido ? (
                <Button title="Abrir" variant="secondary" onPress={() => onAbrir(item)} style={styles.botonFila} />
              ) : (
                <Button
                  title={item.esPrivado ? (codigoParaId === item.id ? 'Cancelar' : 'Con código') : 'Unirme'}
                  variant={item.esPrivado && codigoParaId === item.id ? 'secondary' : 'primary'}
                  onPress={() => unirse(item)}
                  loading={uniendoId === item.id}
                  disabled={!!uniendoId}
                  style={styles.botonFila}
                />
              )}
            </View>
            {codigoParaId === item.id && !item.unido && (
              <EntradaCodigo onEntrar={unirseConCodigoDe(item)} textoBoton="Unirme" autoFocus style={styles.codigoEnFila} />
            )}
          </View>
        )}
      />
    </View>
  );
}

export function GruposScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { perfil } = useContext(AuthContext);
  const [apartado, setApartado] = useState('mios');
  const miId = perfil?.id;

  const abrirGrupo = (grupo) => navigation.navigate('GrupoChat', { grupoId: grupo.id, nombre: grupo.nombre });

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
        <ScreenHeader title="Grupos" />

        <View style={styles.pestanas}>
          {APARTADOS.map(({ id, titulo }) => (
            <TouchableOpacity
              key={id}
              style={[styles.pestana, apartado === id && styles.pestanaActiva]}
              onPress={() => setApartado(id)}
              activeOpacity={0.8}
            >
              <Text style={styles.pestanaTexto}>{titulo}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {apartado === 'mios' && <MisGrupos miId={miId} onAbrir={abrirGrupo} onBuscar={() => setApartado('buscar')} />}
        {apartado === 'buscar' && <BuscarGrupos miId={miId} onAbrir={abrirGrupo} />}
        {apartado === 'crear' && <CrearGrupo miId={miId} onCreado={abrirGrupo} />}
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, padding: 20 },
  pestanas: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  pestana: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  pestanaActiva: { backgroundColor: 'rgba(178,140,255,0.3)', borderColor: '#b28cff' },
  pestanaTexto: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  lista: { paddingBottom: 20 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tarjeta: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  filaInterna: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  codigoEnFila: { marginTop: 10 },
  cajaCodigo: { marginBottom: 12, padding: 12, borderRadius: 14, backgroundColor: 'rgba(178,140,255,0.12)', borderWidth: 1, borderColor: 'rgba(178,140,255,0.5)' },
  cajaCodigoTitulo: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  textos: { flex: 1, minWidth: 0 },
  nombre: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  detalle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
  miembros: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  miembrosTexto: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  buscador: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  botonBuscar: { width: 110, minHeight: 44, paddingVertical: 8, marginVertical: 0 },
  botonCodigo: { width: 160, minHeight: 44, paddingVertical: 8, marginVertical: 0 },
  botonFila: { width: 110, minHeight: 42, paddingVertical: 8, marginVertical: 0 },
  error: { color: '#ffb3bd', fontSize: 14, textAlign: 'center', marginVertical: 8 },
  vacioCaja: { alignItems: 'center' },
  vacio: { color: 'rgba(255,255,255,0.8)', fontSize: 15, textAlign: 'center', marginTop: 20 },
  vacioBoton: { width: 220, marginTop: 12 },
});
