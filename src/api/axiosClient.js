import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENDPOINTS } from '../config/api'; 
// NUEVO: Importamos el cable de emergencia
import { globalLogout } from '../context/AuthContext';

const axiosClient = axios.create({
  baseURL: ENDPOINTS.BASE_URL, 
  timeout: 10000, 
});

// Interceptor de Salida (Queda igual)
axiosClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Entrada (CORREGIDO)
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Si el backend nos devuelve un error 401
    if (error.response && error.response.status === 401) {
      console.log('Sesión expirada detectada. Limpiando datos y memoria...');
      
      // NUEVO: Llamamos a la función global. 
      // Ella misma se encarga de borrar el AsyncStorage y limpiar la memoria de React,
      // lo que causará que el AppNavigator vuelva mágicamente a la pantalla de Login.
      if (typeof globalLogout === 'function') {
        await globalLogout();
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;