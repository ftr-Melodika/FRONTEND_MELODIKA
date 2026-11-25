// Archivo: src/hooks/useConsultas.js
// Las consultas al backend que usan varias pantallas, con caché (React Query).
// Las claves empiezan con el nombre del dato y siguen con el perfil activo: así se invalidan por grupo.
import { useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { leccionesService } from '../services/leccionesService';
import { amistadesService } from '../services/amistadesService';
import { gruposService } from '../services/gruposService';
import { rankingsService } from '../services/rankingsService';
import { cancionesService } from '../services/cancionesService';

// Al volver a una pantalla (el navigator no la desmonta) se actualiza solo si los datos ya vencieron
export function useActualizarAlEnfocar({ refetch, isStale }) {
  const stale = useRef(isStale);
  stale.current = isStale;
  const primera = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (primera.current) {
        primera.current = false;
        return;
      }
      if (stale.current) refetch();
    }, [refetch])
  );
}

export const useMapa = (perfilId, cursoId) =>
  useQuery({
    queryKey: ['mapa', perfilId, cursoId ?? null],
    queryFn: () => leccionesService.obtenerMapa(perfilId, cursoId),
    enabled: !!perfilId,
  });

export const useResumen = (perfilId) =>
  useQuery({
    queryKey: ['resumen', perfilId],
    queryFn: () => leccionesService.obtenerResumen(perfilId),
    enabled: !!perfilId,
  });

// La campanita: se actualiza cada 30 s mientras la pantalla está visible
export const useSolicitudes = (perfilId, { intervalo = false } = {}) =>
  useQuery({
    queryKey: ['solicitudes', perfilId],
    queryFn: () => amistadesService.obtenerSolicitudes(perfilId),
    enabled: !!perfilId,
    refetchInterval: intervalo || false,
  });

export const useAmigos = (perfilId) =>
  useQuery({
    queryKey: ['amigos', perfilId],
    queryFn: () => amistadesService.obtenerAmigos(perfilId),
    enabled: !!perfilId,
  });

export const useMisGrupos = (perfilId) =>
  useQuery({
    queryKey: ['misGrupos', perfilId],
    queryFn: () => gruposService.misGrupos(perfilId),
    enabled: !!perfilId,
  });

export const useMisRankings = (perfilId) =>
  useQuery({
    queryKey: ['rankings', perfilId],
    queryFn: () => rankingsService.misRankings(perfilId),
    enabled: !!perfilId,
  });

export const useRankingGrupo = (perfilId, grupoId) =>
  useQuery({
    queryKey: ['rankingGrupo', perfilId, grupoId],
    queryFn: () => rankingsService.deGrupo(perfilId, grupoId),
    enabled: !!perfilId && !!grupoId,
  });

const STALE_CATALOGO_MS = 5 * 60 * 1000; // El catálogo de canciones casi no cambia

export const useCanciones = () =>
  useQuery({
    queryKey: ['canciones'],
    queryFn: cancionesService.listar,
    staleTime: STALE_CATALOGO_MS,
  });

export const useCancion = (id) =>
  useQuery({
    queryKey: ['cancion', id],
    queryFn: () => cancionesService.obtener(id),
    enabled: !!id,
    staleTime: STALE_CATALOGO_MS,
  });

// Los ids de las canciones favoritas del perfil activo. Si el pedido falla, no hay favoritas que mostrar.
export const useFavoritasCanciones = (perfilId) =>
  useQuery({
    queryKey: ['cancionesFavoritas', perfilId],
    queryFn: () => cancionesService.favoritas(perfilId),
    enabled: !!perfilId,
  });

// Las estrellas de cada canción del perfil activo ({ id: 1 a 3 }). Si falla, todas se ven sin estrellas.
export const useEstrellasCanciones = (perfilId) =>
  useQuery({
    queryKey: ['cancionesEstrellas', perfilId],
    queryFn: () => cancionesService.estrellas(perfilId),
    enabled: !!perfilId,
  });

// El mensaje de error de una consulta, solo si no hay nada para mostrar (con datos viejos no se molesta)
export const mensajeError = (consulta) => (consulta.isError && consulta.data === undefined ? consulta.error.message : null);
