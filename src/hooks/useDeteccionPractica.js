// Archivo: src/hooks/useDeteccionPractica.js
// Escucha el micrófono y evalúa si suena la nota o el acorde pedido.
import { useEffect, useRef, useState } from 'react';
import { useMicrofono } from './useMicrofono';
import { crearDetector } from '../utils/deteccionSonido';

// Lo que la pantalla muestra de una lectura. Si no cambió, no hace falta volver a dibujar:
// llega una lectura cada 150 ms y redibujar todo (mástil incluido) pesa en un celular lento.
const claveVisible = (l) =>
  l ? [l.calibrando, l.hayNota, l.correcta, l.aprobado, l.notaDetectada, l.registro, l.faltantes?.join(), l.sobrantes?.join()].join('|') : '';

// estado: ver useMicrofono
// lectura: última evaluación, ver crearDetector
// Con seguirAlAprobar el micrófono no se corta al acertar: sirve para encadenar notas
// sin esperar a que el micrófono vuelva a arrancar.
export function useDeteccionPractica(objetivo, activo = true, { seguirAlAprobar = false } = {}) {
  const [lectura, setLectura] = useState(null);
  const [aprobado, setAprobado] = useState(false);

  // Cambia decenas de veces por segundo: no debe provocar renders
  const detector = useRef(null);
  const ultimaClave = useRef('');

  const procesarBuffer = ({ data, sampleRate, channels }) => {
    if (!detector.current) return;
    const resultado = detector.current.agregarBuffer(new Float32Array(data), channels || 1, sampleRate, Date.now());
    if (!resultado) return;
    const clave = claveVisible(resultado);
    if (clave === ultimaClave.current) return;
    ultimaClave.current = clave;
    setLectura(resultado);
    if (resultado.aprobado) setAprobado(true);
  };

  // Después de aprobar ya no hace falta el micrófono
  const estado = useMicrofono(procesarBuffer, activo && (seguirAlAprobar || !aprobado) && !!objetivo);

  // Otro objetivo es otra nota: se empieza de cero, pero sin volver a medir el ruido del lugar
  useEffect(() => {
    if (!objetivo) detector.current = null;
    else if (detector.current) detector.current.cambiarObjetivo(objetivo);
    else detector.current = crearDetector(objetivo);
    setLectura((anterior) => {
      const sigue = anterior?.calibrando ? anterior : null;
      ultimaClave.current = claveVisible(sigue);
      return sigue;
    });
    setAprobado(false);
  }, [objetivo]);

  useEffect(() => {
    if (estado !== 'pausado') return;
    ultimaClave.current = '';
    setLectura(null);
  }, [estado]);

  return { estado, lectura, aprobado };
}
