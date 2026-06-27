import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Background } from '../components/Background';
import { ENDPOINTS } from '../config/api';

export function SelectUserScreen({ route, navigation }) {
  // Recibimos la cuenta que acaba de iniciar sesión (o registrarse)
  const cuenta = route.params?.cuenta;
  const token = route.params?.token || cuenta?.token || route.params?.cuenta?.token;
  
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Apenas carga la pantalla, vamos a buscar los perfiles de esta cuenta
  useEffect(() => {
    async function fetchPerfiles() {
      try {
        const response = await fetch(ENDPOINTS.obtenerPerfiles(cuenta.id), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const textResponse = await response.text();
        let data = null;

        if (textResponse) {
          try {
            data = JSON.parse(textResponse);
          } catch (e) {
            throw new Error(`El servidor respondió con un formato inesperado (${response.status}). Revisá que el backend esté corriendo y que la URL sea correcta.`);
          }
        }
        
        if (response.ok) {
          // data debería ser un array de perfiles: [{id: 1, nombre: 'Gasti'}, ...]
          setPerfiles(Array.isArray(data) ? data : []);
        } else {
          throw new Error(data?.message || `Error al cargar los perfiles (${response.status})`);
        }
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    }

    if (cuenta?.id) {
      fetchPerfiles();
    }
  }, [cuenta, token]);

  // Al tocar un perfil existente -> Vamos directo al Home (Cursos)
  const handleSelectProfile = (perfil) => {
    navigation.replace('Home', { cuenta, perfil });
  };

  // Al tocar el "+" -> Vamos a la pantalla de crear perfil
  const handleAddProfile = () => {
    navigation.navigate('CreateUser', { cuenta, token });
  };

  return (
    <Background>
      <View style={styles.container}>
        <Text style={styles.title}>¿Quién va a tocar hoy?</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#b28cff" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.profilesRow}>
            
            {/* Dibujamos los perfiles que ya existen */}
            {perfiles.map((perfil) => (
              <TouchableOpacity
                key={perfil.id}
                style={styles.profileWrapper}
                onPress={() => handleSelectProfile(perfil)}
                activeOpacity={0.8}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>
                    {perfil.nombre.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.profileName} numberOfLines={1}>
                  {perfil.nombre}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Condición: Si hay MENOS de 3 perfiles, mostramos el botón "+" */}
            {perfiles.length < 3 && (
              <TouchableOpacity
                style={styles.profileWrapper}
                onPress={handleAddProfile}
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    color: '#fff',
    fontFamily: 'serif',
    fontWeight: 'bold',
    marginBottom: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  profilesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30, // Espacio entre cada circulito
  },
  profileWrapper: {
    alignItems: 'center',
    width: 100,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#b28cff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 12,
  },
  addCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Fondo cristalino para el "+"
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderStyle: 'dashed', // Borde punteado para diferenciarlo
  },
  avatarInitial: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  addIcon: {
    fontSize: 54,
    color: '#fff',
    fontWeight: '300',
    marginTop: -4,
  },
  profileName: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
});