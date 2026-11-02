// Archivo: src/screens/SelectUserScreen.js

import { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Background } from '../components/Background';
import { AuthContext } from '../context/AuthContext';
import { perfilesService } from '../services/perfilesService';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { Button } from '../components/Button';
import { LoadingModal } from '../components/LoadingModal';

// Mismo límite que valida el backend (perfilService.MAX_PERFILES)
const MAX_PERFILES = 4;

export function SelectUserScreen({ navigation, route }) {
  const { logout, actualizarPerfil } = useContext(AuthContext);
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 👇 1. NUEVO ESTADO: Controla si estamos administrando perfiles
  const [isEditMode, setIsEditMode] = useState(false); 

  // Como los perfiles pueden cambiar en la pantalla de edición,
  // movemos el fetch a una función que se ejecute cada vez que la pantalla gana foco (focus)
  // 1. Efecto inicial para buscar datos solo al montar
  useEffect(() => {
    fetchPerfiles();
  }, []);

  // 2. Efecto para reaccionar a los cambios que vienen de EditUserScreen
  useEffect(() => {
    if (route?.params?.perfilActualizado) {
      setPerfiles((prevPerfiles) => 
        prevPerfiles.map((p) => p.id === route.params.perfilActualizado.id ? route.params.perfilActualizado : p)
      );
      // Limpiamos el parámetro para que no se vuelva a ejecutar
      navigation.setParams({ perfilActualizado: undefined });
    }

    if (route?.params?.perfilEliminadoId) {
      setPerfiles((prevPerfiles) => 
        prevPerfiles.filter((p) => p.id !== route.params.perfilEliminadoId)
      );
      navigation.setParams({ perfilEliminadoId: undefined });
    }
  }, [route?.params?.perfilActualizado, route?.params?.perfilEliminadoId]);

  async function fetchPerfiles() {
    setLoading(true);
    try {
      const perfilesData = await perfilesService.obtenerPerfiles();
      setPerfiles(Array.isArray(perfilesData) ? perfilesData : []);
    } catch (error) {
      if (error.isAuthError) {
        Alert.alert('Sesión Expirada', 'Volvé a ingresar.');
        await logout();
        return;
      }
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  // 👇 2. NUEVA LÓGICA AL PRESIONAR EL AVATAR
  const handleActionPerfil = async (perfil) => {
    if (isEditMode) {
      // Si estamos en modo edición, NO iniciamos sesión. 
      // Enviamos el objeto 'perfil' (QUE CONTIENE EL ID) a la pantalla de edición.
      navigation.navigate('EditUser', { perfilAEditar: perfil });
    } else {
      // Flujo normal: Iniciar sesión
      try {
        setLoading(true);
        await actualizarPerfil(perfil); 
        navigation.replace('Home'); 
      } catch (error) {
        Alert.alert('Error', 'No pudimos seleccionar el perfil. Intentá de nuevo.');
        setLoading(false);
      }
    }
  };

  return (
    <Background>
      <LoadingModal visible={loading} text="Buscando perfiles..." />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>
            {/* Cambiamos el título si estamos editando */}
            {isEditMode ? 'Administrar perfiles' : '¿Quién va a tocar hoy?'}
          </Text>
          
          {!loading && (
            <View style={styles.profilesRow}>
              {perfiles.map((perfil) => (
                <View key={perfil.id} style={isEditMode ? styles.editWrapper : null}>
                  <ProfileAvatar 
                    nombre={perfil.nombre}
                    foto={perfil.avatarUrl}
                    // Pasamos el perfil completo a la nueva función
                    onPress={() => handleActionPerfil(perfil)} 
                  />
                  {/* Pequeño indicador visual de que es editable */}
                  {isEditMode && <Text style={styles.editText}>✏️</Text>}
                </View>
              ))}
              
              {/* Si estamos editando, ocultamos el botón de agregar */}
              {!isEditMode && perfiles.length < MAX_PERFILES && (
                <ProfileAvatar 
                  isAddButton={true}
                  onPress={() => navigation.navigate('CreateUser')} 
                />
              )}
            </View>
          )}

          {/* 👇 3. BOTÓN PARA ACTIVAR/DESACTIVAR MODO EDICIÓN */}
          {!loading && perfiles.length > 0 && (
            <View style={styles.actionsRow}>
              <Button 
                title={isEditMode ? "✓ Listo" : "✏️ Administrar perfiles"} 
                variant="secondary" 
                onPress={() => setIsEditMode(!isEditMode)} 
                style={styles.manageButton}
                textStyle={styles.manageButtonText}
              />
            </View>
          )}

        </View>
        
        <View style={styles.footerActions}>
          <Button 
            title="Cerrar sesión" 
            variant="secondary" 
            onPress={() => logout()}
            style={styles.logoutButton}
            textStyle={styles.logoutButtonText}
          />
        </View>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 24 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  title: { fontSize: 32, color: '#fff', fontFamily: 'serif', fontWeight: 'bold', marginBottom: 40 },
  profilesRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 30 },
  actionsRow: { marginTop: 34, width: '100%', alignItems: 'center' },
  footerActions: { width: '100%', alignItems: 'center', paddingTop: 6 },
  manageButton: {
    width: 220,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(178, 140, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    marginVertical: 0,
  },
  manageButtonText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.15,
    color: '#f5f1ff',
  },
  logoutButton: {
    width: 220,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(226, 85, 106, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 120, 135, 0.8)',
    marginVertical: 0,
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffd8dd',
  },
  // Estilos visuales para el modo edición
  editWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  editText: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    includeFontPadding: false,
  }
});