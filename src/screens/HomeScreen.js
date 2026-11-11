// Archivo: src/screens/HomeScreen.js
// Primero se ven los cursos; al elegir uno, sus ejercicios. Al volver de una lección se queda en el curso.
import { useState, useContext, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { SideMenu } from '../components/SideMenu';
import { AuthContext } from '../context/AuthContext';

import { HeaderHome } from '../components/home/HeaderHome';
import { CourseMap } from '../components/home/CourseMap';
import { CourseList } from '../components/home/CourseList';
import { LoadingModal } from '../components/LoadingModal';

import { leccionesService } from '../services/leccionesService';
import { amistadesService } from '../services/amistadesService';

const INTERVALO_NOTIFICACIONES_MS = 30000;

export function HomeScreen({ navigation }) {
  // Nos traemos el perfil inyectado desde el contexto
  const { userData: cuenta, perfil, refrescarPerfil } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [mapa, setMapa] = useState({ cursos: [], curso: null, lecciones: [], esMock: false });
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);
  // null = lista de cursos; un id = los ejercicios de ese curso
  const [cursoElegido, setCursoElegido] = useState(null);

  // El curso elegido también en una ref: cargarMapa la lee sin tener que recrearse
  const cursoElegidoRef = useRef(null);
  const yaCargoRef = useRef(false);

  const perfilId = perfil?.id;

  const cargarMapa = useCallback(async () => {
    if (!perfilId) {
      navigation.replace('SelectUser');
      return;
    }
    // Solo mostramos el modal de carga la primera vez; después recargamos "en silencio"
    if (!yaCargoRef.current) setLoading(true);
    try {
      const datos = await leccionesService.obtenerMapa(perfilId, cursoElegidoRef.current);
      setMapa(datos);
      yaCargoRef.current = true;
    } finally {
      setLoading(false);
    }
  }, [perfilId, navigation]);

  // Cada vez que la pantalla vuelve a estar visible (ej: al terminar una lección) recargamos el progreso
  useFocusEffect(
    useCallback(() => {
      cargarMapa();
      refrescarPerfil();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargarMapa])
  );

  // La campanita se actualiza al volver a esta pantalla y cada 30 segundos mientras está visible.
  // Si la consulta falla, mantenemos el último número: no es motivo para interrumpir al usuario.
  useFocusEffect(
    useCallback(() => {
      if (!perfilId) return undefined;
      let cancelado = false;
      const actualizar = async () => {
        try {
          const { recibidas } = await amistadesService.obtenerSolicitudes(perfilId);
          if (!cancelado) setSolicitudesPendientes(recibidas.length);
        } catch (error) {
          console.log('Error buscando solicitudes:', error.message);
        }
      };
      actualizar();
      const intervalo = setInterval(actualizar, INTERVALO_NOTIFICACIONES_MS);
      return () => {
        cancelado = true;
        clearInterval(intervalo);
      };
    }, [perfilId])
  );

  const volverACursos = useCallback(() => {
    cursoElegidoRef.current = null;
    setCursoElegido(null);
  }, []);

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
    cursoElegidoRef.current = curso.id;
    setCursoElegido(curso.id);
    cargarMapa();
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
  if (!loading && cursoElegido === null) {
    contenido = <CourseList cursos={mapa.cursos} onSelect={handleSelectCurso} />;
  } else if (!loading && !cursoListo) {
    contenido = <View style={styles.centro}><ActivityIndicator color="#fff" size="large" /></View>;
  } else if (!loading && mapa.lecciones.length === 0) {
    contenido = <View style={styles.centro}><Text style={styles.emptyText}>Este curso todavía no tiene ejercicios cargados.</Text></View>;
  } else if (!loading) {
    contenido = (
      <>
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
      <LoadingModal visible={loading} text="Cargando tu progreso..." />
    </Background>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, padding: 15 },
  progressText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#fff', fontSize: 16 },
});
