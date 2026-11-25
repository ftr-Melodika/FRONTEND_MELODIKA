// Archivo: src/components/canciones/PortadaCancion.js
// El cuadrado redondeado a la izquierda de cada canción: la portada del tema (`portada`, una url)
// o, si no tiene, una clave de sol.
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { ClaveDeSol } from './ClaveDeSol';

const PROPORCION_RADIO = 0.2;
const PROPORCION_CLAVE = 0.62;

export function PortadaCancion({ lado, portada }) {
  const [fallo, setFallo] = useState(false);
  const mostrarImagen = typeof portada === 'string' && portada.length > 0 && !fallo;
  return (
    <View style={[styles.cuadro, { width: lado, height: lado, borderRadius: lado * PROPORCION_RADIO }]}>
      {mostrarImagen
        ? <Image source={{ uri: portada }} style={styles.imagen} contentFit="cover" transition={150} onError={() => setFallo(true)} accessibilityLabel="Portada de la canción" />
        : <ClaveDeSol alto={lado * PROPORCION_CLAVE} />}
    </View>
  );
}

const styles = StyleSheet.create({
  cuadro: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  imagen: { width: '100%', height: '100%' },
});
