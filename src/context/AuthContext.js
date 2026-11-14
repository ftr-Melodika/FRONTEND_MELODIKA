// Archivo: src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { perfilesService, normalizarPerfil } from '../services/perfilesService';
import { borrarSesion, cargarSesion, guardarSesion, refrescarSesion, registrarAlExpirarSesion } from '../api/tokenSesion';

export const AuthContext = createContext();

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
        const { token, refreshToken } = await cargarSesion();
        const cuenta = await AsyncStorage.getItem('userCuenta');
        const perfilGuardado = await AsyncStorage.getItem('userPerfil'); // Buscamos el perfil

        if ((token || refreshToken) && cuenta) {
          // Se entra directo con lo guardado, aunque el token haya vencido: se renueva al primer
          // pedido al backend (o acá abajo, en segundo plano)
          setUserToken(token || 'renovando');
          setUserData(JSON.parse(cuenta));

          if (perfilGuardado) {
            setPerfil(normalizarPerfil(JSON.parse(perfilGuardado))); // Restauramos el perfil si existía
          }

          // Token nuevo al abrir la app. Sin internet no pasa nada: la sesión sigue.
          if (refreshToken) {
            refrescarSesion()
              .then((nuevo) => setUserToken(nuevo))
              .catch((error) => {
                if (error.sesionMuerta) logout();
              });
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

  // refreshToken y expiresAt los devuelve el login del backend: con ellos la sesión no se cierra sola
  const login = async (token, cuenta, refreshToken, expiresAt) => {
    setIsLoading(true);
    try {
      await guardarSesion({ token, refreshToken, expiresAt });
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
      await borrarSesion();
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

  // Actualiza solo algunos campos del perfil activo (ej: xp y racha después de una lección)
  const parchearPerfil = async (cambios) => {
    if (!perfil) return;
    await actualizarPerfil({ ...perfil, ...cambios });
  };

  // Vuelve a pedir el perfil activo al backend para tener xp/racha al día
  const refrescarPerfil = async () => {
    if (!perfil?.id) return null;
    try {
      const perfilNuevo = await perfilesService.obtenerPerfil(perfil.id);
      if (perfilNuevo) await actualizarPerfil(perfilNuevo);
      return perfilNuevo;
    } catch (error) {
      console.log('Error refrescando perfil:', error.message);
      return null;
    }
  };

  // Si se borra el perfil que estaba en uso, lo sacamos de la sesión
  const quitarPerfil = async () => {
    await AsyncStorage.removeItem('userPerfil');
    setPerfil(null);
  };

  // Si el backend rechaza el refresh token (la sesión murió de verdad), axiosClient llama a este logout
  useEffect(() => {
    registrarAlExpirarSesion(logout);
    return () => registrarAlExpirarSesion(null);
  }, []);

  return (
    <AuthContext.Provider value={{ 
        login, 
        logout, 
        actualizarPerfil, // La exponemos para usarla en SelectUser y CreateUser
        parchearPerfil,
        refrescarPerfil,
        quitarPerfil,
        isLoading, 
        userToken, 
        userData,
        perfil // Exponemos el objeto perfil para que lo lea el Home
    }}>
      {children}
    </AuthContext.Provider>
  );
};