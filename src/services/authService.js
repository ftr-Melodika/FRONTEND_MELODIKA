// Archivo: src/services/authService.js
import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/api';
import { getErrorMessage } from '../utils/errorUtils';

export const authService = {
  login: async (email, password) => {
    try {
      const response = await axiosClient.post(ENDPOINTS.login, { email, password });
      // El backend responde { success, message, data: { token, refreshToken, expiresAt, cuenta } }
      const { token, refreshToken, expiresAt, cuenta } = response.data?.data || response.data || {};
      if (!token) throw new Error('El servidor no devolvió un token de sesión.');
      return { token, refreshToken, expiresAt, cuenta };
    } catch (error) {
      // Atrapamos el error crudo, lo traducimos y lo volvemos a lanzar
      throw new Error(getErrorMessage(error));
    }
  },

  cambiarPassword: async (passwordActual, passwordNueva) => {
    try {
      await axiosClient.put(ENDPOINTS.cambiarPassword, { passwordActual, passwordNueva });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Borra la cuenta con todos sus perfiles y datos. Con email hace falta la contraseña; con Google no.
  eliminarCuenta: async (password) => {
    try {
      await axiosClient.delete(ENDPOINTS.eliminarCuenta, { data: password ? { password } : {} });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  registrar: async (nombre, apellido, telefono, email, password) => {
    try {
      const response = await axiosClient.post(ENDPOINTS.register, {
        nombre: nombre,
        apellido: apellido,
        telefono: telefono,
        email: email,
        password: password,
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
};