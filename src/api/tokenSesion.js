// Archivo: src/api/tokenSesion.js
// Los tokens de la sesión. La sesión nunca se cierra sola: el token de acceso dura ~1 h, y cuando
// vence se pide uno nuevo con el refresh token. Solo se cierra si el usuario toca "Cerrar sesión"
// o si el backend rechaza el refresh token (401: la sesión murió de verdad). Sin internet o con
// el servidor caído, la sesión sigue: se reintenta en el próximo pedido.
//
// Se guardan en memoria (leer el almacenamiento en cada pedido es lento en Android) y en el celular:
// el token de acceso en AsyncStorage y el refresh token, que da acceso por mucho tiempo, en
// SecureStore (en web no existe, ahí va a AsyncStorage).
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { ENDPOINTS } from '../config/api';

const CLAVE_TOKEN = 'userToken';
const CLAVE_VENCE = 'userTokenVence';
const CLAVE_REFRESH = 'userRefreshToken';
const MS_ANTICIPO = 60 * 1000; // Si el token vence en menos de esto, se renueva antes de usarlo

let token; // undefined = todavía no se leyó del almacenamiento
let refreshToken = null;
let venceEn = null; // Segundos desde 1970 (expiresAt del backend)
let cargando = null;
let refrescando = null; // La renovación en curso: los pedidos que llegan mientras tanto la esperan

// ───── SecureStore, con AsyncStorage de respaldo ─────

async function guardarSeguro(clave, valor) {
  try {
    if (valor === null) await SecureStore.deleteItemAsync(clave);
    else await SecureStore.setItemAsync(clave, valor);
    return;
  } catch {
    // Web o SecureStore no disponible
  }
  if (valor === null) await AsyncStorage.removeItem(clave);
  else await AsyncStorage.setItem(clave, valor);
}

async function leerSeguro(clave) {
  try {
    const valor = await SecureStore.getItemAsync(clave);
    if (valor !== null) return valor;
  } catch {
    // Web o SecureStore no disponible
  }
  return AsyncStorage.getItem(clave);
}

// ───── Sesión ─────

// Lee la sesión guardada en el celular (una sola vez)
export function cargarSesion() {
  if (!cargando) {
    cargando = (async () => {
      const [t, vence, refresh] = await Promise.all([AsyncStorage.getItem(CLAVE_TOKEN), AsyncStorage.getItem(CLAVE_VENCE), leerSeguro(CLAVE_REFRESH)]);
      if (token === undefined) {
        token = t;
        venceEn = vence ? Number(vence) : null;
        refreshToken = refresh;
      }
      return { token, refreshToken, venceEn };
    })();
  }
  return cargando;
}

export async function guardarSesion({ token: nuevo, refreshToken: nuevoRefresh, expiresAt }) {
  token = nuevo ?? null;
  venceEn = Number.isFinite(Number(expiresAt)) ? Number(expiresAt) : null;
  // El backend siempre devuelve el refresh token; si un backend viejo no lo manda, se conserva el anterior
  if (nuevoRefresh) refreshToken = nuevoRefresh;
  await Promise.all([
    token ? AsyncStorage.setItem(CLAVE_TOKEN, token) : AsyncStorage.removeItem(CLAVE_TOKEN),
    venceEn ? AsyncStorage.setItem(CLAVE_VENCE, String(venceEn)) : AsyncStorage.removeItem(CLAVE_VENCE),
    nuevoRefresh ? guardarSeguro(CLAVE_REFRESH, nuevoRefresh) : Promise.resolve(),
  ]);
}

export async function borrarSesion() {
  token = null;
  refreshToken = null;
  venceEn = null;
  refrescando = null;
  await Promise.all([AsyncStorage.removeItem(CLAVE_TOKEN), AsyncStorage.removeItem(CLAVE_VENCE), guardarSeguro(CLAVE_REFRESH, null)]);
}

export const hayRefreshToken = () => !!refreshToken;

// Pide un token nuevo con el refresh token. Supabase rota el refresh token: el viejo deja de servir,
// así que dos renovaciones a la vez harían fallar a la segunda. Por eso hay una sola en curso y
// todos los que la necesitan esperan la misma.
// Si la sesión murió (el backend rechaza el refresh token, o no hay), el error trae sesionMuerta = true.
// Un error de red o del servidor no: la sesión sigue y se vuelve a intentar más adelante.
export function refrescarSesion() {
  if (!refrescando) {
    refrescando = (async () => {
      await cargarSesion();
      if (!refreshToken) throw Object.assign(new Error('No hay refresh token'), { sesionMuerta: true });
      const usado = refreshToken;
      try {
        // axios directo y no axiosClient: sus interceptores volverían a llamar acá
        const respuesta = await axios.post(ENDPOINTS.refresh, { refreshToken: usado }, {
          timeout: 10000,
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        const datos = respuesta.data?.data || respuesta.data || {};
        if (!datos.token) throw new Error('El servidor no devolvió un token');
        // Si mientras tanto se cerró la sesión, no se revive
        if (refreshToken !== usado) throw Object.assign(new Error('La sesión cambió'), { sesionMuerta: false });
        await guardarSesion(datos);
        return datos.token;
      } catch (error) {
        const estado = error.response?.status;
        if (estado === 401 || estado === 400) error.sesionMuerta = true;
        throw error;
      }
    })().finally(() => {
      refrescando = null;
    });
  }
  return refrescando;
}

// El token para un pedido. Si está por vencer, se renueva antes; si no se puede (sin internet),
// se usa el que hay y el backend dirá si sigue sirviendo.
export async function obtenerToken() {
  await cargarSesion();
  if (token && refreshToken && venceEn && venceEn * 1000 - Date.now() < MS_ANTICIPO) {
    try {
      return await refrescarSesion();
    } catch {
      return token;
    }
  }
  return token;
}

// Qué hacer cuando la sesión murió. AuthContext lo registra al montarse.
// Vive acá y no en AuthContext para que axiosClient no tenga que importar el contexto:
// AuthContext -> perfilesService -> axiosClient -> AuthContext formaba un ciclo de imports.
let alExpirarSesion = null;

export function registrarAlExpirarSesion(funcion) {
  alExpirarSesion = funcion;
}

export async function avisarSesionExpirada() {
  if (typeof alExpirarSesion === 'function') await alExpirarSesion();
}
