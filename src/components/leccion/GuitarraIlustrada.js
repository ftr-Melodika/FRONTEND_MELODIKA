// Archivo: src/components/leccion/GuitarraIlustrada.js
// Imágenes del quiz, dibujadas en SVG: se ven nítidas en cualquier pantalla y las coordenadas de
// cada parte son exactas. Las lecciones las piden por clave en practica.imagen (o en cada pregunta).
// Los marcadores usan coordenadas de 0 a 1 sobre la imagen (x a lo ancho, y a lo alto).
import { Image, View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

const ANCHO = 1000;
const ALTO = 400;
const CENTRO = ALTO / 2;

// Escala real: de la cejuela (x 125) al puente (x 846). Cada traste a la distancia de una guitarra real.
const CEJUELA = 125;
const ESCALA = 721;
const FIN_DIAPASON = 555;
const posicionTraste = (n) => CEJUELA + ESCALA * (1 - 2 ** (-n / 12));
const TRASTES = Array.from({ length: 15 }, (_, i) => posicionTraste(i + 1)).filter((x) => x < FIN_DIAPASON);
const MARCAS = [3, 5, 7, 9].map((n) => (posicionTraste(n - 1) + posicionTraste(n)) / 2);
const MARCA_12 = (posicionTraste(11) + posicionTraste(12)) / 2;
const CUERDAS = [0, 1, 2, 3, 4, 5].map((i) => CENTRO - 16 + i * 6.4);

// Contorno de una guitarra criolla/acústica acostada: mástil a la izquierda, caja a la derecha
const CAJA = `M 480 200
  C 480 120, 520 92, 590 92
  C 650 92, 665 118, 690 122
  C 720 126, 740 52, 835 52
  C 930 52, 980 120, 980 200
  C 980 280, 930 348, 835 348
  C 740 348, 720 274, 690 278
  C 665 282, 650 308, 590 308
  C 520 308, 480 280, 480 200 Z`;

function GuitarraAcustica() {
  return (
    <>
      <Defs>
        <LinearGradient id="tapa" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f0c67e" />
          <Stop offset="0.5" stopColor="#e2a85a" />
          <Stop offset="1" stopColor="#c98a3c" />
        </LinearGradient>
        <LinearGradient id="madera" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2a1910" />
          <Stop offset="0.5" stopColor="#4b2e1d" />
          <Stop offset="1" stopColor="#2a1910" />
        </LinearGradient>
        <RadialGradient id="boca" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor="#0d0805" />
          <Stop offset="1" stopColor="#2b1a10" />
        </RadialGradient>
      </Defs>

      {/* Caja de resonancia */}
      <Path d={CAJA} fill="url(#tapa)" stroke="#6b4321" strokeWidth={5} />
      {/* Boca con su roseta */}
      <Circle cx={610} cy={CENTRO} r={58} fill="none" stroke="#6b4321" strokeWidth={4} />
      <Circle cx={610} cy={CENTRO} r={52} fill="none" stroke="#3a2416" strokeWidth={3} strokeDasharray="6 4" />
      <Circle cx={610} cy={CENTRO} r={46} fill="url(#boca)" />
      {/* Puente con su selleta */}
      <Rect x={832} y={128} width={40} height={144} rx={8} fill="#3a2416" />
      <Rect x={844} y={140} width={5} height={120} rx={2} fill="#f3ead7" />

      {/* Clavijero con sus clavijas */}
      <Path d="M 122 172 L 30 158 Q 14 200 30 242 L 122 228 Z" fill="#3a2416" stroke="#1c110a" strokeWidth={3} />
      {[45, 72, 99].map((x) => (
        <G key={x}>
          <Rect x={x - 5} y={128} width={10} height={30} rx={3} fill="#c9cdd2" />
          <Circle cx={x} cy={124} r={11} fill="#e8e8e8" stroke="#7d8288" strokeWidth={2} />
          <Rect x={x - 5} y={242} width={10} height={30} rx={3} fill="#c9cdd2" />
          <Circle cx={x} cy={276} r={11} fill="#e8e8e8" stroke="#7d8288" strokeWidth={2} />
        </G>
      ))}

      {/* Mástil (diapasón) con sus trastes y marcas */}
      <Rect x={CEJUELA} y={CENTRO - 22} width={FIN_DIAPASON - CEJUELA} height={44} fill="url(#madera)" />
      {TRASTES.map((x) => (
        <Rect key={x} x={x - 1.5} y={CENTRO - 22} width={3} height={44} fill="#d7dbe0" />
      ))}
      {MARCAS.map((x) => <Circle key={x} cx={x} cy={CENTRO} r={4} fill="#eee8dc" />)}
      <Circle cx={MARCA_12} cy={CENTRO - 10} r={4} fill="#eee8dc" />
      <Circle cx={MARCA_12} cy={CENTRO + 10} r={4} fill="#eee8dc" />
      {/* Cejuela */}
      <Rect x={CEJUELA - 7} y={CENTRO - 24} width={7} height={48} rx={1.5} fill="#f3ead7" />

      {/* Cuerdas: del puente a la cejuela, y de ahí a cada clavija */}
      {CUERDAS.map((y, i) => (
        <G key={y}>
          <Line x1={CEJUELA} y1={y} x2={846} y2={y} stroke={i < 3 ? '#d9b26f' : '#e6e6e6'} strokeWidth={i < 3 ? 1.8 - i * 0.2 : 1.2} />
          <Line x1={CEJUELA - 7} y1={y} x2={[45, 72, 99][i % 3]} y2={i < 3 ? 158 : 242} stroke="#bfbfbf" strokeWidth={1} />
        </G>
      ))}
    </>
  );
}

export const IMAGENES = {
  'guitarra-acustica': GuitarraAcustica,
};

// Recuadro (con ancho y alto) o anillo (solo x e y) que señala la parte por la que se pregunta
function Marcador({ marcador, color }) {
  const x = marcador.x * ANCHO;
  const y = marcador.y * ALTO;
  if (marcador.ancho && marcador.alto) {
    const w = marcador.ancho * ANCHO;
    const h = marcador.alto * ALTO;
    return (
      <G>
        <Rect x={x - w / 2 - 4} y={y - h / 2 - 4} width={w + 8} height={h + 8} rx={14} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={10} />
        <Rect x={x - w / 2 - 4} y={y - h / 2 - 4} width={w + 8} height={h + 8} rx={14} fill={color} fillOpacity={0.12} stroke={color} strokeWidth={6} />
      </G>
    );
  }
  return (
    <G>
      <Circle cx={x} cy={y} r={26} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={10} />
      <Circle cx={x} cy={y} r={26} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={6} />
    </G>
  );
}

const esFoto = (imagen) => typeof imagen === 'string' && /^https?:\/\//.test(imagen);

// Ancho / alto de lo que se va a ver: el dibujo entero, un recorte, o una foto (se muestra apaisada)
export function proporcionImagen({ imagen, recorte } = {}) {
  if (esFoto(imagen)) return 4 / 3;
  return recorte ? (recorte.ancho * ANCHO) / (recorte.alto * ALTO) : ANCHO / ALTO;
}

// Dibuja la imagen pedida (o nada si la clave no existe) con el marcador encima.
// `imagen` es una clave de IMAGENES o la URL de una foto. `recorte` ({ x, y, ancho, alto } de 0 a 1,
// con x e y en el centro) muestra solo esa parte del dibujo, como si se acercara la cámara.
export function GuitarraIlustrada({ imagen = 'guitarra-acustica', marcador, recorte, colorMarcador = '#ffd35c', style }) {
  const proporcion = { aspectRatio: proporcionImagen({ imagen, recorte }) };

  if (esFoto(imagen)) {
    return (
      <View style={[styles.contenedor, proporcion, style]} accessibilityRole="image" accessibilityLabel="Foto de una parte de la guitarra">
        <Image source={{ uri: imagen }} style={styles.foto} resizeMode="contain" />
      </View>
    );
  }

  const Dibujo = IMAGENES[imagen];
  if (!Dibujo) return null;
  const caja = recorte
    ? [(recorte.x - recorte.ancho / 2) * ANCHO, (recorte.y - recorte.alto / 2) * ALTO, recorte.ancho * ANCHO, recorte.alto * ALTO]
    : [0, 0, ANCHO, ALTO];
  const descripcion = recorte ? 'Acercamiento a una parte de la guitarra' : 'Dibujo de una guitarra con una parte marcada';
  return (
    <View style={[styles.contenedor, proporcion, style]} accessibilityRole="image" accessibilityLabel={descripcion}>
      <Svg width="100%" height="100%" viewBox={caja.join(' ')}>
        <Dibujo />
        {marcador && <Marcador marcador={marcador} color={colorMarcador} />}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { width: '100%', overflow: 'hidden' },
  foto: { width: '100%', height: '100%', borderRadius: 12 },
});
