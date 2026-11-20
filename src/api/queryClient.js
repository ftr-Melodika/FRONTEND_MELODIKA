// Archivo: src/api/queryClient.js
// Caché de datos del servidor (React Query). Muestra al instante lo último que se vio y lo actualiza
// en segundo plano. Parte de la caché se guarda en el celular para que al reabrir la app ya haya algo.
import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

const UN_DIA_MS = 24 * 60 * 60 * 1000;
const CLAVE_CACHE = 'melodikaQueryCache';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // Dentro de este tiempo, volver a una pantalla no vuelve a pedir nada
      gcTime: UN_DIA_MS, // Tiene que ser >= al maxAge de la persistencia
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: CLAVE_CACHE,
  throttleTime: 2000,
});

// Solo se guarda lo liviano y estable. Rankings, grupos y solicitudes traen fotos en base64 (pesadas)
// y cambian seguido: quedan solo en memoria.
const CLAVES_PERSISTIDAS = ['mapa', 'resumen', 'canciones', 'cancion', 'perfiles'];

export const opcionesPersistencia = {
  persister,
  maxAge: UN_DIA_MS,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) =>
      query.state.status === 'success' && CLAVES_PERSISTIDAS.includes(query.queryKey[0]),
  },
};

// Al cerrar sesión no puede quedar nada de la cuenta anterior
export async function limpiarCache() {
  queryClient.clear();
  try {
    await AsyncStorage.removeItem(CLAVE_CACHE);
  } catch {
    // Si no se puede borrar, la caché se reemplaza sola en la próxima escritura
  }
}

// Los servicios llaman a esto después de crear/cambiar/borrar algo: lo que estaba en la caché
// con esos nombres vence y las pantallas que lo muestran lo vuelven a pedir.
export function invalidar(...claves) {
  claves.forEach((clave) => queryClient.invalidateQueries({ queryKey: [clave] }));
}
