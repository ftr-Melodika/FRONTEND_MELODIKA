// Reemplazar por IP de la compu de cada uno
//const BASE_URL = 'http://192.168.1.230:3000/api'; // IP gasti
const BASE_URL = 'http://172.23.112.1:3000/api'; // IP compu ort (cambiante)

export const ENDPOINTS = {
  login: `${BASE_URL}/cuentas/login`,
  register: `${BASE_URL}/cuentas/registrar`,
  crearPerfil: `${BASE_URL}/perfiles`,
  obtenerPerfiles: `${BASE_URL}/perfiles`,
  lecciones: (perfilId) => `${BASE_URL}/cursos/guitarra/progreso/${perfilId}` // ver cursos segun el perfil
}
  // A medida que hagamos más pantallas, agregaremos las rutas acá