// Archivo: src/components/StreakPopup.js
// Popup pequeño, arriba a la derecha, que anima el cambio de racha (ej: 5 -> 6).
// Este componente NO sabe nada del backend ni del perfil: solo recibe los
// números y dibuja/anima. Toda la decisión de "cuándo mostrarse" viene de afuera.
//
// Las imágenes de la llama viven en la carpeta assets/ de la RAÍZ del proyecto
// (no en src/assets), por eso subimos dos niveles: src/components -> src -> raíz.
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Animated, Easing } from 'react-native';

const flameOff = require('../../assets/flame_off.png');
const flameOn = require('../../assets/flame_on.png');

const TIEMPO_VISIBLE_MS = 1800; // cuánto se queda el popup antes de cerrarse solo

export function StreakPopup({ visible, rachaAnterior, rachaActual, onAnimationFinished }) {
  const [numeroVisible, setNumeroVisible] = useState(rachaAnterior);
  const [llamaPrendida, setLlamaPrendida] = useState(false);

  // Popup: entrada/salida
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-25)).current;

  // Llama: pequeño "golpe" de escala al prenderse
  const flameScale = useRef(new Animated.Value(0.85)).current;

  // Número: se va el anterior, entra el nuevo
  const numberTranslate = useRef(new Animated.Value(0)).current;
  const numberOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;

    // Reset de estados iniciales cada vez que se dispara la animación
    setNumeroVisible(rachaAnterior);
    setLlamaPrendida(false);
    opacity.setValue(0);
    translateY.setValue(-25);
    flameScale.setValue(0.85);
    numberTranslate.setValue(0);
    numberOpacity.setValue(1);

    const timers = [];

    // 1. Entrada del popup
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Se prende la llama (cambia la imagen + pequeño rebote de escala)
      setLlamaPrendida(true);
      Animated.sequence([
        Animated.timing(flameScale, {
          toValue: 1.18,
          duration: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(flameScale, {
          toValue: 1,
          duration: 150,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      // 3. Cambio de número: sale el anterior, entra el actual
      Animated.parallel([
        Animated.timing(numberTranslate, {
          toValue: -15,
          duration: 160,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(numberOpacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setNumeroVisible(rachaActual);
        numberTranslate.setValue(15);
        Animated.parallel([
          Animated.timing(numberTranslate, {
            toValue: 0,
            duration: 180,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(numberOpacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start();
      });

      // 4. Después de un rato, se cierra solo
      const cierre = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -10,
            duration: 200,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start(() => {
          onAnimationFinished && onAnimationFinished();
        });
      }, TIEMPO_VISIBLE_MS);
      timers.push(cierre);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, rachaAnterior, rachaActual]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Animated.Image
        source={llamaPrendida ? flameOn : flameOff}
        style={[styles.flame, { transform: [{ scale: flameScale }] }]}
        resizeMode="contain"
      />
      <Animated.Text
        style={[
          styles.numero,
          {
            opacity: numberOpacity,
            transform: [{ translateY: numberTranslate }],
          },
        ]}
      >
        {numeroVisible}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 15,
    height: 50,
    minWidth: 70,
    paddingHorizontal: 14,
    borderRadius: 25,
    backgroundColor: 'rgba(30, 30, 34, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 10,
  },
  flame: {
    width: 26,
    height: 26,
    marginRight: 8,
  },
  numero: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});