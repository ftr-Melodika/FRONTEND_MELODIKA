// Archivo: src/services/cancionesService.js
// Las canciones de la sección Práctica, con acordes, rasgueo, tempo y capo (ver utils/canciones.js).
import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/api';
import { pedir, modificar } from '../api/pedir';
import { estrellasPorCancion } from '../utils/canciones';

export const cancionesService = {
  listar: async () => (await pedir(() => axiosClient.get(ENDPOINTS.canciones))) ?? [],

  obtener: async (id) => (await pedir(() => axiosClient.get(ENDPOINTS.cancion(id)))) ?? null,

  // Los ids de las canciones que el perfil marcó como favoritas
  favoritas: async (perfilId) => (await pedir(() => axiosClient.get(ENDPOINTS.cancionesFavoritas(perfilId)))) ?? [],

  marcarFavorita: (perfilId, id) => modificar(() => axiosClient.post(ENDPOINTS.cancionFavorita(perfilId, id)), 'cancionesFavoritas'),

  // { idDeLaCancion: 1 a 3 }: solo las canciones que ya se tocaron
  estrellas: async (perfilId) => estrellasPorCancion(await pedir(() => axiosClient.get(ENDPOINTS.cancionesEstrellas(perfilId)))),

  // El backend se queda con el mejor resultado de cada canción
  guardarEstrellas: (perfilId, id, estrellas) =>
    modificar(() => axiosClient.put(ENDPOINTS.cancionEstrellas(perfilId, id), { estrellas }), 'cancionesEstrellas'),

  quitarFavorita: (perfilId, id) => modificar(() => axiosClient.delete(ENDPOINTS.cancionFavorita(perfilId, id)), 'cancionesFavoritas'),
};
