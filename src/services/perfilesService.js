// Archivo: src/services/perfilesService.js
import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/api';
import { getErrorMessage } from '../utils/errorUtils';

// El backend devuelve la entidad Perfil en camelCase (avatarUrl, fechaNacimiento...).
// Normalizamos acá para que las pantallas siempre lean los mismos nombres.
export function normalizarPerfil(perfil) {
  if (!perfil) return null;
  const fecha = perfil.fechaNacimiento ?? perfil.fecha_nacimiento ?? null;
  return {
    ...perfil,
    avatarUrl: perfil.avatarUrl ?? perfil.avatar_url ?? perfil.foto ?? null,
    // La BD devuelve un timestamp; nos quedamos con AAAA-MM-DD
    fechaNacimiento: fecha ? String(fecha).slice(0, 10) : null,
    xp: Number(perfil.xp) || 0,
    racha: Number(perfil.racha) || 0,
  };
}

// Traduce los datos del formulario a lo que espera el backend
function aBodyBackend(datos) {
  const { foto, avatarUrl, fechaNacimiento, fecha_nacimiento, ...resto } = datos;
  return {
    ...resto,
    avatarUrl: avatarUrl ?? foto ?? null,
    fecha_nacimiento: fecha_nacimiento ?? fechaNacimiento ?? null,
  };
}

export const perfilesService = {
  obtenerPerfiles: async () => {
    try {
      const response = await axiosClient.get(ENDPOINTS.obtenerPerfiles);
      // Si la cuenta no tiene perfiles, el backend devuelve data: null
      const lista = response.data?.data || [];
      return lista.map(normalizarPerfil);
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        error.isAuthError = true;
        throw error;
      }
      throw new Error(getErrorMessage(error));
    }
  },

  // Vuelve a pedir un perfil para refrescar XP y racha
  obtenerPerfil: async (id) => {
    try {
      const response = await axiosClient.get(ENDPOINTS.perfilPorId(id));
      return normalizarPerfil(response.data.data);
    } catch (error) {
      // Backend viejo sin GET /perfiles/:id: lo buscamos en la lista
      if (error.response?.status === 404) {
        const perfiles = await perfilesService.obtenerPerfiles();
        return perfiles.find((p) => p.id === id) || null;
      }
      throw new Error(getErrorMessage(error));
    }
  },

  crearPerfil: async (datosPerfil) => {
    try {
      const response = await axiosClient.post(ENDPOINTS.crearPerfil, aBodyBackend(datosPerfil));
      return normalizarPerfil(response.data.data);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  editarPerfil: async (id, datosActualizados) => {
    try {
      const response = await axiosClient.put(ENDPOINTS.perfilPorId(id), aBodyBackend(datosActualizados));
      return normalizarPerfil(response.data.data);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  eliminarPerfil: async (id) => {
    try {
      const response = await axiosClient.delete(ENDPOINTS.perfilPorId(id));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  obtenerRanking: async () => {
    try {
      const response = await axiosClient.get(ENDPOINTS.ranking);
      return response.data?.data?.ranking || [];
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
