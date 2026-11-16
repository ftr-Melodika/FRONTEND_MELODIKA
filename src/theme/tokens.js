// Archivo: src/theme/tokens.js
// Paleta de Melodika (la misma de siempre) con nombres, y las tipografías nuevas.
// Los valores salen de los colores que ya usaba la app: indigo #4c52d9, violeta #b28cff,
// menta #a3fba3, oro #ffd35c y rosa #ffb3bd. "profundo" y "tinta" son tonos más oscuros del indigo.
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export const COLORES = {
  indigo: '#4c52d9',
  profundo: '#2b2a86',
  tinta: '#1f1b5c',
  violeta: '#b28cff',
  violetaClaro: '#e4d8ff',
  menta: '#a3fba3',
  oro: '#ffd35c',
  rosa: '#ffb3bd',
  blanco: '#ffffff',
  // Superficies sobre el fondo indigo: opacas, para que el texto siempre tenga contraste
  superficie: '#3a3ec0',
  superficieAlta: '#4a4fd0',
  linea: 'rgba(255,255,255,0.14)',
  textoSuave: 'rgba(255,255,255,0.78)',
};

// Nombres de las fuentes cargadas en App.js (Fraunces para títulos, Figtree para el resto)
export const FUENTES = {
  display: 'Fraunces_700Bold',
  displaySuave: 'Fraunces_600SemiBold',
  displayCursiva: 'Fraunces_600SemiBold_Italic',
  cuerpo: 'Figtree_400Regular',
  cuerpoMedio: 'Figtree_500Medium',
  cuerpoNegrita: 'Figtree_700Bold',
};

// Si el sistema pidió menos movimiento, las animaciones decorativas se saltean
export function useReducirMovimiento() {
  const [reducir, setReducir] = useState(false);
  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => vivo && setReducir(v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducir);
    return () => { vivo = false; sub.remove(); };
  }, []);
  return reducir;
}
