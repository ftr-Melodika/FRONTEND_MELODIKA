// Archivo: src/components/leccion/TheoryStep.js
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../Button';

export function TheoryStep({ textoPrincipal, textoDestacado, onBack, onNext }) {
  return (
    <View style={styles.stepWrapper}>
      <View style={styles.card}>
        <Text style={styles.paragraph}>{textoPrincipal}</Text>
        {textoDestacado && (
          <Text style={styles.paragraphHighlight}>{textoDestacado}</Text>
        )}
      </View>
      <View style={styles.btnRow}>
        <Button title="← Atrás" variant="secondary" onPress={onBack} style={{width: '40%'}} />
        <Button title="¡A Practicar! 🎸" onPress={onNext} style={{width: '40%'}} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepWrapper: { width: '90%', alignItems: 'center' },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 20, padding: 25, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', marginBottom: 20, width: '100%' },
  paragraph: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 16, lineHeight: 26, marginBottom: 15 },
  paragraphHighlight: { color: '#b28cff', fontSize: 18, fontWeight: 'bold', lineHeight: 26 },
  btnRow: { flexDirection: 'row', width: '50%', marginTop: 10, justifyContent: 'space-between' },
});