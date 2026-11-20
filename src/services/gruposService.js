// Archivo: src/services/gruposService.js
// Grupos y sus mensajes. miPerfilId es siempre el perfil activo.
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

export const gruposService = {
  misGrupos: async (miPerfilId) =>
    (await pedir(() => axiosClient.get(`${ENDPOINTS.grupos(miPerfilId)}/mios`))) || [],

  buscar: async (miPerfilId, texto) =>
    (await pedir(() => axiosClient.get(`${ENDPOINTS.grupos(miPerfilId)}/buscar`, { params: { q: texto } }))) || [],

  // datos: { nombre, descripcion, miembroIds?, esPrivado? } (miembroIds: ids de amigos aceptados)
  // Un grupo privado vuelve con su código (8 letras o números) en `codigo`
  crear: (miPerfilId, datos) =>
    pedir(() => axiosClient.post(ENDPOINTS.grupos(miPerfilId), datos)),

  obtener: (miPerfilId, grupoId) =>
    pedir(() => axiosClient.get(ENDPOINTS.grupo(miPerfilId, grupoId))),

  // codigo: solo para grupos privados. Devuelve { grupoId, unido, grupo }
  unirse: (miPerfilId, grupoId, codigo) =>
    pedir(() => axiosClient.post(`${ENDPOINTS.grupo(miPerfilId, grupoId)}/unirse`, codigo ? { codigo } : undefined)),

  // Entrar a un grupo privado sabiendo solo su código. Devuelve { grupoId, unido, grupo }
  unirseConCodigo: (miPerfilId, codigo) =>
    pedir(() => axiosClient.post(`${ENDPOINTS.grupos(miPerfilId)}/unirse-con-codigo`, { codigo })),

  salir: (miPerfilId, grupoId) =>
    pedir(() => axiosClient.delete(`${ENDPOINTS.grupo(miPerfilId, grupoId)}/salir`)),

  // params: { despues } para los nuevos, { antes } para la página anterior, o nada para los últimos
  mensajes: async (miPerfilId, grupoId, params) => {
    const data = await pedir(() => axiosClient.get(`${ENDPOINTS.grupo(miPerfilId, grupoId)}/mensajes`, { params }));
    return { mensajes: data?.mensajes || [], hayMasAnteriores: !!data?.hayMasAnteriores };
  },

  enviarMensaje: (miPerfilId, grupoId, contenido) =>
    pedir(() => axiosClient.post(`${ENDPOINTS.grupo(miPerfilId, grupoId)}/mensajes`, { contenido })),
};
