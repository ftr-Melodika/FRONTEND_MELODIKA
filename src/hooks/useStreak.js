// Archivo: src/hooks/useStreak.js
import { useContext } from 'react';
import { StreakContext } from '../context/StreakContext';

export function useStreak() {
  return useContext(StreakContext);
}