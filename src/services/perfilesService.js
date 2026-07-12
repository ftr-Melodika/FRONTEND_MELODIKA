// Archivo: src/services/perfilesService.js
import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/api';
import { getErrorMessage } from '../utils/errorUtils';

export const perfilesService = {
  obtenerPerfiles: async () => {
    try {
      const response = await axiosClient.get(ENDPOINTS.obtenerPerfiles);
      return response.data.data;
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        error.isAuthError = true;
        throw error;
      }
      throw new Error(getErrorMessage(error));
    }
  },

  // 👇 Nuevo método encargado de la creación
  crearPerfil: async (datosPerfil) => {
    try {
      const response = await axiosClient.post(ENDPOINTS.crearPerfil, datosPerfil);
      return response.data.data;
    } catch (error) {
      // Usamos tu utility para traducir el error del backend
      throw new Error(getErrorMessage(error));
    }
  }
};