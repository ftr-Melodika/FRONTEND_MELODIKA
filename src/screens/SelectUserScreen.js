import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Background } from '../components/Background';
import { ENDPOINTS } from '../config/api';

export function SelectUserScreen({ route, navigation }) {
  const { cuenta, token } = route.params || {};
  
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPerfiles() {
      try {
        const response = await fetch(ENDPOINTS.obtenerPerfiles, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Error al cargar los perfiles');
        }
        
        setPerfiles(Array.isArray(data.data) ? data.data : []);

      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    }

    if (cuenta?.id && token) fetchPerfiles();
  }, [cuenta, token]);

  return (
    <Background>
      <View style={styles.container}>
        <Text style={styles.title}>¿Quién va a tocar hoy?</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#b28cff" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.profilesRow}>
            {perfiles.map((perfil) => (
              <TouchableOpacity
                key={perfil.id}
                style={styles.profileWrapper}
                onPress={() => navigation.replace('Home', { cuenta, perfil, token })}
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
                onPress={() => navigation.navigate('CreateUser', { cuenta, token })}
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
    gap: 30,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderStyle: 'dashed',
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