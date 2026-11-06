// Archivo: src/hooks/useDeteccionPractica.js
// Escucha el micrófono y evalúa si suena la nota o el acorde pedido.
// Todo se procesa en el celular: el audio no se guarda ni se envía a ningún lado.
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAudioStream, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';
import { crearDetector } from '../utils/deteccionSonido';

// estado: 'pausado' | 'iniciando' | 'escuchando' | 'sin-permiso' | 'no-disponible' | 'error'
// lectura: última evaluación, ver crearDetector
export function useDeteccionPractica(objetivo, activo = true) {
  const [estado, setEstado] = useState('pausado');
  const [lectura, setLectura] = useState(null);
  const [aprobado, setAprobado] = useState(false);
  const [appActiva, setAppActiva] = useState(AppState.currentState === 'active');

  // Cambia decenas de veces por segundo: no debe provocar renders
  const detector = useRef(null);

  const procesarBuffer = ({ data, sampleRate, channels }) => {
    if (!detector.current) return;
    const resultado = detector.current.agregarBuffer(new Float32Array(data), channels || 1, sampleRate, Date.now());
    if (!resultado) return;
    setLectura(resultado);
    if (resultado.aprobado) setAprobado(true);
  };

  const { stream } = useAudioStream({ onBuffer: procesarBuffer });

  // Otro objetivo es otra práctica: se empieza de cero
  useEffect(() => {
    detector.current = objetivo ? crearDetector(objetivo) : null;
    setLectura(null);
    setAprobado(false);
  }, [objetivo]);

  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (nuevo) => setAppActiva(nuevo === 'active'));
    return () => suscripcion.remove();
  }, []);

  // Solo se usa el micrófono mientras haga falta: nunca en segundo plano ni después de aprobar
  const debeEscuchar = activo && appActiva && !aprobado && !!objetivo;

  useEffect(() => {
    if (!debeEscuchar) {
      setEstado('pausado');
      return undefined;
    }
    // En web, expo-audio no captura el micrófono y devuelve un stream nulo
    if (!stream) {
      setEstado('no-disponible');
      return undefined;
    }

    let cancelado = false;
    let iniciado = false;

    const detener = () => {
      try {
        stream.stop();
      } catch {
        // El stream ya pudo haberse liberado al salir de la pantalla
      }
      // En iOS el stream deja el audio en modo grabación y afectaría a los videos
      setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
    };

    (async () => {
      setEstado('iniciando');
      try {
        const { granted } = await requestRecordingPermissionsAsync();
        if (cancelado) return;
        if (!granted) {
          setEstado('sin-permiso');
          return;
        }
        await stream.start();
        iniciado = true;
        if (cancelado) {
          detener();
          return;
        }
        setEstado('escuchando');
      } catch (error) {
        console.warn('No se pudo iniciar el micrófono:', error);
        if (!cancelado) setEstado('error');
      }
    })();

    return () => {
      cancelado = true;
      if (iniciado) detener();
      setLectura(null);
    };
  }, [debeEscuchar, stream]);

  return { estado, lectura, aprobado };
}
