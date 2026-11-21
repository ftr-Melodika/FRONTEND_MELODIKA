import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image'; // Guarda la imagen ya decodificada: no se vuelve a cargar en cada pantalla
import { IMAGEN_FONDO } from '../utils/precarga';

// ImageBackground está deprecado desde React Native 0.88 (SDK 58):
// se reemplaza por un View con una Image posicionada en absoluto detrás del contenido.
export function Background({ children, style }) {
  return (
    <View style={[styles.background, style]}>
      <Image
        source={IMAGEN_FONDO}
        style={styles.image}
        contentFit="fill"
        transition={0}
        cachePolicy="memory-disk"
        priority="high"
      />
      <View style={styles.overlay} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    // Color parecido al de la imagen: mientras carga se ve este y no un fondo blanco
    backgroundColor: '#4f54c8',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: '-5%',
    width: '110%',
    height: '105%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#715AB6',
    opacity: 0.4,
  },
  content: {
    flex: 1,
    width: '100%',
    // Las pantallas ocupan todo el ancho. Las que quieren una tarjeta centrada
    // (Login, Register...) lo piden ellas mismas con alignSelf: 'center'.
    alignItems: 'stretch',
    justifyContent: 'center'
  },
});

export default Background;
