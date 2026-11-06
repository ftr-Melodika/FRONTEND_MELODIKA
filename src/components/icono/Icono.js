// Archivo: src/components/icono/Icono.js
// Ícono propio de Melodika. Uso: <Icono nombre="llama" tamano={18} acento={COLORES_ICONO.llama} />
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { ICONOS, COLORES_ICONO } from './trazos';

// Cuánto se corre la mancha de color respecto del contorno (en la grilla de 24)
const DESPLAZAMIENTO = 1.1;

export function Icono({ nombre, tamano = 20, color = '#fff', acento = COLORES_ICONO.violeta, style }) {
  const formas = ICONOS[nombre];
  if (!formas) return null;

  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" style={style} accessibilityElementsHidden importantForAccessibility="no">
      <G transform={`translate(${DESPLAZAMIENTO} ${DESPLAZAMIENTO})`}>
        {formas.filter((f) => f.t === 'A' || f.t === 'LA').map((f, i) => (
          <Path key={i} d={f.d} fill={acento} opacity={0.85} />
        ))}
      </G>
      {formas.filter((f) => f.t === 'L' || f.t === 'LA').map((f, i) => (
        <Path key={i} d={f.d} fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {formas.filter((f) => f.t === 'S').map((f, i) => (
        <Path key={i} d={f.d} fill={color} />
      ))}
    </Svg>
  );
}

// Un ícono seguido de texto, alineados al centro de la línea
export function TextoConIcono({ nombre, tamano = 16, color, acento, centrado, contenedorStyle, style, numberOfLines, children }) {
  return (
    <View style={[styles.fila, centrado && styles.centrado, contenedorStyle]}>
      <Icono nombre={nombre} tamano={tamano} color={color} acento={acento} />
      <Text style={[styles.texto, style]} numberOfLines={numberOfLines}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  centrado: { justifyContent: 'center' },
  texto: { flexShrink: 1 },
});

export { COLORES_ICONO };
