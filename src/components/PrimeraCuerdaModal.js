// Archivo: src/components/PrimeraCuerdaModal.js
// Bienvenida al crear un perfil: "Tocá cualquier cuerda para comenzar". Cuando el micrófono oye
// una nota que se mantiene (una cuerda que suena, no un ruido suelto), aparece un tic, se tira
// confeti desde los costados y se cierra sola. Se puede saltear con "Ahora no".
// El audio se procesa en el celular: no se guarda ni se envía a ningún lado.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Button } from './Button';
import { useMicrofono } from '../hooks/useMicrofono';
import { crearDetector } from '../utils/deteccionSonido';
import { ruidoMedido } from '../utils/ruidoAmbiente';
import { FUENTE_TITULO } from '../theme/fuentes';

const MS_VISIBLE_DESPUES = 2500; // Desde el tic hasta que se cierra sola
const COLORES = ['#ffd35c', '#2fbf5b', '#4c52d9', '#ff6f91', '#5cd6ff', '#b28cff'];
const PAPELITOS_POR_LADO = 16;
const LARGO_TIC = 60; // Largo aproximado del trazo del tic (para dibujarlo de a poco)

const AnimatedPath = Animated.createAnimatedComponent(Path);

const MENSAJE_MICROFONO = {
  'sin-permiso': 'Necesitamos el micrófono para escucharte. Podés activarlo en los ajustes del celular y probar después.',
  'no-disponible': 'En este dispositivo no podemos usar el micrófono.',
  error: 'No pudimos abrir el micrófono.',
};

// Papelitos con recorridos al azar, armados una sola vez: salen desde un costado hacia el centro y caen
function armarPapelitos() {
  const lista = [];
  for (const lado of [-1, 1]) {
    for (let i = 0; i < PAPELITOS_POR_LADO; i++) {
      lista.push({
        lado,
        color: COLORES[(i + (lado > 0 ? 3 : 0)) % COLORES.length],
        alto: 0.15 + Math.random() * 0.6, // Desde qué altura de la pantalla sale (proporción)
        avance: 0.18 + Math.random() * 0.3, // Cuánto entra hacia el centro (proporción del ancho)
        subida: 0.12 + Math.random() * 0.25, // Cuánto sube antes de caer (proporción del alto)
        giro: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
        demora: Math.random() * 250,
        duracion: 1500 + Math.random() * 900,
        ancho: 7 + Math.random() * 6,
        redondo: Math.random() < 0.3,
      });
    }
  }
  return lista;
}

