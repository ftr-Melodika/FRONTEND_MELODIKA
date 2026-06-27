// Reemplazar por IP de la compu de cada uno
const BASE_URL = 'http://192.168.0.232:3000/api'; // IP gasti

export const ENDPOINTS = {
  login: `${BASE_URL}/cuentas/login`,
  register: `${BASE_URL}/cuentas/registro`,
  crearPerfil: `${BASE_URL}/perfiles`,
  obtenerPerfiles: `${BASE_URL}/perfiles`,
  lecciones: (perfilId) => `${BASE_URL}/cursos/guitarra/progreso/${perfilId}` // ver cursos segun el perfil
}
  // A medida que hagamos más pantallas, agregaremos las rutas acá