// Archivo: src/screens/HomeScreen.js
// Primero se ven los cursos; al elegir uno, sus ejercicios. Al volver de una lección se queda en el curso.
import { useState, useContext, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, BackHandler } from 'react-native';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Button } from '../components/Button';
import { SideMenu } from '../components/SideMenu';
import { AuthContext } from '../context/AuthContext';

import { HeaderHome } from '../components/home/HeaderHome';
import { CourseMap } from '../components/home/CourseMap';
import { CourseList } from '../components/home/CourseList';
import { TarjetasSkeleton } from '../components/Skeleton';
import { PrimeraCuerdaModal } from '../components/PrimeraCuerdaModal';

import { leccionesService } from '../services/leccionesService';
import { useMapa, useSolicitudes, useActualizarAlEnfocar } from '../hooks/useConsultas';

const INTERVALO_NOTIFICACIONES_MS = 30000;
const MAPA_VACIO = { cursos: [], curso: null, lecciones: [], esMock: false };

export function HomeScreen({ navigation, route }) {
  // Nos traemos el perfil inyectado desde el contexto
  const { userData: cuenta, perfil, refrescarPerfil } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const enfocada = useIsFocused();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Recién creado el perfil: "Tocá cualquier cuerda para comenzar" (una sola vez)
  const [bienvenida, setBienvenida] = useState(!!route?.params?.bienvenida);
  // null = lista de cursos; un id = los ejercicios de ese curso
  const [cursoElegido, setCursoElegido] = useState(null);

  const perfilId = perfil?.id;

  // Datos con caché: si ya se vieron, aparecen al instante y se actualizan en segundo plano
  const consultaMapa = useMapa(perfilId, cursoElegido);
  const mapa = consultaMapa.data ?? (consultaMapa.isError ? leccionesService.mapaSinConexion() : MAPA_VACIO);
  const cargando = consultaMapa.isPending && !consultaMapa.isError;

  // La campanita: se actualiza al volver a esta pantalla y cada 30 s mientras está visible.
  // Si la consulta falla se mantiene el último número.
  const { data: solicitudes } = useSolicitudes(perfilId, { intervalo: enfocada ? INTERVALO_NOTIFICACIONES_MS : false });
  const solicitudesPendientes = solicitudes?.recibidas?.length ?? 0;

  useActualizarAlEnfocar(consultaMapa);

  useEffect(() => {
    if (!perfilId) navigation.replace('SelectUser');
  }, [perfilId, navigation]);

  // Al volver a esta pantalla (ej: al terminar una lección) se refresca el perfil para tener xp/racha al día
  useFocusEffect(
    useCallback(() => {
      refrescarPerfil();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // Con la lista de cursos a la vista, se pide de antemano el curso actual: al tocarlo ya está
  const cursos = consultaMapa.data?.cursos;
  useEffect(() => {
    if (!perfilId || cursoElegido !== null || !cursos?.length) return;
    const actual = cursos.find((c) => c.desbloqueado && !c.completado) || cursos.find((c) => c.desbloqueado);
    if (!actual) return;
    queryClient.prefetchQuery({
      queryKey: ['mapa', perfilId, actual.id],
      queryFn: () => leccionesService.obtenerMapa(perfilId, actual.id),
    });
  }, [cursos, cursoElegido, perfilId, queryClient]);

  const cerrarBienvenida = useCallback(() => {
    setBienvenida(false);
    // Para que no vuelva a aparecer si la pantalla se vuelve a montar con los mismos parámetros
    navigation.setParams({ bienvenida: false });
  }, [navigation]);

  const volverACursos = useCallback(() => {
    setCursoElegido(null);
  }, []);

  // Al terminar un curso, la pantalla de la lección pide volver a la lista de cursos
  const verCursos = route?.params?.verCursos;
  useEffect(() => {
    if (!verCursos) return;
    setCursoElegido(null);
    navigation.setParams({ verCursos: false });
  }, [verCursos, navigation]);

  // En Android, el botón "atrás" desde los ejercicios vuelve a la lista de cursos
  useEffect(() => {
    if (!cursoElegido) return undefined;
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
      volverACursos();
      return true;
    });
    return () => suscripcion.remove();
  }, [cursoElegido, volverACursos]);

  const handleSelectCurso = (curso) => {
    if (!curso.desbloqueado) {
      Alert.alert('Curso bloqueado', 'Terminá el curso anterior para desbloquear este.');
      return;
    }
    setCursoElegido(curso.id);
  };

  const handleLeccionPress = useCallback((leccion) => {
    if (leccion.estado === 'bloqueada') {
      Alert.alert('Ejercicio bloqueado', 'Completá los ejercicios anteriores para avanzar.');
      return;
    }
    navigation.navigate('Leccion', {
      leccion,
      cursoId: mapa.curso?.id,
      cursoYaCompletado: !!mapa.curso?.completado,
      totalLecciones: mapa.lecciones.length,
      // Para que al terminar se pueda pasar directo al ejercicio siguiente
      lecciones: mapa.lecciones,
    });
  }, [navigation, mapa]);

  // Mientras llega el detalle del curso elegido no hay que mostrar los ejercicios del anterior
  const cursoListo = cursoElegido !== null && mapa.curso?.id === cursoElegido;
  const completadas = mapa.lecciones.filter((l) => l.estado === 'completada').length;

  let contenido = null;
  if (cargando) {
    contenido = <View style={styles.centro}><TarjetasSkeleton /></View>;
  } else if (cursoElegido === null) {
    contenido = <CourseList cursos={mapa.cursos} onSelect={handleSelectCurso} />;
  } else if (!cursoListo) {
    contenido = <View style={styles.centro}><ActivityIndicator color="#fff" size="large" /></View>;
  } else if (mapa.lecciones.length === 0) {
    contenido = <View style={styles.centro}><Text style={styles.emptyText}>Este curso todavía no tiene ejercicios cargados.</Text></View>;
  } else {
    contenido = (
      <>
        <Button title="Volver a los cursos" icono="volver" variant="secondary" onPress={volverACursos} style={styles.botonVolver} textStyle={styles.botonVolverTexto} />
        <Text style={styles.progressText}>
          {completadas} de {mapa.lecciones.length} ejercicios completados
          {mapa.curso?.completado ? '  •  ¡Curso terminado!' : ''}
          {mapa.esMock ? '  •  (modo sin conexión)' : ''}
        </Text>
        <CourseMap lecciones={mapa.lecciones} onLeccionPress={handleLeccionPress} />
      </>
    );
  }

  return (
    <Background>

      <View style={[styles.mainContainer, { paddingLeft: Math.max(insets.left, 15), paddingRight: Math.max(insets.right, 15) }]}>
        <HeaderHome
          perfil={perfil}
          cuenta={cuenta}
          curso={cursoListo ? mapa.curso : null}
          onVolver={cursoElegido !== null ? volverACursos : undefined}
          onOpenMenu={() => setIsMenuOpen(true)}
          solicitudesPendientes={solicitudesPendientes}
          onOpenNotificaciones={() => navigation.navigate('Solicitudes')}
        />
        {contenido}
      </View>

      <SideMenu
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
      {/* Después de la carga: dos modales a la vez no se ven bien */}
      <PrimeraCuerdaModal visible={bienvenida && !cargando} onCerrar={cerrarBienvenida} />
    </Background>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, padding: 15 },
  botonVolver: { alignSelf: 'flex-start', width: 'auto', minHeight: 40, paddingVertical: 8, paddingHorizontal: 16, marginTop: 0, marginBottom: 6 },
  botonVolverTexto: { fontSize: 14 },
  progressText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#fff', fontSize: 16 },
});
