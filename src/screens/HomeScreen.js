import { useState, useEffect, useContext, useCallback } from 'react'; 
import { View, StyleSheet, Alert } from 'react-native';
import { Background } from '../components/Background';
import { SideMenu } from '../components/SideMenu'; 
import { ENDPOINTS } from '../config/api';
import axiosClient from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext'; 

// Importamos nuestros nuevos componentes limpios
import { HeaderHome } from '../components/home/HeaderHome';
import { CourseMap } from '../components/home/CourseMap';

const MOCK_LECCIONES = [
  { id: 1, titulo: 'Afinación Básica', tipo: 'Teoría', estado: 'completada', xp: 50 },
  { id: 2, titulo: 'Primeros Acordes', tipo: 'Práctica', estado: 'disponible', xp: 100 },
  { id: 3, titulo: 'Ritmo de Fogón', tipo: 'Práctica', estado: 'bloqueada', xp: 150 },
  { id: 4, titulo: 'Tu primer Canción', tipo: 'Canción', estado: 'bloqueada', xp: 200 }
];

export function HomeScreen({ route, navigation }) {
  const { userData: cuenta, userToken: token } = useContext(AuthContext);
  const { perfil } = route.params || {};

  const [lecciones, setLecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  useEffect(() => {
    async function cargarMapaDeCursos() {
      try {
        const idParaBuscar = perfil?.id || cuenta?.id;
        if (!idParaBuscar) return;

        const response = await axiosClient.get(ENDPOINTS.lecciones(idParaBuscar));
        const data = response.data;
        let leccionesDesdeBD = Array.isArray(data) ? data : (data.data || []);
        if (leccionesDesdeBD.length === 0) leccionesDesdeBD = MOCK_LECCIONES;
        setLecciones(leccionesDesdeBD);
      } catch (error) {
        console.log('Error cargando lecciones:', error.response?.data || error.message);
        setLecciones(MOCK_LECCIONES);
      } finally {
        setLoading(false);
      }
    }
    cargarMapaDeCursos(); 
  }, [perfil, cuenta, token]);

  const handleLeccionPress = useCallback((leccion) => {
    if (leccion.estado === 'bloqueada') {
      Alert.alert('Lección Bloqueada 🔒', 'Completá las lecciones anteriores para avanzar.');
    } else {
      navigation.navigate('Leccion', { leccion });
    }
  }, [navigation]);

  return (
    <Background>
      <View style={styles.mainContainer}>
        
        {/* Usamos el Header delegándole la info */}
        <HeaderHome 
          perfil={perfil} 
          cuenta={cuenta} 
          onOpenMenu={() => setIsMenuOpen(true)} 
        />

        {/* Usamos el Mapa pasándole los datos y la acción */}
        <CourseMap 
          lecciones={lecciones} 
          loading={loading} 
          onLeccionPress={handleLeccionPress} 
        />

      </View>

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
});