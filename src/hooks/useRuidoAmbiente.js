// Archivo: src/hooks/useRuidoAmbiente.js
// Mide el ruido del lugar mientras el alumno no está tocando (navegando por los menús, leyendo la
// teoría, antes de empezar una práctica, con la pausa abierta) y lo guarda en memoria (ver
// utils/ruidoAmbiente.js). Así, cuando empieza a tocar, el detector ya sabe cuánto ruido hay.
// Nunca pide el permiso: solo mide si ya está dado.
// No muestra nada: es una medición silenciosa. El audio se procesa en el celular, no se guarda ni se envía.
import { useEffect, useRef, useState } from 'react';
import { getRecordingPermissionsAsync } from 'expo-audio';
import { useMicrofono } from './useMicrofono';
import { crearMedidorRuido } from '../utils/deteccionSonido';
import { guardarRuido, ruidoMedido } from '../utils/ruidoAmbiente';

// Al volver de una práctica, deja que ella suelte el micrófono antes de abrirlo acá
const MS_ANTES_DE_ABRIR = 400;
// Sin permiso todavía: cada tanto se vuelve a mirar, por si lo dio desde la ventana o los ajustes
const MS_REVISAR_PERMISO = 3000;
const MS_ENTRE_GUARDADOS = 1000;

export function useRuidoAmbiente(medir) {
  const [abierto, setAbierto] = useState(false);
  const medidor = useRef(null);
  const ultimoGuardado = useRef(0);

  useEffect(() => {
    if (!medir) {
      setAbierto(false);
      return undefined;
    }
    let cancelado = false;
    let espera;
    const abrirSiHayPermiso = async () => {
      const permiso = await getRecordingPermissionsAsync().catch(() => null);
      if (cancelado) return;
      if (permiso?.granted) setAbierto(true);
      else espera = setTimeout(abrirSiHayPermiso, MS_REVISAR_PERMISO);
    };
    espera = setTimeout(abrirSiHayPermiso, MS_ANTES_DE_ABRIR);
    return () => {
      cancelado = true;
      clearTimeout(espera);
    };
  }, [medir]);

  // Con `medir` en false se suelta el micrófono en el acto, antes de que otro lo abra
  const escuchando = medir && abierto;

  // Cada vez que se abre arranca desde lo último medido, para no perder lo ya aprendido
  useEffect(() => {
    if (!escuchando) return undefined;
    medidor.current = crearMedidorRuido({ ruido: ruidoMedido() });
    return () => {
      const ruido = medidor.current?.ruido();
      if (ruido) guardarRuido(ruido);
      medidor.current = null;
    };
  }, [escuchando]);

  const procesarBuffer = ({ data, sampleRate, channels }) => {
    if (!medidor.current) return;
    const ahora = Date.now();
    medidor.current.agregarBuffer(new Float32Array(data), channels || 1, sampleRate, ahora);
    if (ahora - ultimoGuardado.current < MS_ENTRE_GUARDADOS) return;
    const ruido = medidor.current.ruido();
    if (!ruido) return;
    ultimoGuardado.current = ahora;
    guardarRuido(ruido);
  };

  useMicrofono(procesarBuffer, escuchando);
}
