// Archivo: src/services/cancionesService.js
// Las canciones de la sección Práctica, con acordes, rasgueo, tempo y capo (ver utils/canciones.js).
import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/api';
import { getErrorMessage } from '../utils/errorUtils';

export const cancionesService = {
  listar: async () => {
    try {
      const response = await axiosClient.get(ENDPOINTS.canciones);
      return response.data?.data ?? [];
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  obtener: async (id) => {
    try {
      const response = await axiosClient.get(ENDPOINTS.cancion(id));
      return response.data?.data ?? null;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
