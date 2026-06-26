import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from '../Button'; // Reutilizá el de tus compañeros si existe

const EmptyProfiles = ({ onCrearPerfil }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Todavía no tenés perfiles</Text>
      <Text style={styles.subtitle}>Creá uno para empezar a guardar tu progreso y racha diaria.</Text>
      <Button title="Crear mi primer perfil" onPress={onCrearPerfil} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  }
});

export default EmptyProfiles;