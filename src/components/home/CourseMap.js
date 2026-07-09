import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

export function CourseMap({ lecciones, loading, onLeccionPress }) {
  if (loading) {
    return (
      <View style={styles.mapSection}>
        <ActivityIndicator size="large" color="#b28cff" style={{ marginTop: 50 }} />
      </View>
    );
  }

  return (
    <View style={styles.mapSection}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollMapContent}>
        {lecciones.map((leccion, index) => (
          <View key={leccion.id} style={styles.nodeContainer}>
            {index < lecciones.length - 1 && <View style={styles.horizontalConnector} />}
            
            <TouchableOpacity
              style={[ 
                styles.circleNode, 
                leccion.estado === 'completada' && styles.nodeCompletado, 
                leccion.estado === 'disponible' && styles.nodeDisponible, 
                leccion.estado === 'bloqueada' && styles.nodeBloqueado 
              ]}
              onPress={() => onLeccionPress(leccion)} 
              activeOpacity={0.8}
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
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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