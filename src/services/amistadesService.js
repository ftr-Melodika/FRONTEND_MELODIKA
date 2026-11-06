// Archivo: src/services/amistadesService.js
// Perfiles de otros usuarios, solicitudes de amistad y amigos.
// miPerfilId es siempre el perfil activo: el backend valida que sea de la cuenta logueada.
import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/api';
import { getErrorMessage } from '../utils/errorUtils';

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
    pedir(() => axiosClient.post(ENDPOINTS.solicitudes(miPerfilId), { destinoId })),

  obtenerSolicitudes: async (miPerfilId) => {
    const data = await pedir(() => axiosClient.get(ENDPOINTS.solicitudes(miPerfilId)));
    return { recibidas: data?.recibidas || [], enviadas: data?.enviadas || [] };
  },

  // accion: 'aceptar' | 'rechazar'
  responderSolicitud: (miPerfilId, amistadId, accion) =>
    pedir(() => axiosClient.put(ENDPOINTS.solicitud(miPerfilId, amistadId), { accion })),

  // Cancela una solicitud enviada o elimina una amistad
  eliminarAmistad: (miPerfilId, amistadId) =>
    pedir(() => axiosClient.delete(ENDPOINTS.amistad(miPerfilId, amistadId))),

  obtenerAmigos: async (miPerfilId) => {
    const data = await pedir(() => axiosClient.get(ENDPOINTS.amigos(miPerfilId)));
    return data || [];
  },
};
