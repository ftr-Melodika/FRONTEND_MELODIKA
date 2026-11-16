// Archivo: src/components/Pulsable.js
// Botón táctil que se hunde un poco al apretarlo y vuelve con un rebote suave.
import { useRef } from 'react';
import { Animated, Pressable } from 'react-native';

export function Pulsable({ children, style, escala = 0.96, ...rest }) {
  const valor = useRef(new Animated.Value(1)).current;
  const ir = (a) => Animated.spring(valor, { toValue: a, useNativeDriver: true, speed: 40, bounciness: a === 1 ? 10 : 0 }).start();
  return (
    <Pressable onPressIn={() => ir(escala)} onPressOut={() => ir(1)} {...rest}>
      <Animated.View style={[style, { transform: [{ scale: valor }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
