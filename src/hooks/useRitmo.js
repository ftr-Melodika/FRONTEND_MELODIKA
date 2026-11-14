// Archivo: src/hooks/useRitmo.js
// Un ejercicio de tempo: hace sonar el metrónomo, escucha los golpes por el micrófono y los evalúa.
// El audio se procesa en el celular: no se guarda ni se envía a ningún lado.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { useMicrofono } from './useMicrofono';
import { armarLineaDeTiempo, crearDetectorGolpes, evaluarGolpes, LATENCIA_MAX } from '../utils/ritmo';

const MS_ANTES_DE_LA_CUENTA = 400; // Desde que el micrófono está listo hasta el primer clic
const MS_RELOJ = 10;
const MS_CLIC_TARDE = 60; // Si el reloj se demoró más que esto, el clic ya no suena (sonaría a destiempo)
const MS_DESPUES = 500; // Se sigue escuchando un poco después del último golpe
const MS_MEDIDOR = 100; // Cada cuánto se actualiza el medidor de volumen en pantalla

// En iOS, mientras el micrófono escucha, expo-audio pone el audio en modo "solo grabación"
// (AVAudioSession .record): no suena nada. Ahí el metrónomo es solo visual.
export const CLIC_DISPONIBLE = Platform.OS !== 'ios';

