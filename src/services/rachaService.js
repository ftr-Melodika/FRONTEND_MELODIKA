// Archivo: src/services/rachaService.js
import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/api';
import { getErrorMessage } from '../utils/errorUtils';

export const rachaService = {
  // Le pide al backend que revise/actualice la racha de un perfil.
  // El backend es el único que decide si la racha sube, se mantiene o se reinicia,
  // y si corresponde mostrar la animación (mostrarAnimacion).
  chequearRacha: async (perfilId) => {
    try {
      const response = await axiosClient.post(ENDPOINTS.racha(perfilId));
      // El controller responde { success: true, data: { exito, mostrarAnimacion, rachaAnterior, rachaActual, mensaje } }
      return response.data.data;
    } catch (error) {
      console.log('Error chequeando la racha:', getErrorMessage(error));
      // Si falla, devolvemos un resultado neutro para no romper el flujo de "Terminar lección".
      return { exito: false, mostrarAnimacion: false };
    }
  }
};