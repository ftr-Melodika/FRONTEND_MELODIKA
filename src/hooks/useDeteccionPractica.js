// Archivo: src/hooks/useDeteccionPractica.js
// Escucha el micrófono y evalúa si suena la nota o el acorde pedido.
import { useEffect, useRef, useState } from 'react';
import { useMicrofono } from './useMicrofono';
import { crearDetector } from '../utils/deteccionSonido';

// estado: ver useMicrofono
// lectura: última evaluación, ver crearDetector
export function useDeteccionPractica(objetivo, activo = true) {
  const [lectura, setLectura] = useState(null);
  const [aprobado, setAprobado] = useState(false);

  // Cambia decenas de veces por segundo: no debe provocar renders
  const detector = useRef(null);

  const procesarBuffer = ({ data, sampleRate, channels }) => {
    if (!detector.current) return;
    const resultado = detector.current.agregarBuffer(new Float32Array(data), channels || 1, sampleRate, Date.now());
    if (!resultado) return;
    setLectura(resultado);
    if (resultado.aprobado) setAprobado(true);
  };

  // Después de aprobar ya no hace falta el micrófono
  const estado = useMicrofono(procesarBuffer, activo && !aprobado && !!objetivo);

  // Otro objetivo es otra práctica: se empieza de cero
  useEffect(() => {
    detector.current = objetivo ? crearDetector(objetivo) : null;
    setLectura(null);
    setAprobado(false);
  }, [objetivo]);

  useEffect(() => {
    if (estado === 'pausado') setLectura(null);
  }, [estado]);

  return { estado, lectura, aprobado };
}
