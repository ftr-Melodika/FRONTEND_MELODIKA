// Archivo: src/services/rankingsService.js
// Rankings de grupo: alguien invita al grupo y cada miembro entra al aceptar. miPerfilId es el perfil activo.
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

export const rankingsService = {
  // Rankings en los que participo: [{ grupoId, grupoNombre, totalParticipantes, miPosicion }]
  misRankings: async (miPerfilId) =>
    (await pedir(() => axiosClient.get(ENDPOINTS.rankings(miPerfilId)))) || [],

  // { activo, unido, participantes: [{ id, username, avatar_url, xp, racha, posicion }] }
  // "activo" es false si en el grupo todavía nadie creó un ranking
  deGrupo: async (miPerfilId, grupoId) => {
    const data = await pedir(() => axiosClient.get(ENDPOINTS.rankingGrupo(miPerfilId, grupoId)));
    return {
      activo: !!data?.activo,
      unido: !!data?.unido,
      participantes: data?.participantes || data?.ranking || [],
    };
  },

  // Crea el ranking del grupo, suma a quien invita y manda la invitación al chat
  invitar: (miPerfilId, grupoId) =>
    pedir(() => axiosClient.post(ENDPOINTS.rankingGrupo(miPerfilId, grupoId))),

  aceptar: (miPerfilId, grupoId) =>
    pedir(() => axiosClient.post(`${ENDPOINTS.rankingGrupo(miPerfilId, grupoId)}/aceptar`)),

  salir: (miPerfilId, grupoId) =>
    pedir(() => axiosClient.delete(`${ENDPOINTS.rankingGrupo(miPerfilId, grupoId)}/salir`)),
};
