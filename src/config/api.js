// Reemplazar por la URL del backend de cada uno (SIEMPRE terminando en /api)
//const SERVER_URL = 'http://192.168.0.232:3000'; // IP gasti
//const SERVER_URL = 'https://corroding-confused-polka.ngrok-free.dev'; // ngrok gasti
const SERVER_URL = 'https://compile-upturned-greedily.ngrok-free.dev/api'; // Ngrok Juanma
//const SERVER_URL = 'https://national-retake-exquisite.ngrok-free.dev'; // IP IVO

export const BASE_URL = `${SERVER_URL}`;

export const ENDPOINTS = {
  // Cuentas
  login: `${BASE_URL}/cuentas/login`,
  register: `${BASE_URL}/cuentas/registrar`,

  // Perfiles
  crearPerfil: `${BASE_URL}/perfiles`,
  obtenerPerfiles: `${BASE_URL}/perfiles`,
  perfilPorId: (id) => `${BASE_URL}/perfiles/${id}`,
  racha: (id) => `${BASE_URL}/perfiles/${id}/racha`,
  ranking: `${BASE_URL}/perfiles/ranking`,

  // Cursos
  cursos: (perfilId) => `${BASE_URL}/cursos/perfil/${perfilId}`,
  progreso: (perfilId) => `${BASE_URL}/cursos/perfil/${perfilId}/progreso`,
  cursoDetalle:(perfilId, cursoId) => `${BASE_URL}/cursos/perfil/${perfilId}/curso/${cursoId}`,
  completarLeccion: (perfilId, cursoId, leccionId) =>
    `${BASE_URL}/cursos/perfil/${perfilId}/curso/${cursoId}/lecciones/${leccionId}/completar`,
  completarCurso: (perfilId, cursoId) => `${BASE_URL}/cursos/perfil/${perfilId}/curso/${cursoId}/completar`,
};
