// Archivo: src/components/leccion/PracticeStep.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from '../Button';
import { GuitarNeck } from './GuitarNeck';

export function PracticeStep({ onBack, onFinish, trasteObjetivo, dotLeft, dotBottom }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <GuitarNeck
          targetNumber={trasteObjetivo}
          dotLeft={dotLeft}
          dotBottom={dotBottom}
        />
      </View>
      
      <View style={styles.btnRow}>
        <Button title="⬅ Atrás" variant="secondary" onPress={onBack} style={styles.btnHalf} />
        <Button title="Terminar Lección" onPress={onFinish} style={[styles.btnHalf, { backgroundColor: '#4c52d9' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  btnRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 15, paddingTop: 15 },
  btnHalf: { flex: 1 }
});