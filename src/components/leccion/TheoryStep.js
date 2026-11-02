// Archivo: src/components/leccion/TheoryStep.js
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Button } from '../Button';

// Si es el último paso de la lección, en vez de "Siguiente" mostramos "Terminar Lección"
export const TheoryStep = ({ textoPrincipal, textoDestacado, onBack, onNext, esUltimo, finishing }) => {
  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <Text style={styles.textoPrincipal}>{textoPrincipal}</Text>
        {!!textoDestacado && (
          <View style={styles.destacadoBox}>
            <Text style={styles.textoDestacado}>{textoDestacado}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.btnRow}>
        {onBack ? <Button title="⬅ Atrás" variant="secondary" onPress={onBack} style={styles.btnHalf} /> : null}
        <Button
          title={esUltimo ? 'Terminar Lección' : 'Siguiente 👉'}
          onPress={onNext}
          loading={finishing}
          style={[styles.btnHalf, esUltimo && { backgroundColor: '#4c52d9' }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', justifyContent: 'space-between' },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  textoPrincipal: { color: '#fff', fontSize: 18, textAlign: 'center', marginBottom: 20, lineHeight: 26 },
  destacadoBox: { backgroundColor: 'rgba(178, 140, 255, 0.1)', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#b28cff' },
  textoDestacado: { color: '#a3fba3', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  btnRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 15, paddingTop: 6 },
  btnHalf: { flex: 1 } // Permite que ambos botones ocupen el mismo espacio exacto
});
