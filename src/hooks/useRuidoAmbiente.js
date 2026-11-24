// Archivo: src/hooks/useRuidoAmbiente.js
// Mide el ruido del lugar mientras el alumno no está tocando (leyendo la teoría, antes de empezar una
// práctica, con el menú de pausa abierto) y lo guarda en memoria (ver utils/ruidoAmbiente.js).
// Así, cuando empieza a tocar, el detector ya sabe cuánto ruido hay y no calibra con su propia guitarra.
// No muestra nada: es una medición silenciosa. El audio se procesa en el celular, no se guarda ni se envía.
import { useEffect, useRef, useState } from 'react';
import { useMicrofono } from './useMicrofono';
import { crearDetector } from '../utils/deteccionSonido';
import { guardarRuido, ruidoMedido } from '../utils/ruidoAmbiente';

// Al volver de una práctica, deja que ella suelte el micrófono antes de abrirlo acá
const MS_ANTES_DE_ABRIR = 400;
const MS_ENTRE_GUARDADOS = 1000;
// El detector pide un objetivo; acá no se evalúa ninguna nota, solo se mide el ruido
const OBJETIVO_NINGUNO = { tipo: 'nota', nombre: '', posiciones: [], midis: [40] };

export function useRuidoAmbiente(medir) {
  const [abierto, setAbierto] = useState(false);
  const detector = useRef(null);
  const ultimoGuardado = useRef(0);

  useEffect(() => {
    if (!medir) {
      setAbierto(false);
      return undefined;
    }
    const espera = setTimeout(() => setAbierto(true), MS_ANTES_DE_ABRIR);
    return () => clearTimeout(espera);
  }, [medir]);

  // Cada vez que se abre arranca desde lo último medido, para no perder lo ya aprendido
  useEffect(() => {
    if (!abierto) return undefined;
    detector.current = crearDetector(OBJETIVO_NINGUNO, { ruido: ruidoMedido() });
    return () => {
      const ruido = detector.current?.ruido();
      if (ruido) guardarRuido(ruido);
      detector.current = null;
    };
  }, [abierto]);

  const procesarBuffer = ({ data, sampleRate, channels }) => {
    if (!detector.current) return;
    const ahora = Date.now();
    detector.current.agregarBuffer(new Float32Array(data), channels || 1, sampleRate, ahora);
    if (ahora - ultimoGuardado.current < MS_ENTRE_GUARDADOS) return;
    const ruido = detector.current.ruido();
    if (!ruido) return;
    ultimoGuardado.current = ahora;
    guardarRuido(ruido);
  };

  useMicrofono(procesarBuffer, abierto);
}
