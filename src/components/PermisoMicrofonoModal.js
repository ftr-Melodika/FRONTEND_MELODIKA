// Archivo: src/components/PermisoMicrofonoModal.js
// Antes del cartel del sistema: para qué quiere Melodika el micrófono.
import { Modal, View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { FUENTE_TITULO } from '../theme/fuentes';

export function PermisoMicrofonoModal({ visible, onPermitir, onOmitir }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onOmitir}
      supportedOrientations={['landscape', 'landscape-left', 'landscape-right', 'portrait']}
    >
      <View style={styles.fondo}>
        <View style={styles.tarjeta}>
          <Text style={styles.titulo}>Melodika quiere escucharte 🎤</Text>
          <Text style={styles.texto}>
            Usamos el micrófono para reconocer lo que tocás y, mientras no estás tocando, para medir el ruido del lugar.
          </Text>
          <Text style={styles.texto}>El audio se procesa en tu celular: no se guarda ni se envía.</Text>
          <Text style={styles.ayuda}>El detalle está en el menú, en Soporte → Uso del micrófono.</Text>
          <View style={styles.botones}>
            <Button title="Ahora no" variant="secondary" onPress={onOmitir} style={styles.boton} />
            <Button title="Permitir" onPress={onPermitir} style={styles.boton} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  tarjeta: { width: '100%', maxWidth: 480, backgroundColor: '#4c52d9', borderRadius: 24, paddingVertical: 18, paddingHorizontal: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  titulo: { color: '#fff', fontSize: 20, fontFamily: FUENTE_TITULO, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  texto: { color: '#fff', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 6 },
  ayuda: { color: 'rgba(255,255,255,0.75)', fontSize: 12, textAlign: 'center' },
  botones: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 8 },
  boton: { flex: 1 },
});
