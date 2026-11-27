// Archivo: src/hooks/useDeteccionPractica.js
// Escucha el micrófono y evalúa si suena la nota o el acorde pedido.
import { useEffect, useRef, useState } from 'react';
import { useMicrofono } from './useMicrofono';
import { crearDetector } from '../utils/deteccionSonido';
import { ruidoMedido } from '../utils/ruidoAmbiente';

// Lo que la pantalla muestra de una lectura. Si no cambió, no hace falta volver a dibujar:
// llega una lectura cada 150 ms y redibujar todo (mástil incluido) pesa en un celular lento.
const claveVisible = (l) =>
  l ? [l.hayNota, l.correcta, l.aprobado, l.notaDetectada, l.registro, l.afinacion, l.faltantes?.join(), l.sobrantes?.join(), l.desafinadas?.join()].join('|') : '';

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

  // Otro objetivo es otra nota: se empieza de cero
  useEffect(() => {
    if (!objetivo) detector.current = null;
    else if (detector.current) detector.current.cambiarObjetivo(objetivo);
    // El ruido del lugar ya viene medido de cuando no se estaba tocando (ver useRuidoAmbiente)
    else detector.current = crearDetector(objetivo, { ruido: ruidoMedido() });
    ultimaClave.current = '';
    setLectura(null);
    setAprobado(false);
  }, [objetivo]);

  useEffect(() => {
    if (estado !== 'pausado') return;
    // En la pausa se vuelve a medir el ruido: al reanudar, el detector arranca con lo último medido
    if (detector.current && objetivo) detector.current = crearDetector(objetivo, { ruido: ruidoMedido() });
    ultimaClave.current = '';
    setLectura(null);
  }, [estado]);

  return { estado, lectura, aprobado };
}
