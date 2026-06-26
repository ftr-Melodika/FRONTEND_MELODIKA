import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { obtenerPerfiles } from '../services/perfilService';
import ProfileAvatar from '../components/perfiles/ProfileAvatar';
import EmptyProfiles from '../components/perfiles/EmptyProfiles';

const ProfileSelectionScreen = ({ navigation }) => {
  const [perfiles, setPerfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Al separar la función evitamos advertencias de promesas en el useEffect
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await obtenerPerfiles();
      if (response.success) {
        setPerfiles(response.data);
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const manejarSeleccionPerfil = (perfil) => {
    // Acá iría el POST /api/perfiles/:id/racha o guardar el perfil actual en un Context/Redux
    console.log(`Perfil seleccionado: ${perfil.nombre}`);
    navigation.navigate('Home', { perfilId: perfil.id }); 
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Reintentar" onPress={cargarDatos} />
      </View>
    );
  }

  if (perfiles.length === 0) {
    return <EmptyProfiles onCrearPerfil={() => navigation.navigate('CreateProfileScreen')} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>¿Quién está jugando hoy?</Text>
      <FlatList
        data={perfiles}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => (
          <ProfileAvatar 
            perfil={item} 
            onPress={() => manejarSeleccionPerfil(item)} 
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: 60,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F7FA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#D8000C',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  }
});

export default ProfileSelectionScreen;