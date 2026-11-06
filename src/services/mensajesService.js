// Archivo: src/services/mensajesService.js
// Feedback, reportes de errores y consultas de contacto.
import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/api';
import { getErrorMessage } from '../utils/errorUtils';

export const mensajesService = {
  // tipo: 'feedback' | 'reporte_error' | 'contacto'
  enviar: async (perfilId, { tipo, categoria, mensaje }) => {
    try {
      const response = await axiosClient.post(ENDPOINTS.mensajes(perfilId), { tipo, categoria, mensaje });
      return response.data?.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
