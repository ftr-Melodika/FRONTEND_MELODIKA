// Archivo: src/services/mensajesService.js
// Feedback, reportes de errores y consultas de contacto.
import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/api';
import { pedir } from '../api/pedir';

export const mensajesService = {
  // tipo: 'feedback' | 'reporte_error' | 'contacto'
  enviar: (perfilId, { tipo, categoria, mensaje, nombre, email }) => {
    const body = { tipo, categoria, mensaje };
    if (nombre) body.nombre = nombre;
    if (email) body.email = email;
    return pedir(() => axiosClient.post(ENDPOINTS.mensajes(perfilId), body));
  },
};
