// Archivo: src/components/ScreenHeader.js
// Encabezado simple con "← Volver" y título, para las pantallas secundarias del menú.
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export function ScreenHeader({ title, onBack }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { paddingVertical: 5, paddingRight: 15 },
  backText: { color: '#b28cff', fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 24, color: '#fff', fontFamily: 'serif', fontWeight: 'bold', marginLeft: 10 },
});
