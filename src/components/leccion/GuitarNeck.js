// Archivo: src/components/leccion/GuitarNeck.js
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';

// El alto del mástil se adapta a la pantalla (en un celular horizontal no entran 220px + botones)
const ALTO_MAXIMO = 220;
const ALTO_MINIMO = 130;
const PADDING_CUERDAS = 10;
const CANT_TRASTES = 6;
const TAMANO_PUNTO = 38;

// Calcula dónde dibujar el punto a partir de la cuerda (1 a 6) y el traste (0 = al aire).
// Las cuerdas y trastes se reparten con "space-evenly", así que replicamos esa cuenta.
function calcularPosicion(cuerda, traste, altoMastil) {
  const c = Math.min(Math.max(Number(cuerda) || 1, 1), 6);
  const t = Math.min(Math.max(Number(traste) || 0, 0), CANT_TRASTES);

  const left = t === 0 ? '3%' : `${(((t - 0.5) / (CANT_TRASTES + 1)) * 100).toFixed(1)}%`;
  const altoUtil = altoMastil - PADDING_CUERDAS * 2;
  const top = PADDING_CUERDAS + (altoUtil * c) / 7 - TAMANO_PUNTO / 2;
  return { left, top };
}

export function GuitarNeck({ targetNumber, cuerda, dotLeft, dotBottom }) {
  const { height } = useWindowDimensions();
  const altoMastil = Math.round(Math.min(ALTO_MAXIMO, Math.max(ALTO_MINIMO, height * 0.42)));
  const hayObjetivo = targetNumber !== null && targetNumber !== undefined && targetNumber !== '';

  // Si la lección trae posiciones manuales (dot_left / dot_bottom) las respetamos
  const posicion = dotLeft && dotBottom
    ? { left: dotLeft, bottom: dotBottom }
    : calcularPosicion(cuerda, targetNumber, altoMastil);

  return (
    <View style={[styles.mastilContainer, { height: altoMastil }]}>

      {/* Trastes (Verticales) */}
      <View style={styles.fretsOverlay}>
        {[...Array(CANT_TRASTES)].map((_, i) => <View key={i} style={styles.fretLine} />)}
      </View>

      {/* Cuerdas (Horizontales) */}
      <View style={styles.stringsContainer}>
        {[1, 2, 3, 4, 5, 6].map(num => (
          <View key={num} style={styles.stringWrapper}>
            <Text style={[styles.stringNumber, Number(cuerda) === num && styles.stringNumberActiva]}>{num}</Text>
            <View style={[styles.stringLine, num > 3 && styles.thickString, num === 6 && { height: 4 }]} />
          </View>
        ))}
      </View>

      {/* Indicador Visual Dinámico */}
      {hayObjetivo && (
        <View style={[styles.targetDot, posicion]}>
          <Text style={styles.targetNumber}>{String(targetNumber)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mastilContainer: { width: '100%', backgroundColor: '#4A2E1B', borderRadius: 10, borderWidth: 3, borderColor: '#2A180E', overflow: 'hidden', position: 'relative', marginBottom: 8 },
  fretsOverlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', justifyContent: 'space-evenly', opacity: 0.8 },
  fretLine: { width: 5, height: '100%', backgroundColor: '#C0C0C0', shadowColor: '#000', shadowOffset: { width: -3, height: 0 }, shadowOpacity: 0.6, shadowRadius: 3 },
  stringsContainer: { flex: 1, justifyContent: 'space-evenly', paddingVertical: PADDING_CUERDAS },
  stringWrapper: { flexDirection: 'row', alignItems: 'center', zIndex: 2 },
  stringNumber: { color: '#a3fba3', width: 20, fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginRight: 5 },
  stringNumberActiva: { color: '#fff', backgroundColor: '#32CD32', borderRadius: 10, overflow: 'hidden' },
  stringLine: { flex: 1, height: 2, backgroundColor: '#E8E8E8', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.8, shadowRadius: 2 },
  thickString: { height: 3, backgroundColor: '#D3D3D3' },
  targetDot: { position: 'absolute', width: TAMANO_PUNTO, height: TAMANO_PUNTO, borderRadius: TAMANO_PUNTO / 2, backgroundColor: '#32CD32', borderWidth: 2, borderColor: '#fff', justifyContent: 'center', alignItems: 'center', zIndex: 10, shadowColor: '#32CD32', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 8 },
  targetNumber: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
});
