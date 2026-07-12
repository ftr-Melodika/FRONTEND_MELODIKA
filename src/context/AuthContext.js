// Archivo: src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export let globalLogout = () => {};

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  
  // NUEVO: Estado global para manejar el perfil activo
  const [perfil, setPerfil] = useState(null);

  // Primero cargamos la sesión y el perfil guardado al abrir la app
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const cuenta = await AsyncStorage.getItem('userCuenta');
        const perfilGuardado = await AsyncStorage.getItem('userPerfil'); // Buscamos el perfil

        if (token && cuenta) {
          setUserToken(token);
          setUserData(JSON.parse(cuenta));
          
          if (perfilGuardado) {
            setPerfil(JSON.parse(perfilGuardado)); // Restauramos el perfil si existía
          }
        }
      } catch (error) {
        console.log('Error leyendo sesión:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkLogin();
  }, []);

  const login = async (token, cuenta) => {
    setIsLoading(true);
    try {
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userCuenta', JSON.stringify(cuenta));
      
      setUserToken(token);
      setUserData(cuenta);
      // Al loguear una cuenta nueva, el perfil arranca en null hasta que seleccione uno
      setPerfil(null); 
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
      await AsyncStorage.removeItem('userPerfil'); // Limpiamos el perfil al salir
      
      setUserToken(null);
      setUserData(null);
      setPerfil(null);
    } catch (error) {
      console.log('Error borrando sesión:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // NUEVO: Función para actualizar el perfil globalmente (ej: al crearlo o seleccionarlo)
  const actualizarPerfil = async (nuevoPerfil) => {
    try {
      await AsyncStorage.setItem('userPerfil', JSON.stringify(nuevoPerfil));
      setPerfil(nuevoPerfil);
    } catch (error) {
      console.log('Error guardando perfil:', error);
    }
  };

  useEffect(() => {
    globalLogout = logout;
  }, []);

  return (
    <AuthContext.Provider value={{ 
        login, 
        logout, 
        actualizarPerfil, // La exponemos para usarla en SelectUser y CreateUser
        isLoading, 
        userToken, 
        userData,
        perfil // Exponemos el objeto perfil para que lo lea el Home
    }}>
      {children}
    </AuthContext.Provider>
  );
};