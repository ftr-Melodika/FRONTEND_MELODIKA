// Archivo: src/components/leccion/LeccionSidebar.js
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../Button';

export function LeccionSidebar({ leccion, paso, totalPasos, instruccion, onBack }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.sidebar, { marginLeft: Math.max(insets.left, 10) }]}>
      <Button
        title="← Volver"
        variant="link"
        onPress={onBack}
        style={styles.backButton}
        textStyle={styles.volverText}
      />

      <Text style={styles.title}>{leccion?.titulo || 'Lección'}</Text>
      <Text style={styles.pasosText}>Paso {paso} de {totalPasos}  •  {leccion?.xp ?? 0} XP</Text>

      {/* Barrita de progreso de los pasos */}
      <View style={styles.dotsRow}>
        {[...Array(totalPasos)].map((_, i) => (
          <View key={i} style={[styles.dot, i < paso && styles.dotActivo]} />
        ))}
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionInfo}>{instruccion}</Text>
      </View>

      {leccion?.estado === 'completada' && (
        <Text style={styles.yaHecha}>✔️ Ya completaste esta lección</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: { width: '30%', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'flex-start' },
  backButton: { marginBottom: 20, alignSelf: 'flex-start' },
  volverText: { color: '#b28cff', fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 24, color: '#fff', fontFamily: 'serif', fontWeight: 'bold', marginBottom: 15 },
  pasosText: { color: '#a3fba3', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  dotsRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  dot: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotActivo: { backgroundColor: '#b28cff' },
  instructionsContainer: { flex: 1, justifyContent: 'center' },
  instructionInfo: { color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 22 },
  yaHecha: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center' },
});
