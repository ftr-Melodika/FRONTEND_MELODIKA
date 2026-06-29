import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../config/api'; 

// 1. Creamos al "Cartero" y le decimos a qué dirección base ir siempre
const axiosClient = axios.create({
  baseURL: ENDPOINTS.BASE_URL, 
  timeout: 10000, // Si el backend tarda más de 10 segundos, corta y tira error
});

// 2. Contratamos al "Secretario" (El Interceptor)
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

export default axiosClient;