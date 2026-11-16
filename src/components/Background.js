import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line } from 'react-native-svg';

// ImageBackground está deprecado desde React Native 0.88 (SDK 58):
// se reemplaza por un View con una Image posicionada en absoluto detrás del contenido.
// Cinco líneas de pentagrama muy tenues sobre un degradé de indigo: la firma visual del rediseño.
function Pentagrama() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
        {[58, 64, 70, 76, 82].map((y) => (
          <Line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#fff" strokeOpacity={0.07} strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
        ))}
      </Svg>
    </View>
  );
}

// variante="partitura": fondo nuevo (degradé + pentagrama). Sin variante queda el fondo de siempre,
// así el rediseño se aplica pantalla por pantalla.
export function Background({ children, style, variante }) {
  if (variante === 'partitura') {
    return (
      <View style={[styles.background, style]}>
        <LinearGradient colors={['#4c52d9', '#3f43c4', '#2b2a86']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
        <Pentagrama />
        <View style={styles.content}>{children}</View>
      </View>
    );
  }
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
