// Archivo: src/components/leccion/LeccionSidebar.js
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MenuButton } from '../MenuButton';
import { SideMenu } from '../SideMenu';

export function LeccionSidebar({ leccion, paso, totalPasos, instruccion }) {
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <View style={[styles.sidebar, { marginLeft: Math.max(insets.left, 10) }]}>
      <View style={styles.topRow}>
        <MenuButton onPress={() => setIsMenuOpen(true)} />
        <Text style={styles.pasosText}>Paso {paso} de {totalPasos}</Text>
      </View>

      <Text style={styles.title} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.75}>
        {leccion?.titulo || 'Lección'}
      </Text>
      <Text style={styles.xpText}>⚡ {leccion?.xp ?? 0} XP</Text>

      {/* Barrita de progreso de los pasos */}
      <View style={styles.dotsRow}>
        {[...Array(totalPasos)].map((_, i) => (
          <View key={i} style={[styles.dot, i < paso && styles.dotActivo]} />
        ))}
      </View>

      <ScrollView style={styles.instructionsScroll} contentContainerStyle={styles.instructionsContent}>
        <Text style={styles.instructionInfo}>{instruccion}</Text>
      </ScrollView>

      {leccion?.estado === 'completada' && (
        <Text style={styles.yaHecha}>✔️ Ya completaste esta lección</Text>
      )}

      <SideMenu visible={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: { width: '30%', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  pasosText: { color: '#a3fba3', fontSize: 13, fontWeight: 'bold' },
  title: { fontSize: 20, color: '#fff', fontFamily: 'serif', fontWeight: 'bold', marginBottom: 6 },
  xpText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginBottom: 10 },
  dotsRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  dot: { flex: 1, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotActivo: { backgroundColor: '#b28cff' },
  instructionsScroll: { flex: 1 },
  instructionsContent: { flexGrow: 1, justifyContent: 'center' },
  instructionInfo: { color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 22 },
  yaHecha: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center', marginTop: 6 },
});
