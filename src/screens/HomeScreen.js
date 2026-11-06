// Archivo: src/screens/HomeScreen.js
import { useState, useContext, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { SideMenu } from '../components/SideMenu';
import { AuthContext } from '../context/AuthContext';

import { HeaderHome } from '../components/home/HeaderHome';
import { CourseMap } from '../components/home/CourseMap';
import { CoursePickerModal } from '../components/home/CoursePickerModal';
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
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);

  // Recordamos el curso que eligió el usuario para no perderlo al volver de una lección
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

  const handleLeccionPress = useCallback((leccion) => {
    if (leccion.estado === 'bloqueada') {
      Alert.alert('Lección Bloqueada 🔒', 'Completá las lecciones anteriores para avanzar.');
    } else {
      const leccionesDelCurso = mapa.lecciones;
      navigation.navigate('Leccion', { leccion, cursoId: mapa.curso?.id, totalLecciones: leccionesDelCurso.length });
    }
  }, [navigation, mapa]);

  const handleSelectCurso = (curso) => {
    if (!curso.desbloqueado) {
      Alert.alert('Curso Bloqueado 🔒', 'Terminá el curso anterior para desbloquear este.');
      return;
    }
    setIsPickerOpen(false);
    cursoElegidoRef.current = curso.id;
    cargarMapa();
  };

  const completadas = mapa.lecciones.filter((l) => l.estado === 'completada').length;

  return (
    <Background>

      <View style={[styles.mainContainer, { paddingLeft: Math.max(insets.left, 15), paddingRight: Math.max(insets.right, 15) }]}>
        <HeaderHome
          perfil={perfil}
          cuenta={cuenta}
          curso={mapa.curso}
          puedeCambiarCurso={mapa.cursos.length > 1}
          onCambiarCurso={() => setIsPickerOpen(true)}
          onOpenMenu={() => setIsMenuOpen(true)}
          solicitudesPendientes={solicitudesPendientes}
          onOpenNotificaciones={() => navigation.navigate('Solicitudes')}
        />

        {!loading && mapa.lecciones.length > 0 && (
          <Text style={styles.progressText}>
            {completadas} de {mapa.lecciones.length} lecciones completadas
            {mapa.curso?.completado ? '  •  ¡Curso terminado! 🏆' : ''}
            {mapa.esMock ? '  •  (modo sin conexión)' : ''}
          </Text>
        )}

        {!loading && mapa.lecciones.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Este curso todavía no tiene lecciones cargadas.</Text>
          </View>
        )}

        {!loading && mapa.lecciones.length > 0 && (
          <CourseMap
            lecciones={mapa.lecciones}
            onLeccionPress={handleLeccionPress}
          />
        )}
      </View>

      <CoursePickerModal
        visible={isPickerOpen}
        cursos={mapa.cursos}
        cursoActualId={mapa.curso?.id}
        onSelect={handleSelectCurso}
        onClose={() => setIsPickerOpen(false)}
      />

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
  progressText: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.8)', fontSize: 16 },
});
