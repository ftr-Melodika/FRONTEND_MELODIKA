// Archivo: src/hooks/useAfinacionGuiada.js
// Afinación guiada: escucha el micrófono, compara con la cuerda que toca y, cuando queda afinada
// un rato, la marca y pasa sola a la siguiente. La usan el Afinador y la lección de afinación.
import { useEffect, useRef, useState } from 'react';
import { useAfinador } from './useAfinador';
import { CENTS_AFINADA_POR_DEFECTO, MS_ESTABLE_POR_DEFECTO, compararAfinacion, siguienteCuerda } from '../utils/actividades';

// cuerdas: [{ cuerda, nota, frecuencia }] en el orden en que se afinan.
// Si cambian las notas (otra afinación), la guía vuelve a empezar desde la primera.
export function useAfinacionGuiada({ cuerdas, toleranciaCents = CENTS_AFINADA_POR_DEFECTO, msEstable = MS_ESTABLE_POR_DEFECTO }) {
  const { estado, frecuencia } = useAfinador();
  const orden = cuerdas.map((c) => c.cuerda);
  const [cuerdaElegida, setCuerdaElegida] = useState(orden[0]);
  const [afinadas, setAfinadas] = useState([]);
  const [terminado, setTerminado] = useState(false);

  const objetivo = cuerdas.find((c) => c.cuerda === cuerdaElegida) ?? null;
  const resultado = frecuencia && objetivo
    ? { cuerda: objetivo.cuerda, nota: objetivo.nota, ...compararAfinacion(frecuencia, objetivo.frecuencia, toleranciaCents) }
    : null;
  const afinadaAhora = !!objetivo && resultado?.estado === 'afinada' && !terminado;

  // Si se mantiene afinada, se marca y pasa a la siguiente que falte. Un paso fugaz por el centro
  // mientras se gira la clavija no cuenta. La anterior todavía suena al cambiar, por eso el orden
  // no debe poner seguidas dos cuerdas con la misma nota (la 6ta y la 1ra son Mi).
  useEffect(() => {
    if (!afinadaAhora) return undefined;
    const espera = setTimeout(() => {
      const hechas = afinadas.includes(cuerdaElegida) ? afinadas : [...afinadas, cuerdaElegida];
      setAfinadas(hechas);
      const siguiente = siguienteCuerda(orden, cuerdaElegida, hechas);
      if (siguiente !== null) setCuerdaElegida(siguiente);
      else setTerminado(true);
    }, msEstable);
    return () => clearTimeout(espera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [afinadaAhora, cuerdaElegida, afinadas, msEstable]);

  const reiniciar = () => {
    setAfinadas([]);
    setTerminado(false);
    setCuerdaElegida(orden[0]);
  };

  // Al cambiar de afinación, lo afinado antes ya no sirve. Se compara por frecuencias porque
  // quien llama puede pasar un array nuevo en cada render con las mismas notas.
  const clave = cuerdas.map((c) => `${c.cuerda}:${c.frecuencia.toFixed(2)}`).join(',');
  const claveAnterior = useRef(clave);
  useEffect(() => {
    if (claveAnterior.current === clave) return;
    claveAnterior.current = clave;
    reiniciar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  const elegir = (cuerda) => {
    setTerminado(false);
    setCuerdaElegida(cuerda);
  };

  return { estado, frecuencia, resultado, cuerdaElegida, afinadas, terminado, elegir, reiniciar };
}
