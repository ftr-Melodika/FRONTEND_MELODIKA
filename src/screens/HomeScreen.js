import { useState, useEffect, useContext, useCallback } from 'react'; 
import { View, StyleSheet, Alert } from 'react-native';
import { Background } from '../components/Background';
import { SideMenu } from '../components/SideMenu'; 
import { ENDPOINTS } from '../config/api';
import axiosClient from '../api/axiosClient';
import { AuthContext } from '../context/AuthContext'; 

// Importamos nuestros especialistas del Home
import { HeaderHome } from '../components/home/HeaderHome';
import { CourseMap } from '../components/home/CourseMap';
// Importamos el nuevo modal de carga
import { LoadingModal } from '../components/LoadingModal';

// 👇 Le agregamos los datos dinámicos al mock para que pruebes tu nueva LeccionScreen
const MOCK_LECCIONES = [
  { 
    id: 1, titulo: 'Afinación Básica', tipo: 'Teoría', estado: 'completada', xp: 50,
    videoId: "6yKz57b0wG8",
    instrucciones: ["Mirá el video para entender cómo usar la clavija.", "La cuerda más fina (abajo) es la 1ra (Mi).", "Tocala al aire (sin pisar) hasta que afine."],
    textoTeoria: "La afinación estándar va de la 1ra a la 6ta cuerda: Mi, Si, Sol, Re, La, Mi.",
    textoDestacado: "Hoy vamos a afinar la 1ra cuerda al aire.",
    trasteObjetivo: "0", dotLeft: "46%", dotBottom: "10%" // Traste 0 = al aire
  },
  { 
    id: 2, titulo: 'Primeros Acordes', tipo: 'Práctica', estado: 'disponible', xp: 100,
    videoId: "bbzB5qR6N4c",
    instrucciones: ["Fijate cómo el profe posiciona la mano en forma de 'C'.", "Tratemos de pisar la 1ra cuerda en el traste 3.", "¡Tocá fuerte y claro!"],
    textoTeoria: "El traste 3 de la 1ra cuerda nos da la nota Sol.",
    textoDestacado: "Pisá el 3er espacio con tu dedo anular.",
    trasteObjetivo: "3", dotLeft: "46%", dotBottom: "76%" // Traste 3
  },
  { id: 3, titulo: 'Ritmo de Fogón', tipo: 'Práctica', estado: 'bloqueada', xp: 150 },
  { id: 4, titulo: 'Tu primer Canción', tipo: 'Canción', estado: 'bloqueada', xp: 200 }
];

export function HomeScreen({ route, navigation }) {
  // 👇 Leemos cuenta y token del Contexto, y perfil de los params de la ruta (como ya lo tenías)
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
      {/* 👇 Tapamos todo mientras carga el mapa */}
      <LoadingModal visible={loading} text="Cargando tu progreso..." />

      <View style={styles.mainContainer}>
        
        <HeaderHome 
          perfil={perfil} 
          cuenta={cuenta} 
          onOpenMenu={() => setIsMenuOpen(true)} 
        />

        {/* 👇 Solo mostramos el mapa si ya no está cargando */}
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