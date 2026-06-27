import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Background } from '../components/Background';
import { SideMenu } from '../components/SideMenu'; // 👈 IMPORTAMOS EL MENÚ
import { ENDPOINTS } from '../config/api';

export function HomeScreen({ route, navigation }) {
  const { cuenta, perfil, token } = route.params || {};

  const [lecciones, setLecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 👈 ESTADO DEL MENÚ

  const MOCK_LECCIONES = [
    { id: 1, titulo: 'Afinación Básica', tipo: 'Teoría', estado: 'completada', xp: 50 },
    { id: 2, titulo: 'Primeros Acordes', tipo: 'Práctica', estado: 'disponible', xp: 100 },
    { id: 3, titulo: 'Ritmo de Fogón', tipo: 'Práctica', estado: 'bloqueada', xp: 150 },
    { id: 4, titulo: 'Tu primer Canción', tipo: 'Canción', estado: 'bloqueada', xp: 200 }
  ];

  useEffect(() => {
    async function cargarMapaDeCursos() {
      try {
        const idParaBuscar = perfil?.id || cuenta?.id; 
        if (!idParaBuscar) return;

        const response = await fetch(ENDPOINTS.lecciones(idParaBuscar), { headers: { Authorization: `Bearer ${token}` } });
        let leccionesDesdeBD = [];
        if (response.ok) {
          const data = await response.json();
          leccionesDesdeBD = Array.isArray(data) ? data : (data.data || []);
        }
        if (leccionesDesdeBD.length === 0) leccionesDesdeBD = MOCK_LECCIONES;
        setLecciones(leccionesDesdeBD);
      } catch (error) { setLecciones(MOCK_LECCIONES); } finally { setLoading(false); }
    }
    cargarMapaDeCursos();
  }, [perfil, cuenta, token]);

  const handleLeccionPress = (leccion) => {
    if (leccion.estado === 'bloqueada') {
      Alert.alert('Lección Bloqueada 🔒', 'Completá las lecciones anteriores para avanzar.');
    } else {
      navigation.navigate('Leccion', { leccion, perfil, token });
    }
  };

  return (
    <Background>
      <View style={styles.mainContainer}>
        
        {/* BARRA SUPERIOR CON BOTÓN HAMBURGUESA */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setIsMenuOpen(true)}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>

          <Text style={styles.welcomeText} numberOfLines={1}>
            Hola, {perfil ? perfil.nombre : cuenta?.email?.split('@')[0]} 👋
          </Text>
          
          <Text style={styles.courseTitle}>🎸 Guitarra Inicial</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statChip}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statText}>0 Días</Text>
            </View>
          </View>
        </View>

        {/* MAPA HORIZONTAL */}
        <View style={styles.mapSection}>
          {loading ? (
            <ActivityIndicator size="large" color="#b28cff" style={{ marginTop: 50 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollMapContent}>
              {lecciones.map((leccion, index) => {
                return (
                  <View key={leccion.id} style={styles.nodeContainer}>
                    {index < lecciones.length - 1 && <View style={styles.horizontalConnector} />}
                    <TouchableOpacity
                      style={[ styles.circleNode, leccion.estado === 'completada' && styles.nodeCompletado, leccion.estado === 'disponible' && styles.nodeDisponible, leccion.estado === 'bloqueada' && styles.nodeBloqueado ]}
                      onPress={() => handleLeccionPress(leccion)} activeOpacity={0.8}
                    >
                      {leccion.estado === 'completada' && <Text style={styles.nodeIcon}>✔️</Text>}
                      {leccion.estado === 'disponible' && <Text style={styles.nodeIcon}>🎸</Text>}
                      {leccion.estado === 'bloqueada' && <Text style={styles.nodeIcon}>🔒</Text>}
                    </TouchableOpacity>
                    <View style={styles.nodeCard}>
                      <Text style={styles.nodeTitle} numberOfLines={1}>{leccion.titulo}</Text>
                      <Text style={styles.nodeSubtitle}>{leccion.tipo} • {leccion.xp} XP</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>

      {/* 👇 NUESTRO COMPONENTE DE MENÚ FLOTANTE */}
      <SideMenu 
        visible={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        perfil={perfil} 
        cuenta={cuenta} 
        token={token} 
        navigation={navigation} 
      />
    </Background>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, padding: 15 },
  topBar: { flexDirection: 'row', alignItems: 'center', height: 50, marginBottom: 15, paddingHorizontal: 10 },
  menuButton: { marginRight: 15, backgroundColor: 'rgba(255,255,255,0.1)', width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  menuIcon: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: -2 },
  welcomeText: { color: '#fff', fontSize: 16, fontFamily: 'serif', fontWeight: 'bold', flex: 1 },
  courseTitle: { color: '#b28cff', fontSize: 22, fontWeight: 'bold', fontFamily: 'serif', flex: 1.5, textAlign: 'center' },
  statsContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  statChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  statEmoji: { fontSize: 16 },
  statText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  mapSection: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)' },
  scrollMapContent: { alignItems: 'center', paddingHorizontal: 40 },
  nodeContainer: { alignItems: 'center', justifyContent: 'center', width: 220, height: '100%', position: 'relative' },
  horizontalConnector: { position: 'absolute', top: '40%', left: 110, width: 220, height: 6, backgroundColor: 'rgba(255, 255, 255, 0.2)', zIndex: -1 },
  circleNode: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 3, zIndex: 2 },
  nodeCompletado: { backgroundColor: '#a884ff', borderColor: '#fff' },
  nodeDisponible: { backgroundColor: '#4c52d9', borderColor: '#b28cff' },
  nodeBloqueado: { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.3)' },
  nodeIcon: { fontSize: 26, color: '#fff' },
  nodeCard: { marginTop: 15, width: 160, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  nodeTitle: { color: '#fff', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  nodeSubtitle: { color: 'rgba(255, 255, 255, 0.65)', fontSize: 11, marginTop: 4 },
});