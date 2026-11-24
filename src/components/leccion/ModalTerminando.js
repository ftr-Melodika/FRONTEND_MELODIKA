// Archivo: src/components/leccion/ModalTerminando.js
// Lo que se ve mientras se guarda el progreso al terminar una clase: una ruedita y "Terminando clase".
// Es una capa sobre la pantalla (no un Modal nativo) que tapa todo y se come los toques, para que
// no se pueda disparar un segundo envío. Si el guardado falla, desaparece antes del aviso de error.
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { FUENTE_TITULO } from '../../theme/fuentes';

export function ModalTerminando({ visible }) {
  if (!visible) return null;
  return (
    <View style={styles.fondo} accessibilityViewIsModal accessibilityLiveRegion="polite">
      <View style={styles.tarjeta}>
        <ActivityIndicator size="large" color="#b28cff" />
        <Text style={styles.texto}>Terminando clase</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(8,6,28,0.8)', alignItems: 'center', justifyContent: 'center', zIndex: 100, elevation: 100 },
  tarjeta: { minWidth: 220, paddingVertical: 22, paddingHorizontal: 30, borderRadius: 22, alignItems: 'center', gap: 12, backgroundColor: '#2b2660', borderWidth: 1.5, borderColor: 'rgba(178,140,255,0.6)' },
  texto: { color: '#fff', fontSize: 18, fontFamily: FUENTE_TITULO, fontWeight: 'bold' },
});
