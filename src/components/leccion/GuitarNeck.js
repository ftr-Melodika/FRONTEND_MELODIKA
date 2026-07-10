// Archivo: src/components/leccion/GuitarNeck.js
import { View, Text, StyleSheet } from 'react-native';

export function GuitarNeck({ targetNumber, dotLeft, dotBottom }) {
  return (
    <View style={styles.mastilContainer}>
      
      {/* Trastes (Verticales) */}
      <View style={styles.fretsOverlay}>
        {[...Array(6)].map((_, i) => <View key={i} style={styles.fretLine} />)}
      </View>
      
      {/* Cuerdas (Horizontales) */}
      <View style={styles.stringsContainer}>
        {[1, 2, 3, 4, 5, 6].map(num => (
          <View key={num} style={styles.stringWrapper}>
            <Text style={styles.stringNumber}>{num}</Text>
            <View style={[styles.stringLine, num > 3 && styles.thickString, num === 6 && {height: 4}]} />
          </View>
        ))}
      </View>

      {/* Indicador Visual Dinámico */}
      {targetNumber && (
        <View style={[styles.targetDot, { left: dotLeft, bottom: dotBottom }]}>
          <Text style={styles.targetNumber}>{targetNumber}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mastilContainer: { width: '100%', height: 220, backgroundColor: '#4A2E1B', borderRadius: 10, borderWidth: 3, borderColor: '#2A180E', overflow: 'hidden', position: 'relative', marginBottom: 20 },
  fretsOverlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', justifyContent: 'space-evenly', opacity: 0.8 },
  fretLine: { width: 5, height: '100%', backgroundColor: '#C0C0C0', shadowColor: '#000', shadowOffset: { width: -3, height: 0 }, shadowOpacity: 0.6, shadowRadius: 3 },
  stringsContainer: { flex: 1, justifyContent: 'space-evenly', paddingVertical: 10 },
  stringWrapper: { flexDirection: 'row', alignItems: 'center', zIndex: 2 },
  stringNumber: { color: '#a3fba3', width: 20, fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginRight: 5 },
  stringLine: { flex: 1, height: 2, backgroundColor: '#E8E8E8', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.8, shadowRadius: 2 },
  thickString: { height: 3, backgroundColor: '#D3D3D3' },
  targetDot: { position: 'absolute', width: 38, height: 38, borderRadius: 19, backgroundColor: '#32CD32', borderWidth: 2, borderColor: '#fff', justifyContent: 'center', alignItems: 'center', zIndex: 10, shadowColor: '#32CD32', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 8 },
  targetNumber: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
});