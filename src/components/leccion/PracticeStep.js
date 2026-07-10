
import { View, StyleSheet } from 'react-native';
import { Button } from '../Button';
import { GuitarNeck } from './GuitarNeck'; 

export function PracticeStep({ onBack, onFinish, trasteObjetivo, dotLeft, dotBottom }) {
  return (
    <View style={styles.stepWrapper}>
      
      <GuitarNeck 
        targetNumber={trasteObjetivo} 
        dotLeft={dotLeft} 
        dotBottom={dotBottom} 
      />

      <View style={styles.btnRow}>
        <Button title="← Atrás" variant="secondary" onPress={onBack} style={{width: '40%'}} />
        <Button title="Terminar Lección ✔️" onPress={onFinish} style={{width: '40%', backgroundColor: '#4c52d9'}} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepWrapper: { width: '90%', alignItems: 'center' },
  btnRow: { flexDirection: 'row', width: '50%', marginTop: 10, justifyContent: 'space-between' },
});