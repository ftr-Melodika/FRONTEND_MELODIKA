// Archivo: src/hooks/useAcordes.js
// Acordes para practicar. Vienen del backend, dentro de las lecciones de acordes de los cursos
// (no hay un endpoint propio). Se piden una sola vez por perfil y quedan en memoria.
// Si el backend no responde, se usan los mismos 6 acordes del curso guardados en la app.
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { leccionesService } from '../services/leccionesService';
import { acordesDeRespaldo, extraerAcordes } from '../utils/acordes';

const enMemoria = new Map(); // perfilId -> Promise<{ acordes, desdeRespaldo }>

async function cargarAcordes(perfilId) {
  try {
    const cursos = await leccionesService.obtenerCursos(perfilId);
    const detalles = await Promise.all(
      cursos.map((curso) => leccionesService.obtenerDetalleCurso(perfilId, curso.id).catch(() => null))
    );
    const lecciones = detalles.flatMap((detalle, i) =>
      (detalle?.lecciones || []).map((leccion) => ({ ...leccion, ordenCurso: cursos[i].orden ?? i })));
    const acordes = extraerAcordes(lecciones);
    if (acordes.length >= 2) return { acordes, desdeRespaldo: false };
  } catch (error) {
    // Sin conexión o sin sesión: seguimos con el respaldo
  }
  return { acordes: acordesDeRespaldo(), desdeRespaldo: true };
}

export function useAcordes() {
  const { perfil } = useContext(AuthContext) ?? {};
  const perfilId = perfil?.id;
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    if (!perfilId) {
      setResultado({ acordes: acordesDeRespaldo(), desdeRespaldo: true });
      return undefined;
    }
    let cancelado = false;
    if (!enMemoria.has(perfilId)) enMemoria.set(perfilId, cargarAcordes(perfilId));
    enMemoria.get(perfilId).then((r) => {
      if (cancelado) return;
      // Un respaldo no se guarda: la próxima vez se vuelve a intentar con el backend
      if (r.desdeRespaldo) enMemoria.delete(perfilId);
      setResultado(r);
    });
    return () => {
      cancelado = true;
    };
  }, [perfilId]);

  return {
    acordes: resultado?.acordes ?? [],
    cargando: !resultado,
    desdeRespaldo: !!resultado?.desdeRespaldo,
  };
}
