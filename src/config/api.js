// Reemplazar por IP de la compu de cada uno
//const BASE_URL = 'http://192.168.1.230:3000/api'; // IP gasti
//const BASE_URL = ''; // NGROK GASTI
const BASE_URL = 'https://hacksaw-cadet-alright.ngrok-free.dev/api'; // NGROK FEDE

export const ENDPOINTS = {
  BASE_URL: BASE_URL,
  login: '/cuentas/login',
  register: '/cuentas/registrar',
  crearPerfil: '/perfiles',
  obtenerPerfiles: '/perfiles',
  lecciones: (perfilId) => `/cursos/guitarra/progreso/${perfilId}`
}
  // A medida que hagamos más pantallas, agregaremos las rutas acá