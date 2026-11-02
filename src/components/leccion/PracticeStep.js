// Archivo: src/components/leccion/PracticeStep.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../Button';
import { GuitarNeck } from './GuitarNeck';

export function PracticeStep({ onBack, onFinish, finishing, trasteObjetivo, cuerda, notaEsperada, dotLeft, dotBottom }) {
  const hayCuerda = cuerda !== null && cuerda !== undefined;
  const hayTraste = trasteObjetivo !== null && trasteObjetivo !== undefined;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {(hayCuerda || hayTraste || notaEsperada) && (
          <Text style={styles.consigna}>
            {hayCuerda ? `Cuerda ${cuerda}` : ''}
            {hayCuerda && hayTraste ? '  •  ' : ''}
            {hayTraste ? (Number(trasteObjetivo) === 0 ? 'Al aire' : `Traste ${trasteObjetivo}`) : ''}
            {notaEsperada ? `  •  Nota: ${notaEsperada}` : ''}
          </Text>
        )}
        <GuitarNeck
          targetNumber={trasteObjetivo}
          cuerda={cuerda}
          dotLeft={dotLeft}
          dotBottom={dotBottom}
        />
      </View>

      <View style={styles.btnRow}>
        {onBack ? <Button title="⬅ Atrás" variant="secondary" onPress={onBack} style={styles.btnHalf} /> : null}
        <Button title="Terminar Lección" onPress={onFinish} loading={finishing} style={[styles.btnHalf, { backgroundColor: '#4c52d9' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  consigna: { color: '#a3fba3', fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  btnRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 15, paddingTop: 4 },
  btnHalf: { flex: 1 }
});
