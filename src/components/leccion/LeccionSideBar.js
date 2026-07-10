// Archivo: src/components/leccion/LeccionSidebar.js
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export function LeccionSidebar({ leccion, paso, onBack, instrucciones }) {
  
  // Si la lección no trae instrucciones propias desde la base de datos, usamos estas por defecto
  const textosPorDefecto = [
    "Mirá la técnica que usa el profe en el video antes de agarrar la guitarra.",
    "Leé la teoría. Acordate que la cuerda más fina es la 1ra y está abajo.",
    "¡A tocar! Posicioná tus dedos exactamente como marca el mástil."
  ];

  // Definimos qué lista de textos vamos a usar
  const listaInstrucciones = instrucciones || textosPorDefecto;

  return (
    <View style={styles.sidebar}>
     <Button 
        title="← Volver" 
        variant="link" 
        onPress={onBack} 
        style={styles.backButton}
        textStyle={styles.volverText} 
      />
      
      <Text style={styles.title}>{leccion?.titulo || 'Lección'}</Text>
      <Text style={styles.pasosText}>Paso {paso} de {listaInstrucciones.length}</Text>

      <View style={styles.instructionsContainer}> 
        {/* Magia pura: El paso 1 es el índice 0 del array, el paso 2 el índice 1, etc. */}
        <Text style={styles.instructionInfo}>
          {listaInstrucciones[paso - 1]}
        </Text>
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