// Archivo: src/hooks/useDropdown.js
import { useState, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export function useDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.timing(anim, {
      toValue: isOpen ? 0 : 1,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
    setIsOpen(!isOpen);
  };

  const close = (callback) => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      setIsOpen(false);
      if (callback) callback(); 
    });
  };

  return { isOpen, anim, toggle, close };
}