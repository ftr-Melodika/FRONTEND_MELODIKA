import { useState, useEffect, useContext } from 'react'; // 👈 Importamos useContext
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
// ❌ Borramos AsyncStorage
import { Background } from '../components/Background';
import { ENDPOINTS } from '../config/api';

// 👈 Importamos la nube y el cartero
import { AuthContext } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';

export function SelectUserScreen({ navigation }) {
  // 👈 1. Traemos los datos de la cuenta y la función de deslogueo directo del altoparlante
  const { userData, logout } = useContext(AuthContext); 
  const { userData: cuenta } = useContext(AuthContext);
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPerfiles() {
      try {
        // 👈 2. LA MAGIA DE AXIOS: Mirá lo cortito que es esto. ¡El token viaja solo!
        const response = await axiosClient.get(ENDPOINTS.obtenerPerfiles);
        
        // Axios devuelve el JSON adentro de la propiedad ".data".
        // Como tu backend devuelve { success: true, data: [...] }, usamos response.data.data
        const perfilesData = response.data.data;
        setPerfiles(Array.isArray(perfilesData) ? perfilesData : []);

      } catch (error) {
        // 👈 3. PROTECCIÓN ANTI-TOKENS VENCIDOS
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          Alert.alert('Sesión Expirada ⏰', 'Tu sesión venció por seguridad. Volvé a ingresar.');
          await logout(); // El context borra los datos y el AppNavigator te manda al Login solo
          return;
        }
        
        // Si es otro tipo de error (ej: backend apagado)
        Alert.alert('Error', error.response?.data?.message || 'Error al cargar los perfiles');
      } finally {
        setLoading(false);
      }
    }

    fetchPerfiles();
  }, []);

  // 👈 4. Función de escape súper limpia
  const handleLogoutApp = async () => {
    await logout();
  };

  return (
    <Background>
      <View style={styles.container}>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutApp}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.title}>¿Quién va a tocar hoy?</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#b28cff" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.profilesRow}>
            {perfiles.map((perfil) => (
              <TouchableOpacity
                key={perfil.id}
                style={styles.profileWrapper}
                // Al ir al Home ya no hace falta pasar el token, el Home lo puede sacar del Context si lo necesita
                onPress={() => navigation.replace('Home', { perfil })}
                activeOpacity={0.8}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>{perfil.nombre.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.profileName} numberOfLines={1}>{perfil.nombre}</Text>
              </TouchableOpacity>
            ))}

            {perfiles.length < 3 && (
              <TouchableOpacity
                style={styles.profileWrapper}
                onPress={() => navigation.navigate('CreateUser')}
                activeOpacity={0.8}
              >
                <View style={[styles.avatarCircle, styles.addCircle]}>
                  <Text style={styles.addIcon}>+</Text>
                </View>
                <Text style={styles.profileName}>Nuevo perfil</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  // ... (Tus estilos se mantienen exactamente iguales)
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoutButton: { position: 'absolute', top: 50, right: 20, padding: 10 },
  logoutText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecorationLine: 'underline' },
  title: { fontSize: 32, color: '#fff', fontFamily: 'serif', fontWeight: 'bold', marginBottom: 40, textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  profilesRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 30 },
  profileWrapper: { alignItems: 'center', width: 100 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#b28cff', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6, marginBottom: 12 },
  addCircle: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.4)', borderStyle: 'dashed' },
  avatarInitial: { fontSize: 48, color: '#fff', fontWeight: 'bold' },
  addIcon: { fontSize: 54, color: '#fff', fontWeight: '300', marginTop: -4 },
  profileName: { fontSize: 18, color: '#fff', fontWeight: '600', textAlign: 'center' },
});