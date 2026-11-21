// Archivo: src/api/pedir.js
// Lo que comparten los services para llamar al backend (el patrón de gruposService).
import { getErrorMessage } from '../utils/errorUtils';
import { invalidar } from './queryClient';

// Para leer: devuelve response.data.data o lanza un Error con el texto listo para mostrar
export async function pedir(llamada) {
  try {
    const response = await llamada();
    return response.data?.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// Para lo que cambia datos: después de que sale bien, lo que está en caché con esos nombres vence
export async function modificar(llamada, ...claves) {
  const datos = await pedir(llamada);
  invalidar(...claves);
  return datos;
}
