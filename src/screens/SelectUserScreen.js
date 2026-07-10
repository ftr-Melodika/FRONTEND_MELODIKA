import { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Background } from '../components/Background';
import { AuthContext } from '../context/AuthContext';
import { perfilesService } from '../services/perfilesService';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { Button } from '../components/Button';
import { LoadingModal } from '../components/LoadingModal'; // 👈 Importado

export function SelectUserScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPerfiles() {
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
    fetchPerfiles();
  }, []);

  return (
    <Background>
      {/* 👇 Tapamos todo mientras carga */}
      <LoadingModal visible={loading} text="Buscando perfiles..." />

      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>¿Quién va a tocar hoy?</Text>
          
          {!loading && (
            <View style={styles.profilesRow}>
              {perfiles.map((perfil) => (
                <ProfileAvatar key={perfil.id} nombre={perfil.nombre} onPress={() => navigation.replace('Home', { perfil })} />
              ))}
              {perfiles.length < 3 && (
                <ProfileAvatar isAddButton={true} onPress={() => navigation.navigate('CreateUser')} />
              )}
            </View>
          )}
        </View>

        <Button 
          title="Cerrar sesión" variant="secondary" onPress={() => logout()}
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
});