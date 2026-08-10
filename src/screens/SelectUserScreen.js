// Archivo: src/screens/SelectUserScreen.js
import { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Background } from '../components/Background';
import { AuthContext } from '../context/AuthContext';
import { perfilesService } from '../services/perfilesService';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { Button } from '../components/Button';
import { LoadingModal } from '../components/LoadingModal';

export function SelectUserScreen({ navigation }) {
  const { logout, actualizarPerfil } = useContext(AuthContext);
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 👇 1. NUEVO ESTADO: Controla si estamos administrando perfiles
  const [isEditMode, setIsEditMode] = useState(false); 

  // Como los perfiles pueden cambiar en la pantalla de edición,
  // movemos el fetch a una función que se ejecute cada vez que la pantalla gana foco (focus)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPerfiles();
    });
    return unsubscribe;
  }, [navigation]);

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
                    // Pasamos el perfil completo a la nueva función
                    onPress={() => handleActionPerfil(perfil)} 
                  />
                  {/* Pequeño indicador visual de que es editable */}
                  {isEditMode && <Text style={styles.editText}>✏️</Text>}
                </View>
              ))}
              
              {/* Si estamos editando, ocultamos el botón de agregar */}
              {!isEditMode && perfiles.length < 3 && (
                <ProfileAvatar 
                  isAddButton={true}
                  onPress={() => navigation.navigate('CreateUser')} 
                />
              )}
            </View>
          )}

          {/* 👇 3. BOTÓN PARA ACTIVAR/DESACTIVAR MODO EDICIÓN */}
          {!loading && perfiles.length > 0 && (
             <Button 
               title={isEditMode ? "Listo" : "Administrar perfiles"} 
               variant="link" 
               onPress={() => setIsEditMode(!isEditMode)} 
               style={{ marginTop: 40 }}
             />
          )}

        </View>
        
        <Button 
          title="Cerrar sesión" 
          variant="secondary" 
          onPress={() => logout()}
          style={{ minWidth: 160, maxWidth: 220, paddingVertical: 8, borderRadius: 18 }}
          textStyle={{ fontSize: 12, fontWeight: '600' }}
        />
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 24 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  title: { fontSize: 32, color: '#fff', fontFamily: 'serif', fontWeight: 'bold', marginBottom: 40 },
  profilesRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 30 },
  // Estilos visuales para el modo edición
  editWrapper: { opacity: 0.8, alignItems: 'center' },
  editText: { position: 'absolute', top: -10, right: -10, fontSize: 24 } 
});