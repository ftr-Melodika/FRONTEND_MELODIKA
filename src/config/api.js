// Reemplazar por IP de la compu de cada uno
//const BASE_URL = 'http://192.168.0.232:3000/api'; // IP gasti
//const BASE_URL = 'https://corroding-confused-polka.ngrok-free.dev/api'; // ngrok gasti
//const BASE_URL = 'https://hacksaw-cadet-alright.ngrok-free.dev/api'; // Ngrok Juanma
const BASE_URL = 'https://national-retake-exquisite.ngrok-free.dev' //IP IVO
export const ENDPOINTS = {
  login: `${BASE_URL}/cuentas/login`,
  register: `${BASE_URL}/cuentas/registrar`,
  crearPerfil: `${BASE_URL}/perfiles`,
  obtenerPerfiles: `${BASE_URL}/perfiles`,
  perfilPorId: (id) => `${BASE_URL}/perfiles/${id}`,
  racha: (id) => `${BASE_URL}/perfiles/${id}/racha`,
  lecciones: (perfilId) => `${BASE_URL}/cursos/guitarra/progreso/${perfilId}`,
};
  // A medida que hagamos más pantallas, agregaremos las rutas acá