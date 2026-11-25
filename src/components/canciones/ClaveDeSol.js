// Archivo: src/components/canciones/ClaveDeSol.js
// Una clave de sol dibujada con trazos: es el lugar de la portada mientras la canción no tiene una.
import Svg, { Path } from 'react-native-svg';

const PROPORCION = 2; // Alto / ancho del dibujo (viewBox 30 x 60)

export function ClaveDeSol({ alto = 48, color = '#fff' }) {
  const trazo = { fill: 'none', stroke: color, strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <Svg width={alto / PROPORCION} height={alto} viewBox="0 0 30 60" accessibilityElementsHidden importantForAccessibility="no">
      {/* El cuerpo: del bucle de abajo, sube por el eje, hace el rulo de arriba y el espiral del medio */}
      <Path
        d="M14.2 46 C14.6 38 14.8 24 14.9 12 C15 6 17.5 2.5 19.5 3 C21.5 3.5 21 9 17.8 14 C14 20 6.5 24 6.5 32 C6.5 38.5 11 42 16.5 41 C21.5 40 23.5 34.5 20.5 31 C17.5 27.5 11 28.5 10.5 33.5 C10.2 36.5 12.5 38 14.8 37"
        {...trazo}
      />
      {/* La colita de abajo */}
      <Path d="M14.2 46 C14 51 11.5 54 8.8 53.2 C6.8 52.6 6.8 49.5 9.2 49.3 C11 49.2 11.8 51 11 52.5" {...trazo} />
    </Svg>
  );
}
