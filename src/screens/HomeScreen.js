// Archivo: src/screens/HomeScreen.js
import { useState, useEffect, useContext, useCallback } from 'react'; 
import { View, StyleSheet, Alert } from 'react-native';
import { Background } from '../components/Background';
import { SideMenu } from '../components/SideMenu'; 
import { AuthContext } from '../context/AuthContext'; 

import { HeaderHome } from '../components/home/HeaderHome';
import { CourseMap } from '../components/home/CourseMap';
import { LoadingModal } from '../components/LoadingModal';

// 👇 Importamos nuestro nuevo servicio
import { leccionesService } from '../services/leccionesService';

export function HomeScreen({ navigation }) {
  // Nos traemos el perfil inyectado desde el contexto
  const { userData: cuenta, userToken: token, perfil } = useContext(AuthContext);

  const [lecciones, setLecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  useEffect(() => {
    async function cargarMapaDeCursos() {
      try {
        const idParaBuscar = perfil?.id || cuenta?.id;
        if (!idParaBuscar) return;

        // 👇 Llamamos al servicio de forma limpia, sin Try/Catch pesados de Axios
        const datosLecciones = await leccionesService.obtenerLecciones(idParaBuscar);
        setLecciones(datosLecciones);

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
      <LoadingModal visible={loading} text="Cargando tu progreso..." />

      <View style={styles.mainContainer}>
        <HeaderHome 
          perfil={perfil} 
          cuenta={cuenta} 
          onOpenMenu={() => setIsMenuOpen(true)} 
        />

        {!loading && (
          <CourseMap 
            lecciones={lecciones} 
            onLeccionPress={handleLeccionPress} 
          />
        )}
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