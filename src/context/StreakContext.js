// Archivo: src/context/StreakContext.js
// Contexto global para poder disparar la animación de racha (StreakPopup)
// desde cualquier pantalla de la app, no solo desde LeccionScreen.
import React, { createContext, useState, useCallback } from 'react';
import { StreakPopup } from '../components/StreakPopup';

export const StreakContext = createContext();

export const StreakProvider = ({ children }) => {
  const [streakState, setStreakState] = useState({
    visible: false,
    rachaAnterior: 0,
    rachaActual: 0,
  });

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
      {children}
      <StreakPopup
        visible={streakState.visible}
        rachaAnterior={streakState.rachaAnterior}
        rachaActual={streakState.rachaActual}
        onAnimationFinished={hideStreak}
      />
    </StreakContext.Provider>
  );
};