import React from 'react';
import { ImageBackground, View, StyleSheet } from 'react-native';

export function Background({ children, style }) {
  return (
    <ImageBackground
      source={require('../../assets/background.png')}
      style={[styles.background, style]}
      resizeMode="stretch"
      imageStyle={styles.image}
    >
      <View style={styles.overlay} />
      <View style={styles.content}>{children}</View>
    </ImageBackground>
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
    width: '110%',
    height: '105%',
    marginLeft: '-5%',
  },
  overlay: { //el overlay esta SOBRE la imagen de fondo, pero abajo del contenido
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#715AB6',
    opacity: 0.4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Background;
