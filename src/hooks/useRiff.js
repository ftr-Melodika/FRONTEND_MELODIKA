// Archivo: src/hooks/useRiff.js
// El riff en movimiento: lleva el reloj del recorrido, escucha qué nota suena y marca cada nota
// como acertada o errada cuando pasa por la línea. Si se erra mucho, vuelve atrás.
// En las canciones cada "nota" del recorrido es un acorde (tipo 'acorde', con sus midis).
// El audio se procesa en el celular: no se guarda ni se envía a ningún lado.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMicrofono } from './useMicrofono';
import { crearDetector, compararAcorde, compararNota } from '../utils/deteccionSonido';
import { armarRecorrido, dondeRetroceder, enVentana, finDeVentana, resumir, MS_DESPUES } from '../utils/riff';

// Antes de la primera nota: el detector mide el ruido del lugar (~1,5 s) y las notas se acercan
export const MS_ENTRADA = 2500;
// Después de volver atrás, cuánto antes de la nota se retoma (para verla venir)
export const MS_ENTRADA_RETOMAR = 2000;
const MS_AVISO_RETROCESO = 1300; // Lo que se ve el aviso "volvamos" antes de retomar
const MS_RELOJ = 30;
const LECTURAS_RECIENTES = 4; // Un rasgueo hace sonar las cuerdas de a una: se juntan las últimas lecturas

// fase: 'listo' | 'preparando' (abriendo el micrófono) | 'tocando' | 'retrocediendo' | 'terminado'
// tramo: { desde (ms del recorrido), inicio (Date.now() en que se pasa por `desde`) } para animar
// resultados: true / false / null por nota
export function useRiff(riff) {
  const recorrido = useMemo(() => armarRecorrido(riff), [riff]);
  const [fase, setFase] = useState('listo');
  const [tramo, setTramo] = useState(null);
  const [resultados, setResultados] = useState(() => recorrido.notas.map(() => null));
  const [retrocesos, setRetrocesos] = useState(0);

  // Cambian decenas de veces por segundo: no deben provocar renders
  const detector = useRef(null);
  const reloj = useRef(null); // { desde, inicio }: posición del recorrido = desde + (ahora - inicio)
  const marcas = useRef(recorrido.notas.map(() => null));
  const muestras = useRef(0);
  const desfase = useRef(null);
  const enMarcha = useRef(false);
  const recientes = useRef([]);

  const posicion = (ahora = Date.now()) => (reloj.current ? reloj.current.desde + (ahora - reloj.current.inicio) : -Infinity);

  const publicar = () => setResultados([...marcas.current]);

  const procesarBuffer = ({ data, sampleRate, channels }) => {
    if (!detector.current) return;
    const crudo = new Float32Array(data);
    const canales = channels || 1;
    // Reloj del micrófono: las muestras recibidas (ver useRitmo: el timestamp de expo-audio falla en iOS)
    const llegada = Date.now();
    muestras.current += crudo.length / canales;
    const fin = (muestras.current / sampleRate) * 1000;
    if (desfase.current === null || llegada - fin < desfase.current) desfase.current = llegada - fin;
    const ahora = fin + desfase.current;

    const lectura = detector.current.agregarBuffer(crudo, canales, sampleRate, ahora);
    if (!lectura || lectura.calibrando) return;
    recientes.current.push(lectura.fundamentales || []);
    if (recientes.current.length > LECTURAS_RECIENTES) recientes.current.shift();
    if (!enMarcha.current || !lectura.fundamentales?.length) return;

    // ¿La nota que suena es la de alguna nota que está pasando por la línea?
    const t = posicion(ahora);
    let cambio = false;
    recorrido.notas.forEach((nota, i) => {
      if (marcas.current[i] !== null || !enVentana(nota, t)) return;
      const suena = nota.tipo === 'acorde'
        ? compararAcorde(lectura.fundamentales, nota.midis, recientes.current.flat()).correcta
        : compararNota(lectura.fundamentales, nota.midi).correcta;
      if (suena) {
        marcas.current[i] = true;
        cambio = true;
      }
    });
    if (cambio) publicar();
  };

  const estado = useMicrofono(procesarBuffer, fase !== 'listo' && fase !== 'terminado');

  const arrancarDesde = (desde) => {
    reloj.current = { desde, inicio: Date.now() };
    enMarcha.current = true;
    setTramo({ ...reloj.current });
    setFase('tocando');
  };

  const empezar = () => {
    // El objetivo del detector no importa: se usan las notas oídas (fundamentales) de cada lectura
    const primera = recorrido.notas[0];
    detector.current = crearDetector({ tipo: 'nota', nombre: '', posiciones: [], midis: [primera.midi ?? primera.midis[0]] });
    recientes.current = [];
    muestras.current = 0;
    desfase.current = null;
    marcas.current = recorrido.notas.map(() => null);
    publicar();
    setRetrocesos(0);
    reloj.current = null;
    enMarcha.current = false;
    setFase('preparando');
  };

  const detener = () => {
    enMarcha.current = false;
    detector.current = null;
    reloj.current = null;
    setTramo(null);
    setFase('listo');
  };

  // Cuando el micrófono ya escucha, arranca el recorrido
  useEffect(() => {
    if (fase === 'preparando' && estado === 'escuchando') arrancarDesde(-MS_ENTRADA);
  }, [fase, estado]);

  // Las notas que pasaron sin sonar son errores; si hay muchos, se vuelve atrás
  useEffect(() => {
    if (fase !== 'tocando') return undefined;
    const intervalo = setInterval(() => {
      const t = posicion();
      let cambio = false;
      recorrido.notas.forEach((nota, i) => {
        if (marcas.current[i] === null && t > finDeVentana(nota)) {
          marcas.current[i] = false;
          cambio = true;
        }
      });
      if (cambio) {
        publicar();
        const volverA = dondeRetroceder(marcas.current);
        if (volverA !== null) {
          // Se borran los resultados desde ahí: esas notas se vuelven a tocar
          enMarcha.current = false;
          for (let i = volverA; i < marcas.current.length; i++) marcas.current[i] = null;
          publicar();
          setRetrocesos((r) => r + 1);
          setFase('retrocediendo');
          setTimeout(() => {
            if (reloj.current) arrancarDesde(recorrido.notas[volverA].t - MS_ENTRADA_RETOMAR);
          }, MS_AVISO_RETROCESO);
          setTramo({ desde: t, inicio: null }); // Quieto donde quedó
          return;
        }
      }
      if (t > recorrido.duracion + MS_DESPUES) {
        enMarcha.current = false;
        detector.current = null;
        setFase('terminado');
      }
    }, MS_RELOJ);
    return () => clearInterval(intervalo);
  }, [fase, recorrido]);

  const resumen = useMemo(() => resumir(resultados), [resultados]);
  return { fase, estado, empezar, detener, recorrido, tramo, resultados, resumen, retrocesos };
}
