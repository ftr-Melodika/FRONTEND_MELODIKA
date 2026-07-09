import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Creamos el altoparlante (El Contexto)
export const AuthContext = createContext();

// NUEVO: Creamos un "cable de emergencia" hacia afuera de React
export let globalLogout = () => {};

// 2. Creamos el sistema que controla el altoparlante (El Provider)
export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true); 
  const [userToken, setUserToken] = useState(null); 
  const [userData, setUserData] = useState(null);   

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const cuenta = await AsyncStorage.getItem('userCuenta');
        
        if (token && cuenta) {
          setUserToken(token);
          setUserData(JSON.parse(cuenta)); 
        }
      } catch (error) {
        console.log('Error leyendo sesión:', error);
      } finally {
        setIsLoading(false); 
      }
    };
    checkLogin();
  }, []);

  useEffect(() => {
    globalLogout = logout;
  }, [logout]);

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

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken, userData }}>
      {children}
    </AuthContext.Provider>
  );
};