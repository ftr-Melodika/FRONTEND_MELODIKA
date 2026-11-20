// Archivo: src/hooks/useInvitacionLink.js
// Captura los links melodika://invitar/<token> y abre la pantalla de invitación.
// Si todavía no hay sesión o perfil activo, guarda el token y lo usa apenas haya uno
// (también si la app se cierra en el medio).
import { useCallback, useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { extraerTokenInvitacion } from '../utils/invitaciones';

const CLAVE = 'invitacionPendiente';

export function useInvitacionLink({ navigationRef, navegacionLista, hayPerfil }) {
  const [token, setToken] = useState(null);

  const guardar = useCallback((nuevo) => {
    setToken(nuevo);
    AsyncStorage.setItem(CLAVE, nuevo).catch(() => {});
  }, []);

  // Link con el que se abrió la app, links que llegan con la app abierta y un token pendiente anterior
  useEffect(() => {
    let activo = true;
    (async () => {
      const inicial = extraerTokenInvitacion(await Linking.getInitialURL());
      if (!activo) return;
      if (inicial) return guardar(inicial);
      const guardado = await AsyncStorage.getItem(CLAVE).catch(() => null);
      if (activo && guardado) setToken(guardado);
    })();

    const suscripcion = Linking.addEventListener('url', ({ url }) => {
      const nuevo = extraerTokenInvitacion(url);
      if (nuevo) guardar(nuevo);
    });
    return () => { activo = false; suscripcion.remove(); };
  }, [guardar]);

  // Con navegación lista y perfil elegido, se abre la invitación y se descarta el token
  useEffect(() => {
    if (!token || !navegacionLista || !hayPerfil) return;
    navigationRef.navigate('InvitacionAmigo', { token });
    setToken(null);
    AsyncStorage.removeItem(CLAVE).catch(() => {});
  }, [token, navegacionLista, hayPerfil, navigationRef]);
}
