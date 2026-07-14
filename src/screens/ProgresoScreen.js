import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Background } from '../components/Background';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ProgresoScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  // 💡 DATOS MOCKEADOS: En el futuro esto vendrá de tu AuthContext o backend
  const stats = {
    xp: 1250,
    racha: 3,
    leccionesCompletadas: 5
  };

  const cursoActual = {
    nombre: "Guitarra Inicial",
    porcentaje: 25, // 25%
    proximaLeccion: "Primeros Acordes"
  };

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20) }]}> 
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Tu Progreso</Text>
        </View>

        {/* CONTENIDO A DOS COLUMNAS (Ideal para formato horizontal) */}
        <View style={styles.contentRow}>
          
          {/* COLUMNA IZQUIERDA: Estadísticas Globales */}
          <View style={styles.statsColumn}>
            
            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(178, 140, 255, 0.15)' }]}>
                <Text style={styles.icon}>⚡</Text>
              </View>
              <View style={styles.statTextWrapper}>
                <Text style={styles.statLabel}>Experiencia Total</Text>
                <Text style={styles.statValue}>{stats.xp} XP</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 165, 0, 0.15)' }]}>
                <Text style={styles.icon}>🔥</Text>
              </View>
              <View style={styles.statTextWrapper}>
                <Text style={styles.statLabel}>Racha Actual</Text>
                <Text style={styles.statValue}>{stats.racha} Días</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(50, 205, 50, 0.15)' }]}>
                <Text style={styles.icon}>✔️</Text>
              </View>
              <View style={styles.statTextWrapper}>
                <Text style={styles.statLabel}>Lecciones Completadas</Text>
                <Text style={styles.statValue}>{stats.leccionesCompletadas}</Text>
              </View>
            </View>

          </View>

          {/* COLUMNA DERECHA: Curso Actual y Barra de Progreso */}
          <View style={styles.courseColumn}>
            <View style={styles.courseCard}>
              <Text style={styles.courseOverline}>CURSO ACTIVO</Text>
              <Text style={styles.courseTitle}>🎸 {cursoActual.nombre}</Text>

              {/* Barra de progreso */}
              <View style={styles.progressContainer}>
                <View style={styles.progressHeaderRow}>
                  <Text style={styles.progressLabel}>Progreso del curso</Text>
                  <Text style={styles.progressPercentage}>{cursoActual.porcentaje}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  {/* El ancho se llena dinámicamente según el porcentaje */}
                  <View style={[styles.progressBarFill, { width: `${cursoActual.porcentaje}%` }]} />
                </View>
              </View>

              <Text style={styles.nextLessonInfo}>Próxima lección: <Text style={{fontWeight:'bold', color: '#fff'}}>{cursoActual.proximaLeccion}</Text></Text>

              <TouchableOpacity style={styles.continueBtn} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.continueBtnText}>Continuar aprendiendo  ▶</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>

      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, width: '100%' },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  backBtn: { paddingVertical: 5, paddingRight: 15 },
  backText: { color: '#b28cff', fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 24, color: '#fff', fontFamily: 'serif', fontWeight: 'bold', marginLeft: 10 },

  // Layout principal
  contentRow: { flex: 1, flexDirection: 'row', gap: 20 },
  statsColumn: { flex: 1, justifyContent: 'space-between', paddingBottom: 10 },
  courseColumn: { flex: 1.2 },

  // Tarjetas de Estadísticas (Izquierda)
  statCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  icon: { fontSize: 24 },
  statTextWrapper: { flex: 1 },
  statLabel: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  // Tarjeta de Curso (Derecha)
  courseCard: { flex: 1, backgroundColor: '#111122', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(178, 140, 255, 0.2)', justifyContent: 'center' },
  courseOverline: { color: '#b28cff', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 8 },
  courseTitle: { fontSize: 28, color: '#fff', fontFamily: 'serif', fontWeight: 'bold', marginBottom: 30 },
  
  progressContainer: { marginBottom: 25 },
  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontWeight: '600' },
  progressPercentage: { color: '#a3fba3', fontSize: 16, fontWeight: 'bold' },
  progressBarBg: { height: 12, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#b28cff', borderRadius: 6 },

  nextLessonInfo: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, marginBottom: 20 },
  continueBtn: { backgroundColor: '#4c52d9', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  continueBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' }
});