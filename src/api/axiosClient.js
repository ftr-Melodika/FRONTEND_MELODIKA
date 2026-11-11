import axios from 'axios';
import { obtenerToken, avisarSesionExpirada } from './tokenSesion';

import { BASE_URL } from '../config/api'; // 👈 importás la variable, no ENDPOINTS.BASE_URL

const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    // Evita la página de advertencia de ngrok (si no, devuelve HTML en vez de JSON)
    'ngrok-skip-browser-warning': 'true',
  },
});
// Interceptor de Salida (Queda igual)
axiosClient.interceptors.request.use(
  async (config) => {
    const token = await obtenerToken();
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
    // (Solo si la request iba con token: un 401 en el login es "contraseña incorrecta", no sesión expirada)
    if (error.response && error.response.status === 401 && error.config?.headers?.Authorization) {
      console.log('Sesión expirada detectada. Limpiando datos y memoria...');
      
      // AuthContext registra su logout: borra el AsyncStorage y la memoria de React,
      // y el AppNavigator vuelve solo a la pantalla de Login.
      await avisarSesionExpirada();
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;