function Confeti({ activo }) {
  const { width, height } = useWindowDimensions();
  const papelitos = useMemo(armarPapelitos, []);
  const valores = useRef(papelitos.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!activo) return undefined;
    valores.forEach((v) => v.setValue(0));
    const animacion = Animated.parallel(papelitos.map((p, i) => Animated.timing(valores[i], {
      toValue: 1, duration: p.duracion, delay: p.demora, easing: Easing.linear, useNativeDriver: true,
    })));
    animacion.start();
    return () => animacion.stop();
  }, [activo]);

  if (!activo) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {papelitos.map((p, i) => {
        const v = valores[i];
        const xFinal = p.lado * -1 * p.avance * width; // Del borde hacia adentro
        const arriba = -p.subida * height;
        return (
          <Animated.View
            key={i}
            style={[
              styles.papelito,
              {
                width: p.ancho,
                height: p.redondo ? p.ancho : p.ancho * 1.6,
                borderRadius: p.redondo ? p.ancho / 2 : 2,
                backgroundColor: p.color,
                top: p.alto * height,
                [p.lado < 0 ? 'left' : 'right']: -10,
                opacity: v.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] }),
                transform: [
                  { translateX: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, xFinal * 0.8, xFinal] }) },
                  // Sube rápido y después cae como si pesara
                  { translateY: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, arriba, arriba + height * 0.7] }) },
                  { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.giro}deg`] }) },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

// Un círculo verde que aparece con rebote y el tic que se dibuja adentro
function Tic() {
  const escala = useRef(new Animated.Value(0)).current;
  const trazo = useRef(new Animated.Value(LARGO_TIC)).current;

  useEffect(() => {
    const animacion = Animated.sequence([
      Animated.spring(escala, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      // strokeDashoffset no admite el driver nativo
      Animated.timing(trazo, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]);
    animacion.start();
    return () => animacion.stop();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }} accessibilityLabel="¡Bien!">
      <Svg width={96} height={96} viewBox="0 0 96 96">
        <Circle cx={48} cy={48} r={44} fill="#2fbf5b" />
        <AnimatedPath
          d="M28 50 L42 64 L70 34"
          stroke="#fff"
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={LARGO_TIC}
          strokeDashoffset={trazo}
        />
      </Svg>
    </Animated.View>
  );
}

export function PrimeraCuerdaModal({ visible, onCerrar }) {
  const [sono, setSono] = useState(false);
  const detector = useRef(null);
  const yaSono = useRef(false);

  useEffect(() => {
    if (!visible) return;
    // El objetivo no importa: alcanza con que se oiga una nota que se mantiene
    detector.current = crearDetector({ tipo: 'nota', nombre: 'Mi', posiciones: [], midis: [40] }, { ruido: ruidoMedido() });
    yaSono.current = false;
    setSono(false);
  }, [visible]);

  const procesarBuffer = ({ data, sampleRate, channels }) => {
    if (!detector.current || yaSono.current) return;
    const lectura = detector.current.agregarBuffer(new Float32Array(data), channels || 1, sampleRate, Date.now());
    if (!lectura) return;
    if (lectura.hayNota) {
      yaSono.current = true;
      setSono(true);
    }
  };

  // El micrófono solo está abierto hasta que suena la primera cuerda
  const estado = useMicrofono(procesarBuffer, visible && !sono);

  useEffect(() => {
    if (!sono) return undefined;
    const espera = setTimeout(onCerrar, MS_VISIBLE_DESPUES);
    return () => clearTimeout(espera);
  }, [sono]);

  const sinMicrofono = MENSAJE_MICROFONO[estado];
  let ayuda;
  if (sono) ayuda = '¡Sonó! Ya estás listo para empezar.';
  else if (sinMicrofono) ayuda = sinMicrofono;
  else if (estado !== 'escuchando') ayuda = 'Preparando el micrófono…';
  else ayuda = 'Te estamos escuchando 🎸';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
      supportedOrientations={['landscape', 'landscape-left', 'landscape-right', 'portrait']}
    >
      <View style={styles.fondo}>
        <View style={styles.tarjeta}>
          <Text style={styles.titulo}>{sono ? '¡Muy bien!' : 'Tocá cualquier cuerda para comenzar'}</Text>
          <View style={styles.centro}>
            {sono ? <Tic /> : <Text style={styles.guitarra}>🎸</Text>}
          </View>
          <Text style={[styles.ayuda, sinMicrofono && !sono && styles.ayudaError]}>{ayuda}</Text>
          {!sono && <Button title="Ahora no" variant="secondary" onPress={onCerrar} style={styles.boton} />}
        </View>
        <Confeti activo={sono} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  tarjeta: { width: '100%', maxWidth: 460, padding: 20, borderRadius: 20, backgroundColor: '#2b2660', alignItems: 'center', gap: 10 },
  titulo: { color: '#fff', fontSize: 20, fontWeight: 'bold', fontFamily: FUENTE_TITULO, textAlign: 'center' },
  centro: { height: 100, justifyContent: 'center', alignItems: 'center' },
  guitarra: { fontSize: 64 },
  ayuda: { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center' },
  ayudaError: { color: '#ff9aa5' },
  boton: { alignSelf: 'stretch', marginTop: 4 },
  papelito: { position: 'absolute' },
});
