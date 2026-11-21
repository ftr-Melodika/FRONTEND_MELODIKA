// Archivo: src/services/mensajesService.js
// Feedback, reportes de errores y consultas de contacto.
import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/api';
import { getErrorMessage } from '../utils/errorUtils';

export const mensajesService = {
  // tipo: 'feedback' | 'reporte_error' | 'contacto'
  enviar: async (perfilId, { tipo, categoria, mensaje, nombre, email }) => {
    try {
      const body = { tipo, categoria, mensaje };
      if (nombre) body.nombre = nombre;
      if (email) body.email = email;
      const response = await axiosClient.post(ENDPOINTS.mensajes(perfilId), body);
      return response.data?.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
