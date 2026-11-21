// Archivo: src/hooks/useDropdown.js
import { useState, useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

// Función de cierre del dropdown que está abierto en este momento (solo hay uno a la vez)
let cerrarAbierto = null;

export function useDropdown() {
  const [isOpen, setIsOpen] = useState(false);      // 1. ¿está abierto o cerrado?
  const anim = useRef(new Animated.Value(0)).current; // 2. valor animado de 0 a 1
  const cerrarRef = useRef(null);

  const close = (callback) => {                       // como toggle, pero siempre cierra, y avisa cuando terminó
    if (cerrarAbierto === cerrarRef.current) cerrarAbierto = null;
    Animated.timing(anim, { toValue: 0, duration: 180, easing: Easing.in(Easing.ease), useNativeDriver: false })
      .start(() => {
        setIsOpen(false);
        if (callback) callback();
      });
  };

  cerrarRef.current = () => close();

  const toggle = () => {
    if (isOpen) {
      close();
      return;
    }
    // Si había otro dropdown abierto, lo cerramos
    if (cerrarAbierto) cerrarAbierto();
    cerrarAbierto = cerrarRef.current;
    Animated.timing(anim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,                         // false porque animamos "height", que no soporta el driver nativo
    }).start();
    setIsOpen(true);
  };

  // Al desmontar, no dejar una referencia colgada
  useEffect(() => () => {
    if (cerrarAbierto === cerrarRef.current) cerrarAbierto = null;
  }, []);

  return { isOpen, anim, toggle, close };
}
