// Archivo: src/screens/SelectUserScreen.js
import { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Background } from '../components/Background';
import { AuthContext } from '../context/AuthContext';

// 1. Importamos al servicio
import { perfilesService } from '../services/perfilesService';
// 2. Importamos a nuestros especialistas visuales
import { ProfileAvatar } from '../components/ProfileAvatar';
import { Button } from '../components/Button';


export function SelectUserScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPerfiles() {
      try {
        // El servicio nos trae los datos limpios
        const perfilesData = await perfilesService.obtenerPerfiles();
        setPerfiles(Array.isArray(perfilesData) ? perfilesData : []);
      } catch (error) {
        // Si el servicio nos avisa que el token venció, deslogueamos
        if (error.isAuthError) {
          Alert.alert('Sesión Expirada ⏰', 'Tu sesión venció por seguridad. Volvé a ingresar.');
          await logout();
          return;
        }
        // Si es un error común, mostramos el mensaje traducido
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPerfiles();
  }, []);

  return (
    <Background>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>¿Quién va a tocar hoy?</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#b28cff" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.profilesRow}>
              
              {perfiles.map((perfil) => (
                <ProfileAvatar 
                  key={perfil.id}
                  nombre={perfil.nombre}
                  onPress={() => navigation.replace('Home', { perfil })}
                />
              ))}

              {perfiles.length < 3 && (
                <ProfileAvatar 
                  isAddButton={true}
                  onPress={() => navigation.navigate('CreateUser')}
                />
              )}
              
            </View>
          )}
        </View>

        {/* 👇 Nuestro nuevo componente modular en acción */}
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

// Estilos reducidos al mínimo indispensable para el layout de la pantalla
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 24 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  title: { fontSize: 32, color: '#fff', fontFamily: 'serif', fontWeight: 'bold', marginBottom: 40, textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  profilesRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 30 },
});