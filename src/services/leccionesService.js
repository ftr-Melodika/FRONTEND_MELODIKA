// Archivo: src/services/leccionesService.js
import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/api';
import { getErrorMessage } from '../utils/errorUtils';

// Mudamos el MOCK acá adentro, la vista no necesita saber que existe
const MOCK_LECCIONES = [
  { 
    id: 1, titulo: 'Afinación Básica', tipo: 'Teoría', estado: 'completada', xp: 50,
    videoId: "6yKz57b0wG8",
    instrucciones: ["Mirá el video para entender cómo usar la clavija.", "La cuerda más fina (abajo) es la 1ra (Mi).", "Tocala al aire (sin pisar) hasta que afine."],
    textoTeoria: "La afinación estándar va de la 1ra a la 6ta cuerda: Mi, Si, Sol, Re, La, Mi.",
    textoDestacado: "Hoy vamos a afinar la 1ra cuerda al aire.",
    trasteObjetivo: "0", dotLeft: "46%", dotBottom: "10%" 
  },
  { 
    id: 2, titulo: 'Primeros Acordes', tipo: 'Práctica', estado: 'disponible', xp: 100,
    videoId: "bbzB5qR6N4c",
    instrucciones: ["Fijate cómo el profe posiciona la mano en forma de 'C'.", "Tratemos de pisar la 1ra cuerda en el traste 3.", "¡Tocá fuerte y claro!"],
    textoTeoria: "El traste 3 de la 1ra cuerda nos da la nota Sol.",
    textoDestacado: "Pisá el 3er espacio con tu dedo anular.",
    trasteObjetivo: "3", dotLeft: "46%", dotBottom: "76%" 
  },
  { id: 3, titulo: 'Ritmo de Fogón', tipo: 'Práctica', estado: 'bloqueada', xp: 150 },
  { id: 4, titulo: 'Tu primer Canción', tipo: 'Canción', estado: 'bloqueada', xp: 200 }
];

export const leccionesService = {
  obtenerLecciones: async (perfilId) => {
    try {
      const response = await axiosClient.get(ENDPOINTS.lecciones(perfilId));
      const data = response.data;
      let leccionesDesdeBD = Array.isArray(data) ? data : (data.data || []);
      
      // Si la base de datos responde pero está vacía, devolvemos el MOCK para poder maquetar
      if (leccionesDesdeBD.length === 0) {
        return MOCK_LECCIONES;
      }
      
      return leccionesDesdeBD;
    } catch (error) {
      console.log('Error cargando lecciones en el servicio:', getErrorMessage(error));
      // Si el servidor falla, también devolvemos el MOCK
      return MOCK_LECCIONES;
    }
  }
};