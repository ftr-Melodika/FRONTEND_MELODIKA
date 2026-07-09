import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export function HeaderHome({ perfil, cuenta, onOpenMenu }) {
  // Determinamos el nombre a mostrar directamente acá
  const nombreMostrar = perfil ? perfil.nombre : cuenta?.email?.split('@')[0];

  return (
    <View style={styles.topBar}>
      <TouchableOpacity style={styles.menuButton} onPress={onOpenMenu}>
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>

      <Text style={styles.welcomeText} numberOfLines={1}>
        Hola, {nombreMostrar} 👋
      </Text>
      
      <Text style={styles.courseTitle}>🎸 Guitarra Inicial</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statChip}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={styles.statText}>0 Días</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', height: 50, marginBottom: 15, paddingHorizontal: 10 },
  menuButton: { marginRight: 15, backgroundColor: 'rgba(255,255,255,0.1)', width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  menuIcon: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: -2 },
  welcomeText: { color: '#fff', fontSize: 16, fontFamily: 'serif', fontWeight: 'bold', flex: 1 },
  courseTitle: { color: '#b28cff', fontSize: 22, fontWeight: 'bold', fontFamily: 'serif', flex: 1.5, textAlign: 'center' },
  statsContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  statChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  statEmoji: { fontSize: 16 },
  statText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});