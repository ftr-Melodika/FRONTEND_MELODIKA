// Archivo: src/screens/CancionesScreen.js
// Catálogo de canciones para tocar con lo aprendido. Se puede buscar por título o artista y filtrar por
// favoritas, dificultad y género: los tres al lado del buscador y, al tocar dificultad o género, una fila
// flotante con todas sus opciones. La lista se desliza de lado, en dos filas. Sin filtros, se agrupa con un
// subtítulo por grupo: favoritas, fáciles, intermedias y difíciles. Cada canción muestra sus estrellas.
// Las canciones vienen del backend.
import { useContext, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { ScreenHeader } from '../components/ScreenHeader';
import { Button } from '../components/Button';
import { ListaSkeleton } from '../components/Skeleton';
import { TarjetaCancion } from '../components/canciones/TarjetaCancion';
import { AuthContext } from '../context/AuthContext';
import { useCanciones, useActualizarAlEnfocar, useEstrellasCanciones, useFavoritasCanciones, mensajeError } from '../hooks/useConsultas';
import { useAlternarFavorita } from '../hooks/useAlternarFavorita';
import { columnasDeCanciones, filtrarCanciones, generosDeCanciones, seccionesDeCanciones } from '../utils/canciones';

const FILAS = 2;
const SEPARACION = 10;
const ALTO_TARJETA_MINIMO = 84;
const ANCHO_TITULO_GRUPO = 110;
const MARGEN_INFERIOR_LISTA = 12;
const ALTO_TARJETA_MAXIMO = 140;
const ANCHO_TARJETA_MINIMO = 300;
const ANCHO_TARJETA_MAXIMO = 400;
const PROPORCION_ANCHO = 0.62; // Del ancho de la pantalla: así se asoma la columna siguiente y se nota que hay más

const FILTROS = [
  { id: null, titulo: 'Todas' },
  { id: 'Fácil', titulo: 'Fáciles' },
  { id: 'Intermedia', titulo: 'Intermedias' },
  { id: 'Difícil', titulo: 'Difíciles' },
];

// Un botón de filtro. `abierto` (solo en los que despliegan opciones) agrega la flechita y la deja marcada mientras se ve su fila.
function Filtro({ titulo, activo, onPress, desplegable = false, abierto = false, deshabilitado = false, ancho = false }) {
  return (
    <TouchableOpacity
      style={[styles.filtro, ancho && styles.filtroAncho, (activo || abierto) && styles.filtroActivo, deshabilitado && styles.filtroDeshabilitado]}
      onPress={onPress}
      disabled={deshabilitado}
      activeOpacity={0.8}
      accessibilityRole={desplegable ? 'button' : 'tab'}
      accessibilityState={desplegable ? { expanded: abierto, selected: activo } : { selected: activo }}
    >
      <Text style={styles.filtroTexto} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{desplegable ? `${titulo} ${abierto ? '▴' : '▾'}` : titulo}</Text>
    </TouchableOpacity>
  );
}

export function CancionesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { perfil } = useContext(AuthContext);
  const [busqueda, setBusqueda] = useState('');
  const [nivel, setNivel] = useState(null);
  const [genero, setGenero] = useState(null);
  const [soloFavoritas, setSoloFavoritas] = useState(false);
  const [bajoFiltros, setBajoFiltros] = useState(0); // Dónde termina la barra de filtros: de ahí cuelga la fila de opciones
  const [desplegado, setDesplegado] = useState(null); // 'nivel' | 'genero' | null: qué fila de opciones se ve
  const [altoLista, setAltoLista] = useState(0);

  // Con caché: las canciones aparecen al instante y se actualizan en segundo plano (cambios de tempo, rasgueo…)
  const consulta = useCanciones();
  useActualizarAlEnfocar(consulta);
  const todas = consulta.data ?? [];
  const cargando = consulta.isPending;
  const error = mensajeError(consulta);

  // El corazón y el filtro siempre se ven; si el servidor todavía no tiene los favoritos, al tocarlo avisa el error
  const consultaFavoritas = useFavoritasCanciones(perfil?.id);
  const favoritasDisponibles = !!perfil?.id;
  const favoritas = consultaFavoritas.data ?? [];
  const alternarFavorita = useAlternarFavorita(perfil?.id);
  // Las estrellas son del perfil; si el pedido falla, las canciones se ven sin estrellas
  const estrellas = useEstrellasCanciones(perfil?.id).data ?? {};

  const generos = useMemo(() => generosDeCanciones(todas), [todas]);
  const canciones = useMemo(
    () => filtrarCanciones(todas, busqueda, nivel, { genero, favoritas: soloFavoritas && favoritasDisponibles ? favoritas : null }),
    [todas, busqueda, nivel, genero, soloFavoritas, favoritasDisponibles, favoritas],
  );
  const hayFiltros = !!busqueda.trim() || !!nivel || !!genero || soloFavoritas;
  // Sin filtros: un grupo por favoritas / fáciles / intermedias / difíciles, cada uno con su subtítulo.
  // Con filtros: una sola tanda, sin subtítulos. Cada elemento es un subtítulo o una columna de canciones.
  const elementos = useMemo(() => {
    if (hayFiltros) return columnasDeCanciones(canciones, FILAS).map((columna) => ({ tipo: 'columna', clave: columna[0].id, canciones: columna }));
    return seccionesDeCanciones(canciones, favoritas).flatMap((seccion) => [
      { tipo: 'titulo', clave: `titulo-${seccion.titulo}`, titulo: seccion.titulo, cantidad: seccion.canciones.length },
      ...columnasDeCanciones(seccion.canciones, FILAS).map((columna) => ({ tipo: 'columna', clave: `${seccion.titulo}-${columna[0].id}`, canciones: columna })),
    ]);
  }, [canciones, favoritas, hayFiltros]);

  const ancho = Math.round(Math.min(ANCHO_TARJETA_MAXIMO, Math.max(ANCHO_TARJETA_MINIMO, width * PROPORCION_ANCHO)));
  // Las dos filas de tarjetas tienen que entrar enteras: al alto medido se le resta el margen de abajo y lo que separa las filas
  const alto = Math.round(Math.min(ALTO_TARJETA_MAXIMO, Math.max(ALTO_TARJETA_MINIMO, (altoLista - MARGEN_INFERIOR_LISTA - SEPARACION * (FILAS - 1)) / FILAS)));
  const alternar = (que) => setDesplegado(desplegado === que ? null : que);
  const elegirNivel = (id) => { setNivel(id); setDesplegado(null); };
  const elegirGenero = (g) => { setGenero(g); setDesplegado(null); };
  const borrarFiltros = () => { setBusqueda(''); setNivel(null); setGenero(null); setSoloFavoritas(false); setDesplegado(null); };
  const abrir = (cancion) => navigation.navigate('Cancion', { id: cancion.id, cancion });

  let vacio = null;
  if (cargando) vacio = <ListaSkeleton cantidad={2} alto={alto} style={styles.cargando} />;
  else if (error) {
    vacio = (
      <View style={styles.errorCaja}>
        <Text style={styles.vacio}>{error}</Text>
        <Button title="Reintentar" onPress={() => consulta.refetch()} />
      </View>
    );
  } else if (canciones.length === 0) {
    vacio = (
      <Text style={styles.vacio}>
        {!todas.length ? 'Todavía no hay canciones.'
          : soloFavoritas && !favoritas.length ? 'Todavía no marcaste favoritas. Tocá el ♡ de una canción para guardarla.'
            : 'No encontramos canciones con esos filtros.'}
      </Text>
    );
  }

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
        <ScreenHeader title="Canciones" />

        {/* La fila de opciones flota debajo de la barra: así no corre la lista de canciones */}
        <View style={styles.zonaFiltros} onLayout={(e) => setBajoFiltros(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}>
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
            <Filtro titulo="✕ Borrar filtros" ancho deshabilitado={!hayFiltros} onPress={borrarFiltros} />
            {favoritasDisponibles ? <Filtro titulo="♥ Favoritas" ancho activo={soloFavoritas} onPress={() => setSoloFavoritas(!soloFavoritas)} /> : null}
            <Filtro titulo={nivel ?? 'Dificultad'} ancho activo={!!nivel} desplegable abierto={desplegado === 'nivel'} onPress={() => alternar('nivel')} />
            <Filtro titulo={genero ?? 'Género'} ancho activo={!!genero} desplegable abierto={desplegado === 'genero'} onPress={() => alternar('genero')} />
          </View>
        </View>

        <View style={styles.zonaLista} onLayout={(e) => setAltoLista(e.nativeEvent.layout.height)}>
          {vacio ?? (
            <FlatList
              data={elementos}
              keyExtractor={(elemento) => elemento.clave}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.lista, { paddingRight: Math.max(insets.right, 16) }]}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={4}
              windowSize={5}
              renderItem={({ item }) => (item.tipo === 'titulo' ? (
                <View style={[styles.titulo, { height: alto * FILAS + SEPARACION * (FILAS - 1) }]}>
                  <Text style={styles.tituloTexto}>{item.titulo}</Text>
                  <Text style={styles.tituloCantidad}>{item.cantidad}</Text>
                </View>
              ) : (
                <View style={styles.columna}>
                  {item.canciones.map((cancion) => (
                    <TarjetaCancion
                      key={cancion.id}
                      cancion={cancion}
                      ancho={ancho}
                      alto={alto}
                      favorita={favoritas.includes(cancion.id)}
                      estrellas={estrellas[cancion.id] ?? 0}
                      onPress={abrir}
                      onFavorita={favoritasDisponibles ? alternarFavorita : undefined}
                    />
                  ))}
                </View>
              ))}
              ListFooterComponent={
                <Text style={styles.nota}>
                  Las fáciles se tocan con un golpe por acorde y solo usan los acordes del curso "Acordes" (Em, Am, D, A, E, C, G y B7). Las intermedias tienen rasgueo o suman otros acordes, como los de cejilla.
                </Text>
              }
            />
          )}
        </View>

        {desplegado ? (
          <View style={[styles.opcionesCaja, { top: bajoFiltros + 6, left: Math.max(insets.left, 20), right: Math.max(insets.right, 20) }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.opciones} contentContainerStyle={styles.filtros} keyboardShouldPersistTaps="handled">
                {desplegado === 'nivel'
                  ? FILTROS.map((f) => <Filtro key={f.titulo} titulo={f.titulo} activo={f.id === nivel} onPress={() => elegirNivel(f.id)} />)
                  : (
                    <>
                      <Filtro titulo="Todos" activo={!genero} onPress={() => elegirGenero(null)} />
                      {generos.map((g) => <Filtro key={g} titulo={g} activo={g === genero} onPress={() => elegirGenero(g)} />)}
                      {generos.length === 0 ? <Text style={styles.sinGeneros}>Todavía no hay géneros cargados.</Text> : null}
                    </>
                  )}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', paddingTop: 12 },
  zonaFiltros: { marginBottom: 10 },
  barra: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  buscador: { flex: 2, minWidth: 110, minHeight: 36, paddingHorizontal: 14, borderRadius: 10, color: '#fff', fontSize: 15, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  filtros: { flexDirection: 'row', gap: 6 },
  opcionesCaja: { position: 'absolute', zIndex: 20, elevation: 20 },
  opciones: { paddingVertical: 6, paddingHorizontal: 6, borderRadius: 24, backgroundColor: 'rgba(43,38,96,0.96)', borderWidth: 1, borderColor: 'rgba(178,140,255,0.5)' },
  sinGeneros: { alignSelf: 'center', color: 'rgba(255,255,255,0.75)', fontSize: 13, paddingHorizontal: 8 },
  filtro: { minHeight: 40, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)' },
  filtroAncho: { flex: 1, paddingHorizontal: 8, alignItems: 'center' },
  filtroActivo: { backgroundColor: '#4c52d9' },
  filtroDeshabilitado: { opacity: 0.45 },
  filtroTexto: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  zonaLista: { flex: 1, paddingBottom: MARGEN_INFERIOR_LISTA },
  lista: { gap: SEPARACION, alignItems: 'flex-start' },
  columna: { gap: SEPARACION },
  titulo: { width: ANCHO_TITULO_GRUPO, justifyContent: 'center', alignItems: 'center', gap: 2, paddingHorizontal: 8, borderLeftWidth: 3, borderLeftColor: '#b28cff' },
  tituloTexto: { color: '#fff', fontSize: 17, fontWeight: 'bold', textAlign: 'center' },
  tituloCantidad: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  cargando: { marginTop: 10 },
  errorCaja: { alignItems: 'center', gap: 12 },
  vacio: { color: '#fff', textAlign: 'center', marginTop: 30, fontSize: 15 },
  nota: { width: 240, color: 'rgba(255,255,255,0.7)', fontSize: 12, alignSelf: 'center', paddingHorizontal: 6 },
});
