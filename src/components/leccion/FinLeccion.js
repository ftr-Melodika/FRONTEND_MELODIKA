// Archivo: src/components/leccion/FinLeccion.js
// Lo que se ve al terminar una lección: cuánto XP sumó y el botón para seguir con la siguiente.
import { View, Text, StyleSheet } from 'react-native';
import { Icono, COLORES_ICONO } from '../icono/Icono';
import { Button } from '../Button';
import { FUENTE_TITULO } from '../../theme/fuentes';

export function FinLeccion({ titulo, mensaje, icono = 'trofeo', siguiente, onSiguiente, onVolver }) {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <Icono nombre={icono} tamano={64} acento={COLORES_ICONO.oro} />
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.mensaje}>{mensaje}</Text>
      {siguiente && <Text style={styles.proxima} numberOfLines={1}>Sigue: {siguiente.titulo}</Text>}

      <View style={styles.botones}>
        <Button title="Volver al curso" icono="volver" variant="secondary" onPress={onVolver} style={styles.boton} />
        {siguiente && <Button title="Siguiente ejercicio" iconoDerecha="adelante" onPress={onSiguiente} style={[styles.boton, styles.botonSiguiente]} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10 },
  titulo: { color: '#fff', fontSize: 26, fontWeight: 'bold', fontFamily: FUENTE_TITULO, textAlign: 'center', marginTop: 6 },
  mensaje: { color: '#fff', fontSize: 15, textAlign: 'center' },
  proxima: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
  botones: { flexDirection: 'row', gap: 15, width: '100%', maxWidth: 520, marginTop: 10 },
  boton: { flex: 1 },
  botonSiguiente: { backgroundColor: '#4c52d9' },
});
