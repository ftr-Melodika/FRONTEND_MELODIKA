import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Creamos el altoparlante (El Contexto)
export const AuthContext = createContext();

// 2. Creamos el sistema que controla el altoparlante (El Provider)
export const AuthProvider = ({ children }) => {
  // Estados para saber qué está pasando
  const [isLoading, setIsLoading] = useState(true); // ¿Está cargando?
  const [userToken, setUserToken] = useState(null); // La llave del usuario
  const [userData, setUserData] = useState(null);   // Los datos (mail, nombre)

  // Apenas arranca la app, va al disco duro a ver si ya había una sesión guardada
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const cuenta = await AsyncStorage.getItem('userCuenta');
        
        if (token && cuenta) {
          setUserToken(token);
          setUserData(JSON.parse(cuenta)); // Transforma el texto guardado en un objeto de JS
        }
      } catch (error) {
        console.log('Error leyendo sesión:', error);
      } finally {
        setIsLoading(false); // Ya terminó de buscar, apaga la pantalla de carga
      }
    };
    checkLogin();
  }, []);

  // Función para cuando el usuario pone su mail y contraseña con éxito
  const login = async (token, cuenta) => {
    setIsLoading(true);
    try {
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userCuenta', JSON.stringify(cuenta));
      setUserToken(token);
      setUserData(cuenta);
    } catch (error) {
      console.log('Error guardando sesión:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cuando el usuario toca el botón de "Cerrar Sesión"
  const logout = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userCuenta');
      setUserToken(null);
      setUserData(null);
    } catch (error) {
      console.log('Error borrando sesión:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Todo lo que pongamos dentro de "value" va a ser transmitido por el altoparlante
  // a las pantallas (children) que estén envueltas por este Provider.
  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken, userData }}>
      {children}
    </AuthContext.Provider>
  );
};