// fase: 'listo' | 'preparando' (abriendo el micrófono) | 'tocando' | 'terminado'
// estado: el del micrófono (ver useMicrofono)
// nivel: volumen del micrófono (0 a 1). golpesDetectados: cuántos golpes escuchó en este intento.
export function useRitmo(config, { conSonido: pedidoConSonido = true } = {}) {
  const conSonido = pedidoConSonido && CLIC_DISPONIBLE;
  const linea = useMemo(() => armarLineaDeTiempo(config), [config]);
  const [fase, setFase] = useState('listo');
  const [clicActual, setClicActual] = useState(null); // Índice en linea.clics
  const [parteActual, setParteActual] = useState(null); // Índice en linea.partes
  const [parcial, setParcial] = useState(null); // { aciertos, evaluados } mientras se toca
  const [resultado, setResultado] = useState(null); // evaluarGolpes al terminar
  const [nivel, setNivel] = useState(0);
  const [golpesDetectados, setGolpesDetectados] = useState(0);
  const [inicio, setInicio] = useState(null); // Date.now() del primer clic de la cuenta (para animar las luces)

  const clicNormal = useAudioPlayer(require('../../assets/sonidos/clic.wav'));
  const clicFuerte = useAudioPlayer(require('../../assets/sonidos/clic-fuerte.wav'));

  // Cambian decenas de veces por segundo: no deben provocar renders
  const detector = useRef(null);
  const golpesDelMicrofono = useRef([]); // En el reloj del micrófono (ms)
  const desfaseReloj = useRef(null); // Reloj del micrófono -> Date.now()
  const muestrasRecibidas = useRef(0); // El reloj del micrófono: cuántas muestras llegaron
  const t0 = useRef(0);
  const sonido = useRef(conSonido);
  sonido.current = conSonido;

  const procesarBuffer = ({ data, sampleRate, channels }) => {
    if (!detector.current) return;
    const crudo = new Float32Array(data);
    const canales = channels || 1;
    const mono = canales === 1 ? crudo : crudo.filter((_, i) => i % canales === 0);
    const ahora = Date.now();
    // El tiempo de cada muestra sale de contar las muestras recibidas: es el reloj exacto del
    // micrófono, sin los saltos de cuándo llega cada buffer a JavaScript. No se usa el `timestamp`
    // de expo-audio: en iOS lo calcula mal (trata el reloj de la máquina como si fueran
    // nanosegundos y en un iPhone da tiempos ~40 veces más chicos) y en Android es la hora de llegada.
    // Para pasarlo a Date.now() se usa el buffer que llegó más rápido (el que menos esperó).
    const inicio = (muestrasRecibidas.current / sampleRate) * 1000;
    muestrasRecibidas.current += mono.length;
    const fin = (muestrasRecibidas.current / sampleRate) * 1000;
    const desfase = ahora - fin;
    if (desfaseReloj.current === null || desfase < desfaseReloj.current) desfaseReloj.current = desfase;
    golpesDelMicrofono.current.push(...detector.current.agregar(mono, inicio, sampleRate));
  };

  // Medidor y contador de golpes en pantalla (unas pocas veces por segundo, no en cada buffer)
  useEffect(() => {
    if (fase !== 'preparando' && fase !== 'tocando') return undefined;
    const reloj = setInterval(() => {
      if (!detector.current) return;
      setNivel(Math.round(detector.current.nivel() * 100) / 100);
      setGolpesDetectados(golpesDelMicrofono.current.length);
    }, MS_MEDIDOR);
    return () => clearInterval(reloj);
  }, [fase]);

  const estado = useMicrofono(procesarBuffer, fase === 'preparando' || fase === 'tocando');

  // Golpes detectados, en ms desde el comienzo de la cuenta (la escala de la línea de tiempo)
  const golpesRelativos = () => golpesDelMicrofono.current.map((t) => t + (desfaseReloj.current ?? 0) - t0.current);

  const empezar = () => {
    // Con el clic sonando se escuchan solo los graves (el clic es agudo); sin clic, los agudos del ataque
    // Después de un golpe se ignora lo que llegue antes de la mitad del tiempo hasta el próximo:
    // una cuerda que sigue sonando puede parecer más de un golpe
    const separacion = Math.min(...linea.golpes.slice(1).map((g, i) => g.t - linea.golpes[i].t));
    const refractarioMs = Math.min(300, Math.max(70, Number.isFinite(separacion) ? separacion * 0.5 : 70));
    detector.current = crearDetectorGolpes({ banda: conSonido ? 'graves' : 'agudos', refractarioMs });
    golpesDelMicrofono.current = [];
    setGolpesDetectados(0);
    setNivel(0);
    desfaseReloj.current = null;
    muestrasRecibidas.current = 0;
    setResultado(null);
    setParcial(null);
    setClicActual(null);
    setParteActual(null);
    setFase('preparando');
  };

  const detener = () => {
    detector.current = null;
    setClicActual(null);
    setParteActual(null);
    setFase('listo');
  };

  // Cuando el micrófono ya escucha, arranca la cuenta
  useEffect(() => {
    if (fase !== 'preparando' || estado !== 'escuchando') return;
    t0.current = Date.now() + MS_ANTES_DE_LA_CUENTA;
    setInicio(t0.current);
    setFase('tocando');
  }, [fase, estado]);

  useEffect(() => {
    if (fase !== 'tocando') return undefined;
    let siguienteClic = 0;
    let siguienteParte = 0;

    const tocarClic = (fuerte) => {
      const player = fuerte ? clicFuerte : clicNormal;
      try {
        player.play();
        // Se rebobina después de sonar (dura 35 ms), así el próximo play arranca sin esperar
        setTimeout(() => player.seekTo(0).catch(() => {}), 80);
      } catch {
        // Sin sonido el ejercicio sigue con las luces
      }
    };

    const reloj = setInterval(() => {
      const t = Date.now() - t0.current;
      if (t < 0) return;

      let ultimoClic = null;
      while (siguienteClic < linea.clics.length && linea.clics[siguienteClic].t <= t) {
        const clic = linea.clics[siguienteClic];
        if (clic.audible && sonido.current && t - clic.t < MS_CLIC_TARDE) tocarClic(clic.fuerte);
        ultimoClic = siguienteClic;
        siguienteClic++;
      }
      let parteNueva = null;
      while (siguienteParte < linea.partes.length && linea.partes[siguienteParte].t <= t) {
        parteNueva = siguienteParte;
        siguienteParte++;
      }
      if (parteNueva !== null) setParteActual(parteNueva);

      if (ultimoClic !== null) {
        setClicActual(ultimoClic);
        // Resultado parcial: los golpes que ya no pueden recibir un golpe tardío
        const evaluables = linea.golpes.filter((g) => g.t + g.ventana + LATENCIA_MAX < t);
        if (evaluables.length) {
          const { aciertos } = evaluarGolpes(evaluables, golpesRelativos(), { aprobar: config.aprobar });
          setParcial({ aciertos, evaluados: evaluables.length });
        }
      }

      if (t > linea.duracion + MS_DESPUES) {
        clearInterval(reloj);
        setResultado(evaluarGolpes(linea.golpes, golpesRelativos(), { aprobar: config.aprobar }));
        setClicActual(null);
        setParteActual(null);
        detector.current = null;
        setFase('terminado');
      }
    }, MS_RELOJ);

    return () => clearInterval(reloj);
  }, [fase, linea]);

  return { fase, estado, empezar, detener, linea, clicActual, parteActual, parcial, resultado, nivel, golpesDetectados, conSonido, inicio };
}
