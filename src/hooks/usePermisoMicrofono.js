// Archivo: src/hooks/usePermisoMicrofono.js
// El pedido del permiso de micrófono al entrar a la app: primero una ventana propia que explica
// para qué es y, si acepta, el cartel del sistema. Se pregunta una sola vez en cada celular.
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';

const CLAVE_RESPONDIDO = 'permisoMicrofonoRespondido';
// En iOS, abrir otra ventana mientras esta se cierra puede dejar la segunda sin aparecer
const MS_CIERRE_VENTANA = 400;

// En web no hay detección de sonido: no hay nada que pedir
const SE_PUEDE_PEDIR = Platform.select({ web: false, default: true });

async function hayQuePreguntar() {
  if (!SE_PUEDE_PEDIR) return false;
  if (await AsyncStorage.getItem(CLAVE_RESPONDIDO)) return false;
  const permiso = await getRecordingPermissionsAsync();
  return !permiso.granted && permiso.canAskAgain;
}

// paso: 'comprobando' | 'preguntar' | 'cerrando' | 'resuelto'
export function usePermisoMicrofono() {
  const [paso, setPaso] = useState('comprobando');

  useEffect(() => {
    let cancelado = false;
    hayQuePreguntar()
      .catch(() => false)
      .then((preguntar) => {
        if (!cancelado) setPaso(preguntar ? 'preguntar' : 'resuelto');
      });
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (paso !== 'cerrando') return undefined;
    const espera = setTimeout(() => setPaso('resuelto'), MS_CIERRE_VENTANA);
    return () => clearTimeout(espera);
  }, [paso]);

  const responder = async (permitir) => {
    AsyncStorage.setItem(CLAVE_RESPONDIDO, '1').catch(() => {});
    if (permitir) await requestRecordingPermissionsAsync().catch(() => {});
    setPaso('cerrando');
  };

  return {
    preguntando: paso === 'preguntar',
    resuelto: paso === 'resuelto',
    permitir: () => responder(true),
    omitir: () => responder(false),
  };
}
