// Archivo: src/services/leccionesService.js
import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../config/api';
import { getErrorMessage } from '../utils/errorUtils';

// Datos de respaldo: solo se usan si el backend no responde o todavía no tiene cursos cargados,
// para que la app se pueda mostrar igual. Están marcados con esMock para no mandarlos al backend.
const MOCK_CURSO = { id: 'mock', nombre: 'Guitarra Inicial', nivel: 'Principiante', orden: 1, completado: false, desbloqueado: true, esMock: true };

const MOCK_LECCIONES = [
  {
    id: 'mock-1', cursoId: 'mock', orden: 1, titulo: 'Afinación Básica', tipo: 'Teoría', estado: 'completada', xp: 50,
    videoId: '6yKz57b0wG8',
    instrucciones: ['Mirá el video para entender cómo usar la clavija.', 'La cuerda más fina (abajo) es la 1ra (Mi).', 'Tocala al aire (sin pisar) hasta que afine.'],
    textoTeoria: 'La afinación estándar va de la 1ra a la 6ta cuerda: Mi, Si, Sol, Re, La, Mi.',
    textoDestacado: 'Vamos a tocar las 6 cuerdas al aire, de la más gruesa a la más fina.',
    cuerda: 6, trasteObjetivo: 0,
    // Varias consignas en un mismo ejercicio: cuerda/trasteObjetivo repiten el primer paso para clientes viejos
    practica: {
      tipo: 'secuencia',
      pasos: [6, 5, 4, 3, 2, 1].map((cuerda) => ({ tipo: 'nota', posiciones: [{ cuerda, traste: 0 }] })),
    },
  },
  {
    id: 'mock-2', cursoId: 'mock', orden: 2, titulo: 'Primeros Acordes', tipo: 'Práctica', estado: 'disponible', xp: 100,
    videoId: 'bbzB5qR6N4c',
    instrucciones: ["Fijate cómo el profe posiciona la mano en forma de 'C'.", 'Tratemos de pisar la 1ra cuerda en el traste 3.', '¡Tocá fuerte y claro!'],
    textoTeoria: 'El traste 3 de la 1ra cuerda nos da la nota Sol.',
    textoDestacado: 'Mi al aire, Fa con el índice y Sol con el anular.',
    cuerda: 1, trasteObjetivo: 0,
    practica: {
      tipo: 'secuencia',
      pasos: [
        { tipo: 'nota', posiciones: [{ cuerda: 1, traste: 0 }] },
        { tipo: 'nota', posiciones: [{ cuerda: 1, traste: 1, dedo: 1 }] },
        { tipo: 'nota', posiciones: [{ cuerda: 1, traste: 3, dedo: 3 }] },
      ],
    },
  },
  { id: 'mock-3', cursoId: 'mock', orden: 3, titulo: 'Ritmo de Fogón', tipo: 'Práctica', estado: 'bloqueada', xp: 150 },
  { id: 'mock-4', cursoId: 'mock', orden: 4, titulo: 'Tu primer Canción', tipo: 'Canción', estado: 'bloqueada', xp: 200 },
].map((l) => ({ ...l, esMock: true }));

// Las instrucciones pueden venir como array, como JSON en texto o como texto separado por saltos de línea
function parsearInstrucciones(valor) {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor.length ? valor : null;
  if (typeof valor === 'string') {
    try {
      const parseado = JSON.parse(valor);
      if (Array.isArray(parseado)) return parseado.length ? parseado : null;
    } catch {
      // No era JSON, seguimos
    }
    const lineas = valor.split(/\r?\n|\|/).map((l) => l.trim()).filter(Boolean);
    return lineas.length ? lineas : null;
  }
  return null;
}

// La columna practica es JSON: normalmente llega como objeto, pero se acepta también como texto
function parsearPractica(valor) {
  if (typeof valor !== 'string') return valor ?? null;
  try {
    return JSON.parse(valor);
  } catch {
    return null;
  }
}

// "video" -> "Video" (la BD guarda tipos y niveles en minúscula)
export function capitalizar(texto) {
  if (!texto) return texto;
  return String(texto).charAt(0).toUpperCase() + String(texto).slice(1);
}

// Pasa un Ejercicio del backend al formato que usan las pantallas
function mapearLeccion(ejercicio) {
  return {
    id: ejercicio.id,
    cursoId: ejercicio.cursoId,
    orden: ejercicio.orden,
    titulo: ejercicio.titulo,
    descripcion: ejercicio.descripcion,
    tipo: capitalizar(ejercicio.tipo) || 'Lección',
    xp: ejercicio.xpRecompensa ?? 0,
    videoId: ejercicio.youtubeId || null,
    textoTeoria: ejercicio.textoTeoria || ejercicio.descripcion || null,
    textoDestacado: ejercicio.textoDestacado || null,
    instrucciones: parsearInstrucciones(ejercicio.instrucciones),
    cuerda: ejercicio.cuerda ?? null,
    trasteObjetivo: ejercicio.trasteObjetivo ?? null,
    practica: parsearPractica(ejercicio.practica),
    omitida: !!ejercicio.omitida,
    notaEsperada: ejercicio.notaEsperada ?? null,
    dotLeft: ejercicio.dotLeft || null,
    dotBottom: ejercicio.dotBottom || null,
    estado: ejercicio.completado ? 'completada' : ejercicio.desbloqueado ? 'disponible' : 'bloqueada',
  };
}

