// Archivo: src/components/leccion/VideoStep.js
import React from 'react';
import { View, Text, TouchableOpacity, Image, Linking, StyleSheet } from 'react-native';
import { Button } from '../Button';

export const VideoStep = ({ videoId, title, onNext }) => {
  const openYouTube = () => {
    Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      <TouchableOpacity onPress={openYouTube} style={styles.card}>
        <Image
          source={{ uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
          style={styles.thumbnail}
        />
        <View style={styles.overlay}>
          <Text style={styles.playText}>▶ Reproducir video</Text>
        </View>
      </TouchableOpacity>

      <Button
        title="Ya lo vi, seguir →"
        onPress={onNext}
        style={{ marginTop: 15 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 20, width: '90%', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#fff' },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
    width: '100%',
  },
  thumbnail: { width: '100%', height: 200, opacity: 0.8 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playText: { color: '#fff', fontSize: 18, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 8 },
});