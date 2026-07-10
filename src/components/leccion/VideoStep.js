
import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Button } from '../Button'; // Importamos tu súper-botón

export function VideoStep({ videoId, onNext }) {
  const [playing, setPlaying] = useState(false);

  const onStateChange = useCallback((state) => {
    if (state === 'ended') setPlaying(false);
  }, []);

  return (
    <View style={styles.stepWrapper}>
      <View style={styles.videoBox}>
        <YoutubePlayer 
          height={240} 
          width={'100%'} 
          play={playing} 
          videoId={videoId || "6yKz57b0wG8"} 
          onChangeState={onStateChange} 
        />
      </View>
      <Button title="Siguiente: Conceptos Clave →" onPress={onNext} style={styles.actionBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  stepWrapper: { width: '90%', alignItems: 'center' },
  videoBox: { width: '100%', borderRadius: 15, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 20, backgroundColor: '#000' },
  actionBtn: { width: '100%', maxWidth: 300 },
});