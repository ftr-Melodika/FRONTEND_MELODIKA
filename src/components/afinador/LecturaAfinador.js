// Archivo: src/components/afinador/LecturaAfinador.js
// Lo que muestra un afinador: la nota, un medidor con la aguja y hacia dónde girar la clavija.
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { CENTS_AFINADA_POR_DEFECTO } from '../../utils/actividades';

const CENTS_ESCALA = 50; // El medidor llega hasta medio tono para cada lado
export const COLOR_AFINADA = '#32CD32';
const COLOR_DESAFINADA = '#ff9a4d';

const MENSAJES = {
  afinada: '¡Afinada!',
  baja: 'Está baja: apretá la clavija',
  alta: 'Está alta: aflojá la clavija',
};

function Medidor({ cents, color, toleranciaCents }) {
  const posicion = useRef(new Animated.Value(0)).current;
  const objetivo = Math.max(-CENTS_ESCALA, Math.min(CENTS_ESCALA, cents ?? 0));

  useEffect(() => {
    Animated.timing(posicion, { toValue: objetivo, duration: 120, useNativeDriver: false }).start();
  }, [objetivo, posicion]);

  const left = posicion.interpolate({ inputRange: [-CENTS_ESCALA, CENTS_ESCALA], outputRange: ['0%', '100%'] });
  const anchoZona = `${(toleranciaCents * 2 * 100) / (CENTS_ESCALA * 2)}%`;

  return (
    <View style={styles.medidor} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.barra}>
        <View style={[styles.zonaAfinada, { width: anchoZona }]} />
        <Animated.View style={[styles.aguja, { left, backgroundColor: color }]} />
      </View>
      <View style={styles.escala}>
        <Text style={styles.escalaTexto}>Baja</Text>
        <Text style={styles.escalaTexto}>Alta</Text>
      </View>
    </View>
  );
}

// `compacta` achica la nota para que entre en una lección
export function LecturaAfinador({ resultado, frecuencia, toleranciaCents = CENTS_AFINADA_POR_DEFECTO, compacta = false }) {
  const color = !resultado ? 'rgba(255,255,255,0.5)' : resultado.estado === 'afinada' ? COLOR_AFINADA : COLOR_DESAFINADA;

  return (
    <>
      <Text style={[styles.nota, compacta && styles.notaCompacta, resultado && { color }]} numberOfLines={1}>{resultado ? resultado.nota : '—'}</Text>
      <Text style={styles.cuerda}>{resultado ? `Cuerda ${resultado.cuerda}` : ' '}</Text>
      <Medidor cents={resultado?.cents} color={color} toleranciaCents={toleranciaCents} />
      <Text style={[styles.mensaje, resultado && { color }]} accessibilityLiveRegion="polite">
        {resultado ? MENSAJES[resultado.estado] : 'Tocá una cuerda al aire'}
      </Text>
      <Text style={styles.detalle}>
        {resultado ? `${frecuencia.toFixed(1)} Hz  •  ${resultado.cents > 0 ? '+' : ''}${resultado.cents} cents` : ' '}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  nota: { color: 'rgba(255,255,255,0.5)', fontSize: 52, lineHeight: 60, fontWeight: 'bold' },
  notaCompacta: { fontSize: 38, lineHeight: 44 },
  cuerda: { color: '#fff', fontSize: 14, marginBottom: 8 },
  medidor: { width: '100%', maxWidth: 480 },
  barra: { height: 28, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  zonaAfinada: { height: '100%', backgroundColor: 'rgba(50,205,50,0.45)' },
  aguja: { position: 'absolute', top: 0, bottom: 0, width: 4, marginLeft: -2, borderRadius: 2 },
  escala: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  escalaTexto: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  mensaje: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 6, textAlign: 'center' },
  detalle: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
});
