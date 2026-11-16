// Archivo: src/context/StreakContext.js
// Contexto global para poder disparar la animación de racha (StreakPopup)
// desde cualquier pantalla de la app, no solo desde LeccionScreen.
import React, { createContext, useState, useCallback, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { StreakPopup } from '../components/StreakPopup';

export const StreakContext = createContext();

export const StreakProvider = ({ children }) => {
  const [streakState, setStreakState] = useState({
    visible: false,
    rachaAnterior: 0,
    rachaActual: 0,
  });

  // En Android el desenfoque solo funciona sobre lo que está dentro de un BlurTargetView:
  // envuelve toda la app para que la animación de racha la pueda desenfocar de fondo.
  const objetivoBlur = useRef(null);

  const showStreak = useCallback((rachaAnterior, rachaActual) => {
    setStreakState({
      visible: true,
      rachaAnterior,
      rachaActual,
    });
  }, []);

  const hideStreak = useCallback(() => {
    setStreakState({
      visible: false,
      rachaAnterior: 0,
      rachaActual: 0,
    });
  }, []);

  return (
    <StreakContext.Provider value={{ showStreak, hideStreak }}>
      <BlurTargetView ref={objetivoBlur} style={styles.app}>
        {children}
      </BlurTargetView>
      <StreakPopup
        visible={streakState.visible}
        rachaAnterior={streakState.rachaAnterior}
        rachaActual={streakState.rachaActual}
        onAnimationFinished={hideStreak}
        blurTarget={objetivoBlur}
      />
    </StreakContext.Provider>
  );
};

const styles = StyleSheet.create({
  app: {
    flex: 1,
  },
});
