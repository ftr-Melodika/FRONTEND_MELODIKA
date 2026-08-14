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
  
  crearPerfil: async (datosPerfil) => {
    try {
      const response = await axiosClient.post(ENDPOINTS.crearPerfil, datosPerfil);
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // 👇 AGREGAMOS ESTO: Método encargado de editar un perfil
  editarPerfil: async (id, datosActualizados) => {
    try {
      // Concatenamos el ID a la URL base: ej. /perfiles/5
      const response = await axiosClient.put(`${ENDPOINTS.obtenerPerfiles}/${id}`, datosActualizados);
      return response.data.data; 
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // 👇 AGREGAMOS ESTO: Método encargado de eliminar un perfil
  eliminarPerfil: async (id) => {
    try {
      const response = await axiosClient.delete(`${ENDPOINTS.obtenerPerfiles}/${id}`);
      return response.data; 
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  editarPerfil: async (id, datosActualizados) => {
    try {
      const response = await axiosClient.put(ENDPOINTS.perfilPorId(id), datosActualizados);
      return response.data.data; 
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
  }
};