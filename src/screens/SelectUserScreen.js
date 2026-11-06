// Archivo: src/screens/SelectUserScreen.js

import { Icono } from '../components/icono/Icono';
import { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
          {/* Cambiamos el título si estamos editando */}
          {isEditMode ? 'Administrar perfiles' : '¿Quién va a tocar hoy?'}
        </Text>
        {isEditMode && <Text style={styles.subtitle}>Tocá un perfil para editarlo o eliminarlo</Text>}

        {!loading && (
          <View style={styles.profilesRow}>
            {perfiles.map((perfil) => (
              <View key={perfil.id} style={styles.avatarWrapper}>
                <ProfileAvatar
                  nombre={perfil.nombre}
                  foto={perfil.avatarUrl}
                  // Pasamos el perfil completo a la nueva función
                  onPress={() => handleActionPerfil(perfil)}
                />
                {/* Pequeño indicador visual de que es editable */}
                {isEditMode && (
                  <View style={styles.editBadge} pointerEvents="none">
                    <Icono nombre="lapiz" tamano={18} color="#3E3876" />
                  </View>
                )}
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

        {/* Acciones: mismos botones que el resto de la app, uno al lado del otro */}
        {!loading && (
          <View style={styles.actionsRow}>
            {perfiles.length > 0 && (
              <Button
                title={isEditMode ? 'Listo' : 'Administrar perfiles'}
                icono={isEditMode ? 'check' : 'lapiz'}
                variant={isEditMode ? 'primary' : 'secondary'}
                onPress={() => setIsEditMode(!isEditMode)}
                style={styles.actionButton}
              />
            )}
            <Button
              title="Cerrar sesión"
              variant="danger"
              onPress={() => logout()}
              style={styles.actionButton}
            />
          </View>
        )}
      </ScrollView>
      <LoadingModal visible={loading} text="Buscando perfiles..." />
    </Background>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, width: '100%' },
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20 },
  title: { fontSize: 30, color: '#fff', fontFamily: 'serif', fontWeight: 'bold', marginBottom: 6, textAlign: 'center' },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  profilesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', gap: 30, marginTop: 22 },
  avatarWrapper: { position: 'relative' },
  editBadge: { position: 'absolute', right: 0, top: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 4 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 15, marginTop: 24 },
  actionButton: { width: 240 },
});
