import axiosClient from '../api/axiosClient';

export const obtenerPerfiles = async () => {
  try {
    const response = await axiosClient.get('/perfiles');
    // Devuelve exactamente la data de tu contrato: { success, data, message }
    return response.data; 
  } catch (error) {
    // Si hay un error formateado desde tu backend, lo extraemos
    if (error.response && error.response.data) {
      throw error.response.data; 
    }
    throw { success: false, message: 'Error de conexión con el servidor.' };
  }
};