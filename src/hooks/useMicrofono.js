// Archivo: src/hooks/useMicrofono.js
// Abre el micrófono mientras `activo` sea true y la app esté en primer plano.
// Todo se procesa en el celular: el audio no se guarda ni se envía a ningún lado.
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useAudioStream, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio';

// Devuelve el estado: 'pausado' | 'iniciando' | 'escuchando' | 'sin-permiso' | 'no-disponible' | 'error'
export function useMicrofono(onBuffer, activo = true) {
  const [estado, setEstado] = useState('pausado');
  const [appActiva, setAppActiva] = useState(AppState.currentState === 'active');

  const { stream } = useAudioStream({ onBuffer });

  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (nuevo) => setAppActiva(nuevo === 'active'));
    return () => suscripcion.remove();
  }, []);

  // Solo se usa el micrófono mientras haga falta: nunca en segundo plano
  const debeEscuchar = activo && appActiva;

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
    };
  }, [debeEscuchar, stream]);

  return estado;
}
