// Archivo: src/components/leccion/VideoStep.js
import React from 'react';
import { View, Text, TouchableOpacity, Image, Linking, StyleSheet } from 'react-native';
import { Button } from '../Button'; // Ajustá la ruta si hace falta

export const VideoStep = ({ videoId, title, onNext }) => {
  const openYouTube = () => {
    Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
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
      </View>
      
      <View style={styles.footer}>
        <Button
          title="Ya lo vi, seguir 👉"
          onPress={onNext}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#fff' },
  card: { borderRadius: 12, overflow: 'hidden', position: 'relative', backgroundColor: '#000', width: '100%', maxWidth: 500 },
  thumbnail: { width: '100%', height: 200, opacity: 0.8 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  playText: { color: '#fff', fontSize: 18, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 8 },
  footer: { width: '100%', paddingTop: 15 }
});