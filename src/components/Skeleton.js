// Archivo: src/components/Skeleton.js
// Bloques grises que laten mientras llegan los datos: la pantalla se ve armada al instante
// en vez de quedar tapada por una pantalla de carga.
import { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';

export function Skeleton({ style }) {
  const opacidad = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidad, { toValue: 0.7, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacidad, { toValue: 0.35, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    animacion.start();
    return () => animacion.stop();
  }, [opacidad]);

  return <Animated.View style={[styles.bloque, style, { opacity: opacidad }]} />;
}

// Una columna de filas (rankings, grupos, canciones...)
export function ListaSkeleton({ cantidad = 5, alto = 64, style }) {
  return (
    <View style={style} accessibilityLabel="Cargando">
      {Array.from({ length: cantidad }, (_, i) => (
        <Skeleton key={i} style={{ height: alto, marginBottom: 10 }} />
      ))}
    </View>
  );
}

// Una fila de tarjetas (lista de cursos del Home)
export function TarjetasSkeleton({ cantidad = 3, ancho = 200, alto = 190 }) {
  return (
    <View style={styles.fila} accessibilityLabel="Cargando">
      {Array.from({ length: cantidad }, (_, i) => (
        <Skeleton key={i} style={{ width: ancho, height: alto, borderRadius: 20 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bloque: { backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 14 },
  fila: { flexDirection: 'row', gap: 14, paddingVertical: 10 },
});
