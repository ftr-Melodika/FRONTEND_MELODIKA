import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Background } from '../components/Background';
import { ENDPOINTS } from '../config/api';

export function HomeScreen({ route, navigation }) {
  // 1. Recibimos la cuenta real que nos mandó LoginScreen
  const cuenta = route.params?.cuenta;
  // (Futuro) Recibiremos el perfil que elija el usuario en la pantalla de tu compañero
  const perfil = route.params?.perfil; 

  // 2. Estados reales para guardar la info de la base de datos
  const [lecciones, setLecciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // 3. Cuando la pantalla carga, le pedimos las lecciones a Node.js
  useEffect(() => {
    async function cargarMapaDeCursos() {
      try {
        // Temporal: Si no hay perfil, usamos el ID de la cuenta para que no tire error
        const idParaBuscar = perfil ? perfil.id : cuenta?.id; 
        
        if (!idParaBuscar) return;

        // Llamamos a la API usando la ruta dinámica que configuramos en api.js
        const response = await fetch(ENDPOINTS.lecciones(idParaBuscar));
        const textResponse = await response.text();
        let data = null;

        if (textResponse) {
          try {
            data = JSON.parse(textResponse);
          } catch (e) {
            throw new Error(`El servidor respondió con un formato inesperado (${response.status}). Revisá que el backend esté corriendo y que la URL sea correcta.`);
          }
        }

        if (!response.ok) {
          throw new Error(data?.message || `Error al cargar las lecciones (${response.status})`);
        }

        // Guardamos el arreglo real de lecciones que vino de Supabase
        setLecciones(Array.isArray(data) ? data : []);

      } catch (error) {
        Alert.alert('Aviso', 'Todavía no hay lecciones cargadas en la base de datos o hubo un error.');
        console.log(error);
      } finally {
        setLoading(false); // Apagamos la ruedita de carga
      }
    }

    cargarMapaDeCursos();
  }, []);

  const handleLeccionPress = (leccion) => {
    if (leccion.estado === 'bloqueada') {
      Alert.alert('Lección Bloqueada 🔒', 'Completá las lecciones anteriores para avanzar.');
    } else {
      Alert.alert('¡A tocar! 🎸', `Entrando a la lección: ${leccion.titulo}`);
      // Futuro: navigation.navigate('LeccionActiva', { leccionId: leccion.id })
    }
  };

  return (
    <Background>
      <View style={styles.mainContainer}>
        
        {/* BARRA SUPERIOR (Gamificación y Perfil) */}
        <View style={styles.topBar}>
          <Text style={styles.welcomeText}>
            Hola, {perfil ? perfil.nombre : cuenta?.email?.split('@')[0]} 👋
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statChip}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statText}>0 Días</Text>
            </View>

            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={() => navigation.replace('Login')}
            >
              <Text style={styles.logoutIcon}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* MAPA DE CURSOS HORIZONTAL */}
        <View style={styles.mapSection}>
          <Text style={styles.courseTitle}>Guitarra Inicial 🎸</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#b28cff" style={{ marginTop: 50 }} />
          ) : lecciones.length === 0 ? (
            <Text style={styles.emptyText}>No se encontraron lecciones en la base de datos.</Text>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollMapContent}
            >
              {lecciones.map((leccion, index) => {
                // Lógica visual: Zig-zag para que parezca un camino
                const isEven = index % 2 === 0;
                const marginVerticalOffset = isEven ? 20 : -20;

                return (
                  <View 
                    key={leccion.id} 
                    style={[styles.nodeContainer, { transform: [{ translateY: marginVerticalOffset }] }]}
                  >
                    {/* Línea conectora */}
                    {index < lecciones.length - 1 && <View style={styles.connectorLine} />}

                    {/* Nodo interactivo */}
                    <TouchableOpacity
                      style={[
                        styles.circleNode,
                        leccion.estado === 'completada' && styles.nodeCompletado,
                        leccion.estado === 'disponible' && styles.nodeDisponible,
                        leccion.estado === 'bloqueada' && styles.nodeBloqueado,
                      ]}
                      onPress={() => handleLeccionPress(leccion)}
                      activeOpacity={0.8}
                    >
                      {leccion.estado === 'completada' && <Text style={styles.nodeIcon}>✔️</Text>}
                      {leccion.estado === 'disponible' && <Text style={styles.nodeIcon}>🎸</Text>}
                      {leccion.estado === 'bloqueada' && <Text style={styles.nodeIcon}>🔒</Text>}
                    </TouchableOpacity>

                    {/* Info de la lección abajo del nodo */}
                    <View style={styles.nodeCard}>
                      <Text style={styles.nodeTitle} numberOfLines={1}>{leccion.titulo}</Text>
                      <Text style={styles.nodeSubtitle}>{leccion.tipo} • {leccion.xp || 0} XP</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    marginBottom: 10,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'serif',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  statEmoji: { fontSize: 16 },
  statText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  logoutButton: {
    backgroundColor: 'rgba(226, 85, 106, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  logoutIcon: { color: '#fff', fontWeight: 'bold' },
  mapSection: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
  },
  courseTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'serif',
    marginBottom: 10,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  scrollMapContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingRight: 100,
    height: '100%',
  },
  nodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 170,
    position: 'relative',
  },
  connectorLine: {
    position: 'absolute',
    left: 85,
    top: 35,
    width: 170,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: -1,
  },
  circleNode: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 8,
  },
  nodeCompletado: { backgroundColor: '#a884ff', borderColor: '#fff' },
  nodeDisponible: { backgroundColor: '#4c52d9', borderColor: '#b28cff' },
  nodeBloqueado: { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.3)' },
  nodeIcon: { fontSize: 22, color: '#fff' },
  nodeCard: {
    width: 130,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  nodeTitle: { color: '#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  nodeSubtitle: { color: 'rgba(255, 255, 255, 0.65)', fontSize: 10, marginTop: 2 },
});