// Archivo: src/hooks/useDropdown.js
import { useState, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export function useDropdown() {
  const [isOpen, setIsOpen] = useState(false);      // 1. ¿está abierto o cerrado?
  const anim = useRef(new Animated.Value(0)).current; // 2. valor animado de 0 a 1

  const toggle = () => {
    Animated.timing(anim, {                          // anima el valor hacia 0 o 1
      toValue: isOpen ? 0 : 1,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,                         // false porque animamos "height", que no soporta el driver nativo
    }).start();
    setIsOpen(!isOpen);
  };

  const close = (callback) => {                       // como toggle, pero siempre cierra, y avisa cuando terminó
    Animated.timing(anim, { toValue: 0, duration: 180, easing: Easing.in(Easing.ease), useNativeDriver: false })
      .start(() => {
        setIsOpen(false);
        if (callback) callback();
      });
  };

  return { isOpen, anim, toggle, close };
}