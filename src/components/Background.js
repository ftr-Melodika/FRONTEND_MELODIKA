import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

// ImageBackground está deprecado desde React Native 0.88 (SDK 58):
// se reemplaza por un View con una Image posicionada en absoluto detrás del contenido.
export function Background({ children, style }) {
  return (
    <View style={[styles.background, style]}>
      <Image
        source={require('../../assets/background.png')}
        style={styles.image}
        resizeMode="stretch"
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
