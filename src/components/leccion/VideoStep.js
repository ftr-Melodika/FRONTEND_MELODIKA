import React from 'react';
import { View, Text, TouchableOpacity, Image, Linking, StyleSheet } from 'react-native';

export const VideoStep = ({ videoId, title }) => {
  const openYouTube = () => {
    // Esto abre el video de forma nativa fuera de tu app, evitando crashes
    Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={openYouTube} style={styles.card}>
        <Image 
          source={{ uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }} 
          style={styles.thumbnail} 
        />
        <View style={styles.overlay}>
          <Text style={styles.playText}>▶ Reproducir video</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 20 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  thumbnail: { width: '100%', height: 200, opacity: 0.8 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playText: { color: '#fff', fontSize: 18, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 8 }
});