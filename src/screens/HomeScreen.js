// Archivo: src/screens/HomeScreen.js
import { useState, useContext, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Background } from '../components/Background';
import { SideMenu } from '../components/SideMenu';
import { AuthContext } from '../context/AuthContext';

import { HeaderHome } from '../components/home/HeaderHome';
import { CourseMap } from '../components/home/CourseMap';
import { CoursePickerModal } from '../components/home/CoursePickerModal';
import { LoadingModal } from '../components/LoadingModal';

import { leccionesService } from '../services/leccionesService';

export function HomeScreen({ navigation }) {
  // Nos traemos el perfil inyectado desde el contexto
  const { userData: cuenta, perfil, refrescarPerfil } = useContext(AuthContext);

  const [mapa, setMapa] = useState({ cursos: [], curso: null, lecciones: [], esMock: false });
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

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
      <LoadingModal visible={loading} text="Cargando tu progreso..." />

      <View style={styles.mainContainer}>
        <HeaderHome
          perfil={perfil}
          cuenta={cuenta}
          curso={mapa.curso}
          puedeCambiarCurso={mapa.cursos.length > 1}
          onCambiarCurso={() => setIsPickerOpen(true)}
          onOpenMenu={() => setIsMenuOpen(true)}
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
        perfil={perfil}
        navigation={navigation}
      />
    </Background>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, padding: 15 },
  progressText: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.8)', fontSize: 16 },
});
