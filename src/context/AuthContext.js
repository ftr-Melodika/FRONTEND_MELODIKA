import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();
export let globalLogout = () => {};

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);

  // ✅ Primero cargamos la sesión guardada
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

  // ✅ login y logout declarados ANTES del useEffect que los usa
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

  // ✅ Ahora sí, logout ya existe cuando llegamos acá
  // [] en vez de [logout] porque logout es nueva función en cada render
  // y no queremos que esto se ejecute infinitamente
  useEffect(() => {
    globalLogout = logout;
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout, isLoading, userToken, userData }}>
      {children}
    </AuthContext.Provider>
  );
};