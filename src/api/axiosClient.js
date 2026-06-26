import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

const axiosClient = axios.create({
  baseURL: 'https://tu-backend.com/api', // Reemplazar por variables de entorno (.env)
  timeout: 10000,
});

axiosClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosClient;