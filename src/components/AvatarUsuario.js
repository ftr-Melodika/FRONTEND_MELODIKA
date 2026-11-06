// Archivo: src/components/AvatarUsuario.js
// Foto de un usuario, o su inicial si no tiene foto o no se pudo cargar.
import { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export function AvatarUsuario({ nombre, foto, tamano = 44 }) {
  const [fotoRota, setFotoRota] = useState(false);
  const circulo = { width: tamano, height: tamano, borderRadius: tamano / 2 };

  if (foto && !fotoRota) {
    return <Image source={{ uri: foto }} style={[styles.base, circulo]} onError={() => setFotoRota(true)} />;
  }
  return (
    <View style={[styles.base, styles.sinFoto, circulo]}>
      <Text style={[styles.inicial, { fontSize: tamano * 0.42 }]}>{(nombre || '?').charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 1, borderColor: '#b28cff' },
  sinFoto: { backgroundColor: '#b28cff', justifyContent: 'center', alignItems: 'center' },
  inicial: { color: '#fff', fontWeight: 'bold' },
});
