// Archivo: src/services/amistadesService.js
// Perfiles de otros usuarios, solicitudes de amistad y amigos.
// miPerfilId es siempre el perfil activo: el backend valida que sea de la cuenta logueada.
import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/api';
import { getErrorMessage } from '../utils/errorUtils';
import { invalidar } from '../api/queryClient';

// Para lo que cambia datos: después de que sale bien, las solicitudes y los amigos en caché vencen
async function modificar(llamada) {
  const datos = await pedir(llamada);
  invalidar('solicitudes', 'amigos');
  return datos;
}

async function pedir(llamada) {
  try {
    const response = await llamada();
    return response.data?.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export const amistadesService = {
  obtenerPerfil: (miPerfilId, otroId) =>
    pedir(() => axiosClient.get(ENDPOINTS.perfilSocial(miPerfilId, otroId))),

  enviarSolicitud: (miPerfilId, destinoId) =>
    modificar(() => axiosClient.post(ENDPOINTS.solicitudes(miPerfilId), { destinoId })),

  // Por username exacto (sin @) o por el token de un link de invitación
  enviarSolicitudPorUsername: (miPerfilId, username) =>
    modificar(() => axiosClient.post(ENDPOINTS.solicitudes(miPerfilId), { username })),

  enviarSolicitudPorToken: (miPerfilId, token) =>
    modificar(() => axiosClient.post(ENDPOINTS.solicitudes(miPerfilId), { token })),

  // Mi link: { token, url }
  obtenerInvitacion: (miPerfilId) =>
    pedir(() => axiosClient.get(ENDPOINTS.invitacion(miPerfilId))),

  regenerarInvitacion: (miPerfilId) =>
    pedir(() => axiosClient.post(ENDPOINTS.invitacionRegenerar(miPerfilId))),

  // Quién invita y cuál es la relación actual: { perfil, relacion }
  resolverInvitacion: (miPerfilId, token) =>
    pedir(() => axiosClient.get(ENDPOINTS.invitacionPorToken(miPerfilId, token))),

  obtenerSolicitudes: async (miPerfilId) => {
    const data = await pedir(() => axiosClient.get(ENDPOINTS.solicitudes(miPerfilId)));
    return { recibidas: data?.recibidas || [], enviadas: data?.enviadas || [] };
  },

  // accion: 'aceptar' | 'rechazar'
  responderSolicitud: (miPerfilId, amistadId, accion) =>
    modificar(() => axiosClient.put(ENDPOINTS.solicitud(miPerfilId, amistadId), { accion })),

  // Cancela una solicitud enviada o elimina una amistad
  eliminarAmistad: (miPerfilId, amistadId) =>
    modificar(() => axiosClient.delete(ENDPOINTS.amistad(miPerfilId, amistadId))),

  obtenerAmigos: async (miPerfilId) => {
    const data = await pedir(() => axiosClient.get(ENDPOINTS.amigos(miPerfilId)));
    return data || [];
  },
};
