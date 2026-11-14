import axios from 'axios';
import { obtenerToken, refrescarSesion, avisarSesionExpirada } from './tokenSesion';

import { BASE_URL } from '../config/api'; // 👈 importás la variable, no ENDPOINTS.BASE_URL

const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    // Evita la página de advertencia de ngrok (si no, devuelve HTML en vez de JSON)
    'ngrok-skip-browser-warning': 'true',
  },
});

// Interceptor de salida: agrega el token (renovado antes si está por vencer)
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

// Interceptor de entrada: si el token venció, se renueva y se reintenta el pedido una vez.
// La sesión solo se cierra si el backend rechaza el refresh token (ver tokenSesion.js):
// sin internet o con el servidor caído, el pedido falla pero la sesión sigue.
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    // Solo si la request iba con token: un 401 en el login es "contraseña incorrecta", no sesión vencida
    const tokenVencido = error.response?.status === 401 && config?.headers?.Authorization;
    if (!tokenVencido || config._reintentado) return Promise.reject(error);

    try {
      const nuevo = await refrescarSesion();
      config._reintentado = true;
      config.headers.Authorization = `Bearer ${nuevo}`;
      return axiosClient(config);
    } catch (errorRefresh) {
      if (errorRefresh.sesionMuerta) {
        console.log('La sesión venció y no se pudo renovar: vuelve al login.');
        // AuthContext registra su logout: borra la sesión y el AppNavigator vuelve al Login
        await avisarSesionExpirada();
      }
      return Promise.reject(error);
    }
  }
);

export default axiosClient;
