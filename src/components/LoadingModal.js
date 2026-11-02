// Archivo: src/components/LoadingModal.js
// Pantalla de carga a pantalla completa: tapa todo el contenido (que se dibuja recién cuando termina)
// y muestra un "ecualizador" animado en el centro. Al terminar se desvanece suavemente.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { Background } from './Background';

const CANT_BARRAS = 5;
const ALTO_BARRA = 44;

function Barra({ delay }) {
  const escala = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(escala, { toValue: 1, duration: 380, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(escala, { toValue: 0.3, duration: 380, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    animacion.start();
    return () => animacion.stop();
  }, [delay, escala]);

  return <Animated.View style={[styles.barra, { transform: [{ scaleY: escala }] }]} />;
}

export function LoadingModal({ visible, text = 'Cargando...' }) {
  const [montado, setMontado] = useState(visible);
  const opacidad = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setMontado(true);
      Animated.timing(opacidad, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    } else {
      Animated.timing(opacidad, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setMontado(false));
    }
  }, [visible, opacidad]);

  if (!montado) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: opacidad }]} pointerEvents={visible ? 'auto' : 'none'}>
      <Background>
        <View style={styles.barras}>
          {[...Array(CANT_BARRAS)].map((_, i) => (
            <Barra key={i} delay={i * 110} />
          ))}
        </View>
        {!!text && <Text style={styles.texto}>{text}</Text>}
      </Background>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 50,
  },
  barras: { flexDirection: 'row', alignItems: 'center', height: ALTO_BARRA, gap: 7 },
  barra: { width: 8, height: ALTO_BARRA, borderRadius: 4, backgroundColor: '#b28cff' },
  texto: { color: '#fff', marginTop: 18, fontSize: 16, fontWeight: '600', letterSpacing: 0.5, fontFamily: 'serif' },
});
