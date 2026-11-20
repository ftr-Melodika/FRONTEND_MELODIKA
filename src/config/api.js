// Reemplazar por la URL del backend de cada uno (SIEMPRE terminando en /api)
//const SERVER_URL = 'http://192.168.0.232:3000/api'; // IP gasti
//const SERVER_URL = 'https://corroding-confused-polka.ngrok-free.dev/api'; // ngrok gasti
const SERVER_URL = 'https://compile-upturned-greedily.ngrok-free.dev/api'; // Ngrok Juanma
//const SERVER_URL = 'https://national-retake-exquisite.ngrok-free.dev/api'; // IP IVO

export const BASE_URL = `${SERVER_URL}`;

export const ENDPOINTS = {
  // Cuentas
  login: `${BASE_URL}/cuentas/login`,
  refresh: `${BASE_URL}/cuentas/refresh`,
  register: `${BASE_URL}/cuentas/registrar`,

  // Perfiles
  crearPerfil: `${BASE_URL}/perfiles`,
  obtenerPerfiles: `${BASE_URL}/perfiles`,
  perfilPorId: (id) => `${BASE_URL}/perfiles/${id}`,
  racha: (id) => `${BASE_URL}/perfiles/${id}/racha`,
  mensajes: (id) => `${BASE_URL}/perfiles/${id}/mensajes`,

  // Social (id = perfil activo)
  perfilSocial: (id, otroId) => `${BASE_URL}/perfiles/${id}/social/${otroId}`,
  solicitudes: (id) => `${BASE_URL}/perfiles/${id}/solicitudes`,
  solicitud: (id, amistadId) => `${BASE_URL}/perfiles/${id}/solicitudes/${amistadId}`,
  amistad: (id, amistadId) => `${BASE_URL}/perfiles/${id}/amistades/${amistadId}`,
  amigos: (id) => `${BASE_URL}/perfiles/${id}/amigos`,
  grupos: (id) => `${BASE_URL}/perfiles/${id}/grupos`,
  grupo: (id, grupoId) => `${BASE_URL}/perfiles/${id}/grupos/${grupoId}`,

  // Rankings: uno por grupo, al que cada miembro entra aceptando la invitación
  rankings: (id) => `${BASE_URL}/perfiles/${id}/rankings`,
  rankingGrupo: (id, grupoId) => `${BASE_URL}/perfiles/${id}/grupos/${grupoId}/ranking`,

  // Cursos
  cursos: (perfilId) => `${BASE_URL}/cursos/perfil/${perfilId}`,
  progreso: (perfilId) => `${BASE_URL}/cursos/perfil/${perfilId}/progreso`,
  cursoDetalle:(perfilId, cursoId) => `${BASE_URL}/cursos/perfil/${perfilId}/curso/${cursoId}`,
  completarLeccion: (perfilId, cursoId, leccionId) =>
    `${BASE_URL}/cursos/perfil/${perfilId}/curso/${cursoId}/lecciones/${leccionId}/completar`,
  completarCurso: (perfilId, cursoId) => `${BASE_URL}/cursos/perfil/${perfilId}/curso/${cursoId}/completar`,
};
