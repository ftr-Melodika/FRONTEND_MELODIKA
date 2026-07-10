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
      // Identificamos si es un problema de token vencido (401 o 403)
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        error.isAuthError = true;
        throw error; // Lanzamos el error para que la pantalla cierre la sesión
      }
      
      // Si es otro tipo de error, lo traducimos normalmente
      throw new Error(getErrorMessage(error));
    }
  }
};