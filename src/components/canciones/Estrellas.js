// Archivo: src/components/canciones/Estrellas.js
// Las tres estrellas de una canción: grises si nunca se tocó y doradas según el mejor resultado (1, 2 o 3).
import { StyleSheet, Text, View } from 'react-native';
import { ESTRELLAS_MAXIMAS } from '../../utils/canciones';

export function Estrellas({ cantidad = 0, tamano = 16 }) {
  return (
    <View style={styles.fila} accessible accessibilityLabel={cantidad > 0 ? `${cantidad} de ${ESTRELLAS_MAXIMAS} estrellas` : 'Todavía sin estrellas'}>
      {Array.from({ length: ESTRELLAS_MAXIMAS }, (_, i) => (
        <Text key={i} style={[styles.estrella, { fontSize: tamano, lineHeight: tamano + 2 }, i < cantidad && styles.estrellaGanada]}>★</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 1 },
  estrella: { color: 'rgba(255,255,255,0.28)' },
  estrellaGanada: { color: '#ffd35c' },
});