export const leccionesService = {
  obtenerCursos: async (perfilId) => {
    const response = await axiosClient.get(ENDPOINTS.cursos(perfilId));
    return response.data?.data?.cursos || [];
  },

  obtenerDetalleCurso: async (perfilId, cursoId) => {
    const response = await axiosClient.get(ENDPOINTS.cursoDetalle(perfilId, cursoId));
    const curso = response.data?.data;
    return {
      ...curso,
      lecciones: (curso?.lecciones || []).map(mapearLeccion),
    };
  },

  // Devuelve todo lo que necesita el Home: lista de cursos, curso elegido y sus lecciones.
  // Si no se pide un curso puntual, elegimos el primero desbloqueado que no esté completado.
  obtenerMapa: async (perfilId, cursoIdElegido) => {
    try {
      const cursos = await leccionesService.obtenerCursos(perfilId);
      if (cursos.length === 0) {
        return { cursos: [MOCK_CURSO], curso: MOCK_CURSO, lecciones: MOCK_LECCIONES, esMock: true };
      }

      const cursoActual =
        cursos.find((c) => c.id === cursoIdElegido) ||
        cursos.find((c) => c.desbloqueado && !c.completado) ||
        cursos[cursos.length - 1];

      const detalle = await leccionesService.obtenerDetalleCurso(perfilId, cursoActual.id);
      return { cursos, curso: { ...cursoActual, ...detalle }, lecciones: detalle.lecciones, esMock: false };
    } catch (error) {
      console.log('Error cargando cursos:', getErrorMessage(error));
      return { cursos: [MOCK_CURSO], curso: MOCK_CURSO, lecciones: MOCK_LECCIONES, esMock: true, error: getErrorMessage(error) };
    }
  },

  // Resumen de progreso de todos los cursos (para la pantalla de Progreso y Logros).
  // Usa el endpoint /progreso del backend; si no existe (backend viejo) lo arma a mano.
  obtenerResumen: async (perfilId) => {
    try {
      const response = await axiosClient.get(ENDPOINTS.progreso(perfilId));
      const data = response.data?.data;
      if (data) return data;
    } catch (error) {
      if (error.response?.status !== 404) throw new Error(getErrorMessage(error));
    }

    const cursos = await leccionesService.obtenerCursos(perfilId);
    const detalles = await Promise.all(
      cursos.map((c) => leccionesService.obtenerDetalleCurso(perfilId, c.id).catch(() => ({ ...c, lecciones: [] })))
    );
    const resumenCursos = detalles.map((d, i) => {
      const completadas = d.lecciones.filter((l) => l.estado === 'completada').length;
      const total = d.lecciones.length;
      return {
        ...cursos[i],
        totalLecciones: total,
        leccionesCompletadas: completadas,
        porcentaje: total ? Math.round((completadas / total) * 100) : 0,
        proximaLeccion: d.lecciones.find((l) => l.estado === 'disponible')?.titulo || null,
      };
    });
    return {
      perfilId,
      cursos: resumenCursos,
      totalCursos: cursos.length,
      cursosCompletados: cursos.filter((c) => c.completado).length,
      totalLecciones: resumenCursos.reduce((acc, c) => acc + c.totalLecciones, 0),
      leccionesCompletadas: resumenCursos.reduce((acc, c) => acc + c.leccionesCompletadas, 0),
      cursoActual: resumenCursos.find((c) => c.desbloqueado && !c.completado) || resumenCursos[resumenCursos.length - 1] || null,
    };
  },

  // Con omitida, el alumno salteó la detección: desbloquea la siguiente lección pero no suma XP
  completarLeccion: async (perfilId, cursoId, leccionId, { omitida = false } = {}) => {
    try {
      const cuerpo = omitida ? { omitida: true } : undefined;
      const response = await axiosClient.post(ENDPOINTS.completarLeccion(perfilId, cursoId, leccionId), cuerpo);
      return { ...response.data?.data, yaCompletada: false };
    } catch (error) {
      const mensaje = getErrorMessage(error);
      // Repetir una lección ya hecha no es un error para el usuario: simplemente no suma XP
      if (/ya hab[ií]as reclamado|ya fue registrado/i.test(mensaje)) {
        return { xpGanada: 0, xpTotal: null, yaCompletada: true };
      }
      throw new Error(mensaje);
    }
  },

  completarCurso: async (perfilId, cursoId) => {
    try {
      const response = await axiosClient.post(ENDPOINTS.completarCurso(perfilId, cursoId));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
