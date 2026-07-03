import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../config/api'; 

// 1. Creamos al "Cartero" y le decimos a qué dirección base ir siempre
const axiosClient = axios.create({
  baseURL: ENDPOINTS.BASE_URL, 
  timeout: 10000, // Si el backend tarda más de 10 segundos, corta y tira error
});

// 2. Contratamos al "Secretario de Salida" (Interceptor de Peticiones)
axiosClient.interceptors.request.use(
  async (config) => {
    // Antes de que el cartero salga, el secretario busca el token en el celular
    const token = await AsyncStorage.getItem('userToken');
    
    // Si encontró el token, se lo pega a la carta (en el header Authorization)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Devuelve la carta lista para enviar
    return config;
  },
  (error) => {
    // Si hubo un problema antes de enviar, avisa
    return Promise.reject(error);
  }
);

// 3. NUEVO: Contratamos al "Secretario de Entrada" (Interceptor de Respuestas)
axiosClient.interceptors.response.use(
  (response) => {
    // Si todo salió bien (estado 200 o 201), dejamos pasar la respuesta normal al componente
    return response;
  },
  async (error) => {
    // Si el backend nos devuelve un error 401 (No Autorizado / Token expirado)
    if (error.response && error.response.status === 401) {
      console.log('Sesión expirada detectada. Limpiando datos del celular...');
      
      // Borramos los datos del almacenamiento local
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userCuenta');
      
      // Al borrar esto, forzamos a que el usuario tenga que volver a iniciar sesión
    }
    
    // Devolvemos el error original hacia el bloque 'catch' de la pantalla que hizo la petición
    return Promise.reject(error);
  }
);

export default axiosClient;