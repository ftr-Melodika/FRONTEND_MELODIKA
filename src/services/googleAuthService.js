// Archivo: src/services/googleAuthService.js
// Inicio de sesión con Google. No se usa el cliente de Supabase: se abre la página de Google en el
// navegador, Supabase vuelve a la app con los tokens en la URL y se entregan a AuthContext.login,
// igual que el login con contraseña. Así hay una sola sesión (la de tokenSesion.js).
import axios from 'axios';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { ENDPOINTS, SUPABASE_URL } from '../config/api';
import { getErrorMessage } from '../utils/errorUtils';

// Cierra solo la ventana del navegador al volver a la app (hace falta en web)
WebBrowser.maybeCompleteAuthSession();

// melodika://auth/callback en la app instalada, y exp://... en Expo Go.
// Esa dirección tiene que estar en Supabase → Authentication → URL Configuration → Redirect URLs.
const redirectTo = makeRedirectUri({ scheme: 'melodika', path: 'auth/callback' });
console.log('[Google] redirectTo =', redirectTo); // TEMPORAL: borrar cuando el login con Google ande

// Lee "a=1&b=2" sin URLSearchParams, que en React Native no implementa todo
function leerParametros(texto) {
  const parametros = {};
  (texto || '').split('&').forEach((par) => {
    if (!par) return;
    const [clave, ...resto] = par.split('=');
    parametros[decodeURIComponent(clave)] = decodeURIComponent(resto.join('=').replace(/\+/g, ' '));
  });
  return parametros;
}

// Supabase devuelve los tokens después del "#" (y los errores, según el caso, después del "?" o del "#")
function leerRespuesta(url) {
  const [sinHash, hash = ''] = url.split('#');
  const consulta = sinHash.split('?')[1];
  return { ...leerParametros(consulta), ...leerParametros(hash) };
}

function calcularVencimiento({ expires_at, expires_in }) {
  if (expires_at) return Number(expires_at);
  if (expires_in) return Math.floor(Date.now() / 1000) + Number(expires_in);
  return null;
}

// Pide al backend los datos de la cuenta del token (el login con contraseña ya los trae, este no)
async function obtenerCuenta(token) {
  // axios directo y no axiosClient: la sesión todavía no está guardada y su interceptor pisaría este token
  const respuesta = await axios.get(ENDPOINTS.cuentaActual, {
    timeout: 10000,
    headers: { Authorization: `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' },
  });
  return respuesta.data?.data?.cuenta;
}

export const googleAuthService = {
  // Devuelve { token, refreshToken, expiresAt, cuenta } (lo mismo que authService.login),
  // o null si la persona cerró la ventana sin terminar.
  login: async () => {
    const urlGoogle = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
    const resultado = await WebBrowser.openAuthSessionAsync(urlGoogle, redirectTo);
    // TEMPORAL: borrar cuando el login con Google ande. No imprime los tokens (lo que va después del #)
    console.log('[Google] tipo =', resultado.type, '| url =', resultado.url?.split('#')[0], '| trae hash =', !!resultado.url?.includes('#'));

    if (resultado.type !== 'success' || !resultado.url) return null;

    const respuesta = leerRespuesta(resultado.url);
    if (respuesta.error) {
      throw new Error(respuesta.error_description || 'No se pudo iniciar sesión con Google.');
    }

    const { access_token: token, refresh_token: refreshToken } = respuesta;
    if (!token || !refreshToken) throw new Error('Google no devolvió una sesión válida.');

    try {
      const cuenta = await obtenerCuenta(token);
      if (!cuenta) throw new Error('El servidor no devolvió los datos de la cuenta.');
      return { token, refreshToken, expiresAt: calcularVencimiento(respuesta), cuenta };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
