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