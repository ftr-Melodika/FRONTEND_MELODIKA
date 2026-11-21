// Archivo: src/services/gruposService.js
// Grupos y sus mensajes. miPerfilId es siempre el perfil activo.
import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/api';
import { pedir, modificar } from '../api/pedir';

export const gruposService = {
  misGrupos: async (miPerfilId) =>
    (await pedir(() => axiosClient.get(`${ENDPOINTS.grupos(miPerfilId)}/mios`))) || [],

  buscar: async (miPerfilId, texto) =>
    (await pedir(() => axiosClient.get(`${ENDPOINTS.grupos(miPerfilId)}/buscar`, { params: { q: texto } }))) || [],

  // datos: { nombre, descripcion, miembroIds?, esPrivado? } (miembroIds: ids de amigos aceptados)
  // Un grupo privado vuelve con su código (8 letras o números) en `codigo`
  crear: (miPerfilId, datos) =>
    modificar(() => axiosClient.post(ENDPOINTS.grupos(miPerfilId), datos), 'misGrupos'),

  obtener: (miPerfilId, grupoId) =>
    pedir(() => axiosClient.get(ENDPOINTS.grupo(miPerfilId, grupoId))),

  // codigo: solo para grupos privados. Devuelve { grupoId, unido, grupo }
  unirse: (miPerfilId, grupoId, codigo) =>
    modificar(() => axiosClient.post(`${ENDPOINTS.grupo(miPerfilId, grupoId)}/unirse`, codigo ? { codigo } : undefined), 'misGrupos'),

  // Entrar a un grupo privado sabiendo solo su código. Devuelve { grupoId, unido, grupo }
  unirseConCodigo: (miPerfilId, codigo) =>
    modificar(() => axiosClient.post(`${ENDPOINTS.grupos(miPerfilId)}/unirse-con-codigo`, { codigo }), 'misGrupos'),

  salir: (miPerfilId, grupoId) =>
    modificar(() => axiosClient.delete(`${ENDPOINTS.grupo(miPerfilId, grupoId)}/salir`), 'misGrupos', 'rankings', 'rankingGrupo'),

  // params: { despues } para los nuevos, { antes } para la página anterior, o nada para los últimos
  mensajes: async (miPerfilId, grupoId, params) => {
    const data = await pedir(() => axiosClient.get(`${ENDPOINTS.grupo(miPerfilId, grupoId)}/mensajes`, { params }));
    return { mensajes: data?.mensajes || [], hayMasAnteriores: !!data?.hayMasAnteriores };
  },

  enviarMensaje: (miPerfilId, grupoId, contenido) =>
    modificar(() => axiosClient.post(`${ENDPOINTS.grupo(miPerfilId, grupoId)}/mensajes`, { contenido }), 'misGrupos'),
};
