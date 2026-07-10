
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export function LeccionSidebar({ leccion, paso, onBack }) {
  return (
    <View style={styles.sidebar}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.volver}>← Volver</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>{leccion?.titulo || 'Lección'}</Text>
      <Text style={styles.pasosText}>Paso {paso} de 3</Text>

      <View style={styles.instructionsContainer}> 
        {paso === 1 && <Text style={styles.instructionInfo}>Mirá la técnica que usael profe en el video antes de agarrar la guitarra.</Text>}
        {paso === 2 && <Text style={styles.instructionInfo}>Leé la teoría. Acordate que la cuerda más fina es la 1ra y está abajo.</Text>}
        {paso === 3 && <Text style={styles.instructionInfo}>¡A tocar! Posicioná tus dedos exactamente como marca el mástil.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: { width: '30%', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'flex-start' },
  backButton: { marginBottom: 20, alignSelf: 'flex-start' },
  volver: { color: '#b28cff', fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 24, color: '#fff', fontFamily: 'serif', fontWeight: 'bold', marginBottom: 15 },
  pasosText: { color: '#a3fba3', fontSize: 14, fontWeight: 'bold', marginBottom: 20 },
  instructionsContainer: { flex: 1, justifyContent: 'center' },
  instructionInfo: { color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 22 },
});