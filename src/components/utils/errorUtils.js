// Archivo: src/utils/errorUtils.js
export const getErrorMessage = (error) => {
  // 1. Si el servidor respondió (ej: error 400, 403, 500)
  if (error.response) {
    // Si tu backend envía el error en un campo 'message' o 'data'
    return error.response.data?.message || error.response.data || 'Error del servidor';
  }
  
  // 2. Si no hubo respuesta del servidor (error de red)
  if (error.request) {
    return 'No hay conexión con el servidor. Revisá tu internet.';
  }

  // 3. Cualquier otra cosa
  return error.message || 'Ocurrió un error inesperado';
};