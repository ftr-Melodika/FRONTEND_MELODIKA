// Archivo: src/services/cancionesService.js
// Las canciones de la sección Práctica, con acordes, rasgueo, tempo y capo (ver utils/canciones.js).
import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/api';
import { pedir } from '../api/pedir';

export const cancionesService = {
  listar: async () => (await pedir(() => axiosClient.get(ENDPOINTS.canciones))) ?? [],

  obtener: async (id) => (await pedir(() => axiosClient.get(ENDPOINTS.cancion(id)))) ?? null,
};
