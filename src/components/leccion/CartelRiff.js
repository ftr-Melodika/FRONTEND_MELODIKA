// Archivo: src/components/leccion/CartelRiff.js
// Los carteles que aparecen sobre el mástil del riff en la vista inmersiva (sin botones fijos):
// un cartel con el resultado (y sus botones, si hacen falta) y un aviso corto que no se toca.
import { StyleSheet, Text, View } from 'react-native';
import { FUENTE_TITULO } from '../../theme/fuentes';

// tono: 'normal' (violeta), 'bien' (verde) o 'error' (rojo)
export function CartelRiff({ titulo, texto, tono = 'normal', children }) {
  return (
    <View style={[styles.cartel, tono === 'bien' && styles.cartelBien, tono === 'error' && styles.cartelError]} accessibilityLiveRegion="polite">
      {titulo ? <Text style={styles.titulo}>{titulo}</Text> : null}
      {texto ? <Text style={styles.texto}>{texto}</Text> : null}
      {children ? <View style={styles.acciones}>{children}</View> : null}
    </View>
  );
}

// tono: 'normal' o 'aviso' (amarillo)
export function AvisoRiff({ texto, tono = 'normal' }) {
  return (
    <View style={[styles.aviso, tono === 'aviso' && styles.avisoAmarillo]} accessibilityLiveRegion="polite">
      <Text style={[styles.avisoTexto, tono === 'aviso' && styles.avisoTextoAmarillo]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cartel: {
    minWidth: 280, maxWidth: 460, paddingHorizontal: 22, paddingVertical: 16, borderRadius: 22, alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(43,38,96,0.96)', borderWidth: 2, borderColor: '#b28cff',
  },
  cartelBien: { backgroundColor: 'rgba(22,84,46,0.96)', borderColor: '#a3fba3' },
  cartelError: { backgroundColor: 'rgba(96,30,44,0.96)', borderColor: '#ffb3bd' },
  titulo: { color: '#fff', fontSize: 24, fontFamily: FUENTE_TITULO, fontWeight: 'bold', textAlign: 'center' },
  texto: { color: 'rgba(255,255,255,0.92)', fontSize: 15, textAlign: 'center' },
  acciones: { alignSelf: 'stretch', alignItems: 'center', gap: 6, marginTop: 4 },
  aviso: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.6)' },
  avisoAmarillo: { backgroundColor: 'rgba(255,211,92,0.95)' },
  avisoTexto: { color: '#fff', fontSize: 15, fontWeight: 'bold', textAlign: 'center' },
  avisoTextoAmarillo: { color: '#2b2660' },
});
