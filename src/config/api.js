// Reemplazar por IP de la compu de cada uno
//const BASE_URL = 'http://192.168.0.232:3000/api'; // IP gasti
//const BASE_URL = 'https://compile-upturned-greedily.ngrok-free.dev/api'; // Ngrok Juanma
const BASE_URL = 'https://ngrokhq.link/video' //IP IVO
export const ENDPOINTS = {
  login: `${BASE_URL}/cuentas/login`,
  register: `${BASE_URL}/cuentas/registro`,
  crearPerfil: `${BASE_URL}/perfiles`,
  obtenerPerfiles: `${BASE_URL}/perfiles`,
  lecciones: (perfilId) => `${BASE_URL}/cursos/guitarra/progreso/${perfilId}` // ver cursos segun el perfil
}
  // A medida que hagamos más pantallas, agregaremos las rutas acá