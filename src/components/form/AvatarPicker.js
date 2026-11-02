// Archivo: src/components/form/AvatarPicker.js
// Elegir la foto de perfil desde la galería del teléfono.
// La imagen se recorta cuadrada, se achica a 256px y se manda al backend como data URI (base64)
// en el mismo campo avatarUrl, así no hace falta un servidor de archivos aparte.
import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const TAMANO_FINAL = 256;

export function AvatarPicker({ value, onChange, nombre, permitirQuitar = true }) {
  const [procesando, setProcesando] = useState(false);
  const inicial = nombre ? nombre.trim().charAt(0).toUpperCase() : '🙂';

  const elegirFoto = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para elegir la imagen de perfil.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (resultado.canceled || !resultado.assets?.length) return;

    setProcesando(true);
    try {
      // Achicamos la imagen para que pese poco (unos pocos KB)
      const contexto = ImageManipulator.manipulate(resultado.assets[0].uri);
      contexto.resize({ width: TAMANO_FINAL, height: TAMANO_FINAL });
      const imagen = await contexto.renderAsync();
      const guardada = await imagen.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
      onChange(`data:image/jpeg;base64,${guardada.base64}`);
    } catch (error) {
      console.log('Error procesando la foto:', error);
      Alert.alert('Error', 'No pudimos procesar la imagen. Probá con otra.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={elegirFoto} activeOpacity={0.8} style={styles.circulo} disabled={procesando}>
        {procesando ? (
          <ActivityIndicator color="#fff" />
        ) : value ? (
          <Image source={{ uri: value }} style={styles.imagen} />
        ) : (
          <Text style={styles.inicial}>{inicial}</Text>
        )}
        <View style={styles.camara}>
          <Text style={styles.camaraIcono}>📷</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.acciones}>
        <TouchableOpacity onPress={elegirFoto} disabled={procesando}>
          <Text style={styles.link}>{value ? 'Cambiar foto' : 'Elegir foto (opcional)'}</Text>
        </TouchableOpacity>
        {permitirQuitar && !!value && (
          <TouchableOpacity onPress={() => onChange('')} disabled={procesando}>
            <Text style={[styles.link, styles.quitar]}>Quitar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 14 },
  circulo: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#b28cff', borderWidth: 3, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  imagen: { width: '100%', height: '100%', borderRadius: 45 },
  inicial: { color: '#fff', fontSize: 38, fontWeight: 'bold' },
  camara: { position: 'absolute', right: -4, bottom: -4, width: 32, height: 32, borderRadius: 16, backgroundColor: '#3E3876', borderWidth: 2, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  camaraIcono: { fontSize: 14 },
  acciones: { flexDirection: 'row', gap: 18, marginTop: 8 },
  link: { color: '#fff', fontSize: 14, textDecorationLine: 'underline' },
  quitar: { color: '#ff9eaa' },
});
