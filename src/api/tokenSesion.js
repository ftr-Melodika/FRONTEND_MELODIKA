// Archivo: src/api/tokenSesion.js
// El token de la sesión, guardado también en memoria. Leer AsyncStorage en cada pedido al backend
// es lento en Android: ahora se lee una sola vez y AuthContext lo mantiene al día.
import AsyncStorage from '@react-native-async-storage/async-storage';

let token; // undefined = todavía no se leyó del almacenamiento

export async function obtenerToken() {
  if (token === undefined) token = await AsyncStorage.getItem('userToken');
  return token;
}

export function recordarToken(nuevo) {
  token = nuevo ?? null;
}

// Qué hacer cuando el backend avisa que la sesión expiró (401). AuthContext lo registra al montarse.
// Vive acá y no en AuthContext para que axiosClient no tenga que importar el contexto:
// AuthContext -> perfilesService -> axiosClient -> AuthContext formaba un ciclo de imports.
let alExpirarSesion = null;

export function registrarAlExpirarSesion(funcion) {
  alExpirarSesion = funcion;
}

export async function avisarSesionExpirada() {
  if (typeof alExpirarSesion === 'function') await alExpirarSesion();
}
