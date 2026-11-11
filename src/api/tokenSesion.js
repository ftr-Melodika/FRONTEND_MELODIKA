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
