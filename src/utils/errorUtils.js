

export const getErrorMessage = (error) => {
  // 1. Si el servidor respondió con un error (ej: 400, 403, 500)
  if (error.response) {
    // Busca el mensaje en data.message o data.error (dependiendo de cómo lo armaste en tu backend)
    return error.response.data?.message || error.response.data?.error || `Error del servidor (${error.response.status})`;
  }
  
  // 2. Si el servidor nunca respondió (ej: sin internet, backend apagado)
  if (error.request) {
    return 'No se pudo conectar con el servidor. Revisá tu conexión.';
  }

  // 3. Cualquier otro error inesperado en la app
  return error.message || 'Ocurrió un error inesperado.';
};