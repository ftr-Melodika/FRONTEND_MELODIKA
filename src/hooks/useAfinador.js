// Archivo: src/hooks/useAfinador.js
// Escucha el micrófono y devuelve la frecuencia que está sonando (null si no suena nada claro).
import { useEffect, useRef, useState } from 'react';
import { useMicrofono } from './useMicrofono';
import { crearAfinador } from '../utils/afinador';

export function useAfinador() {
  const [frecuencia, setFrecuencia] = useState(null);

  // Cambia decenas de veces por segundo: no debe provocar renders
  const afinador = useRef(null);
  if (!afinador.current) afinador.current = crearAfinador();

  const estado = useMicrofono(({ data, sampleRate, channels }) => {
    const lectura = afinador.current.agregarBuffer(new Float32Array(data), channels || 1, sampleRate, Date.now());
    if (lectura) setFrecuencia(lectura.frecuencia);
  });

  // Al volver de segundo plano no debe quedar audio ni lecturas de antes
  useEffect(() => {
    if (estado !== 'pausado') return;
    afinador.current = crearAfinador();
    setFrecuencia(null);
  }, [estado]);

  return { estado, frecuencia };
}
