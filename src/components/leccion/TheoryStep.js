// Archivo: src/components/leccion/TheoryStep.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../Button';

export const TheoryStep = ({ textoPrincipal, textoDestacado, onBack, onNext }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.textoPrincipal}>{textoPrincipal}</Text>
        <View style={styles.destacadoBox}>
          <Text style={styles.textoDestacado}>{textoDestacado}</Text>
        </View>
      </View>
      
      <View style={styles.btnRow}>
        <Button title="⬅ Atrás" variant="secondary" onPress={onBack} style={styles.btnHalf} />
        <Button title="Siguiente 👉" onPress={onNext} style={styles.btnHalf} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  textoPrincipal: { color: '#fff', fontSize: 18, textAlign: 'center', marginBottom: 20, lineHeight: 26 },
  destacadoBox: { backgroundColor: 'rgba(178, 140, 255, 0.1)', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#b28cff' },
  textoDestacado: { color: '#a3fba3', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  btnRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 15, paddingTop: 15 },
  btnHalf: { flex: 1 } // Permite que ambos botones ocupen el mismo espacio exacto
});