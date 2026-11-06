// Archivo: src/screens/GruposScreen.js
// Tres apartados: los grupos en los que estás, buscar grupos y crear uno nuevo.
import { useCallback, useContext, useState } from 'react';
import { View, Text, FlatList, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { ScreenHeader } from '../components/ScreenHeader';
import { AuthContext } from '../context/AuthContext';
import { gruposService } from '../services/gruposService';

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
            <Text style={styles.nombre} numberOfLines={1}>{item.nombre}</Text>
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

  return (
    <View style={styles.flex}>
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
          <View style={styles.fila}>
            <View style={styles.textos}>
              <Text style={styles.nombre} numberOfLines={1}>{item.nombre}</Text>
              {!!item.descripcion && <Text style={styles.detalle} numberOfLines={2}>{item.descripcion}</Text>}
              <Text style={styles.miembrosTexto}>{textoMiembros(item.totalMiembros)}</Text>
            </View>
            {item.unido ? (
              <Button title="Abrir" variant="secondary" onPress={() => onAbrir(item)} style={styles.botonFila} />
            ) : (
              <Button title="Unirme" onPress={() => unirse(item)} loading={uniendoId === item.id} disabled={!!uniendoId} style={styles.botonFila} />
            )}
          </View>
        )}
      />
    </View>
  );
}

function CrearGrupo({ miId, onCreado }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const crear = async () => {
    const nombreLimpio = nombre.trim();
    if (nombreLimpio.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const grupo = await gruposService.crear(miId, { nombre: nombreLimpio, descripcion: descripcion.trim() });
      setNombre('');
      setDescripcion('');
      onCreado(grupo);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.lista} keyboardShouldPersistTaps="handled">
      <InputField placeholder="Nombre del grupo" value={nombre} onChangeText={setNombre} maxLength={50} autoCapitalize="sentences" />
      <TextInput
        style={styles.descripcion}
        placeholder="¿De qué se trata? (opcional)"
        placeholderTextColor="rgba(255, 255, 255, 0.7)"
        value={descripcion}
        onChangeText={setDescripcion}
        maxLength={200}
        multiline
        textAlignVertical="top"
      />
      <Text style={styles.contador}>{descripcion.length} / 200</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Button title="Crear grupo" onPress={crear} loading={enviando} />
    </ScrollView>
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
  textos: { flex: 1, minWidth: 0 },
  nombre: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  detalle: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
  miembros: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  miembrosTexto: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  buscador: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  botonBuscar: { width: 110, minHeight: 44, paddingVertical: 8, marginVertical: 0 },
  botonFila: { width: 110, minHeight: 42, paddingVertical: 8, marginVertical: 0 },
  descripcion: { minHeight: 90, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.3)', borderWidth: 1, borderRadius: 10, padding: 12, color: '#fff', fontSize: 15 },
  contador: { color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'right', marginTop: 4 },
  error: { color: '#ffb3bd', fontSize: 14, textAlign: 'center', marginVertical: 8 },
  vacioCaja: { alignItems: 'center' },
  vacio: { color: 'rgba(255,255,255,0.8)', fontSize: 15, textAlign: 'center', marginTop: 20 },
  vacioBoton: { width: 220, marginTop: 12 },
});
