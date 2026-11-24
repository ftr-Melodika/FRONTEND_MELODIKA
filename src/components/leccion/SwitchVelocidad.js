// Archivo: src/components/leccion/SwitchVelocidad.js
// Interruptor de velocidad del riff: dos posiciones, la lenta (ej. x0.5) a la izquierda y la original (x1)
// a la derecha. Un toque cambia de una a la otra. `opciones` son las dos velocidades, de lenta a original
// (ver opcionesConEscalon en utils/riff.js).
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ANCHO = 132;
const ALTO = 34;
const MARGEN = 3;
const MS_DESLIZAR = 160;

export function SwitchVelocidad({ opciones, valor, onCambiar }) {
  const [lenta, original] = opciones;
  const enOriginal = valor === original.valor;
  const posicion = useRef(new Animated.Value(enOriginal ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(posicion, { toValue: enOriginal ? 1 : 0, duration: MS_DESLIZAR, useNativeDriver: true }).start();
  }, [enOriginal]);

  return (
    <TouchableOpacity
      style={styles.pista}
      onPress={() => onCambiar(enOriginal ? lenta.valor : original.valor)}
      activeOpacity={0.85}
      accessibilityRole="switch"
      accessibilityLabel="Velocidad lenta"
      accessibilityState={{ checked: !enOriginal }}
      accessibilityHint={`Cambia entre ${lenta.titulo} y ${original.titulo}`}
    >
      <Animated.View style={[styles.perilla, { transform: [{ translateX: posicion.interpolate({ inputRange: [0, 1], outputRange: [0, ANCHO / 2] }) }] }]} />
      <View style={styles.etiquetas} pointerEvents="none">
        <Text style={[styles.etiqueta, !enOriginal && styles.etiquetaActiva]}>{lenta.titulo}</Text>
        <Text style={[styles.etiqueta, enOriginal && styles.etiquetaActiva]}>{original.titulo}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pista: { width: ANCHO, height: ALTO, borderRadius: ALTO / 2, backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', justifyContent: 'center' },
  perilla: { position: 'absolute', top: MARGEN - 1, left: MARGEN - 1, width: ANCHO / 2 - MARGEN, height: ALTO - 2 * MARGEN, borderRadius: (ALTO - 2 * MARGEN) / 2, backgroundColor: '#4c52d9' },
  etiquetas: { flexDirection: 'row' },
  etiqueta: { flex: 1, textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 'bold' },
  etiquetaActiva: { color: '#fff' },
});
