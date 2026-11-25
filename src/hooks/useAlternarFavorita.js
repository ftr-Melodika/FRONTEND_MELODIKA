// Archivo: src/hooks/useAlternarFavorita.js
// Marca o desmarca una canción como favorita del perfil activo. El corazón cambia al instante y,
// si el servidor no lo guarda, vuelve a como estaba y se avisa.
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { queryClient } from '../api/queryClient';
import { cancionesService } from '../services/cancionesService';

export function useAlternarFavorita(perfilId) {
  return useCallback(async (cancion) => {
    const clave = ['cancionesFavoritas', perfilId];
    const antes = queryClient.getQueryData(clave) ?? [];
    const eraFavorita = antes.includes(cancion.id);
    queryClient.setQueryData(clave, eraFavorita ? antes.filter((id) => id !== cancion.id) : [...antes, cancion.id]);
    try {
      await (eraFavorita ? cancionesService.quitarFavorita : cancionesService.marcarFavorita)(perfilId, cancion.id);
    } catch (error) {
      queryClient.setQueryData(clave, antes);
      Alert.alert('No se pudo guardar tu favorita', error.message);
    }
  }, [perfilId]);
}
