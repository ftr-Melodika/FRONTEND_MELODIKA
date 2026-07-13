

export const getErrorMessage = (error) => {
  // 1. Si el servidor respondió con un error (ej: 400, 403, 500)
  if (error.response) {
    // Evitar devolver HTML bruto que venga del servidor (p. ej. páginas de error del backend)
    const data = error.response.data;
    if (typeof data === 'string') {
      const lower = data.toLowerCase();
      if (lower.includes('<!doctype') || lower.includes('<html')) {
        return `Error del servidor (${error.response.status})`;
      }
    }

    // Busca el mensaje en data.message o data.error (dependiendo de cómo lo armaste en tu backend)
    return data?.message || data?.error || `Error del servidor (${error.response.status})`;
  }
  
  // 2. Si el servidor nunca respondió (ej: sin internet, backend apagado)
  if (error.request) {
    return 'No se pudo conectar con el servidor. Revisá tu conexión.';
  }

  // 3. Cualquier otro error inesperado en la app
  return error.message || 'Ocurrió un error inesperado.';
};