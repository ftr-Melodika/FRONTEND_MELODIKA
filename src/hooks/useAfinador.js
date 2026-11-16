// Archivo: src/hooks/useAfinador.js
// Escucha el micrófono y devuelve la frecuencia que está sonando (null si no suena nada claro).
// `objetivo` es la frecuencia de la cuerda que se está afinando, si se sabe: el afinador la busca
// aunque todavía suenen otras cuerdas.
import { useEffect, useRef, useState } from 'react';
import { useMicrofono } from './useMicrofono';
import { crearAfinador } from '../utils/afinador';

export function useAfinador(objetivo = null) {
  const [frecuencia, setFrecuencia] = useState(null);

  // Cambia decenas de veces por segundo: no debe provocar renders
  const afinador = useRef(null);
  if (!afinador.current) afinador.current = crearAfinador();
  afinador.current.apuntar(objetivo);

  const estado = useMicrofono(({ data, sampleRate, channels }) => {
    const lectura = afinador.current.agregarBuffer(new Float32Array(data), channels || 1, sampleRate, Date.now());
    if (lectura) setFrecuencia(lectura.frecuencia);
  });

  // Al volver de segundo plano no debe quedar audio ni lecturas de antes
  useEffect(() => {
    if (estado !== 'pausado') return;
    afinador.current = crearAfinador();
    afinador.current.apuntar(objetivo);
    setFrecuencia(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  // La lectura que quedaba en pantalla era de la cuerda anterior
  useEffect(() => {
    setFrecuencia(null);
  }, [objetivo]);

  return { estado, frecuencia };
}
