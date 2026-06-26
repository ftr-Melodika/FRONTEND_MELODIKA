import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

const ProfileAvatar = ({ perfil, onPress }) => {
  // Extraemos la primera letra del nombre a modo de avatar default
  const inicial = perfil.nombre ? perfil.nombre.charAt(0).toUpperCase() : '?';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarCircle}>
        <Text style={styles.inicial}>{inicial}</Text>
      </View>
      <Text style={styles.nombre} numberOfLines={1}>{perfil.nombre}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    margin: 15,
    width: 100,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#4A90E2', // Podés dinamizarlo si el backend envía color
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4, // Sombra en Android
    shadowColor: '#000', // Sombra en iOS
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  inicial: {
    fontSize: 36,
    color: '#FFF',
    fontWeight: 'bold',
  },
  nombre: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  }
});

export default ProfileAvatar;