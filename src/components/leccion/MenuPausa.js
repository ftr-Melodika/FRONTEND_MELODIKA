// Archivo: src/components/leccion/MenuPausa.js
// El menú de pausa de la vista inmersiva: se abre al tocar cualquier parte de la pantalla.
// Reanudar, volver atrás o saltear la clase sin XP. Tocar afuera de la tarjeta también reanuda.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../Button';
import { FUENTE_TITULO } from '../../theme/fuentes';

export function MenuPausa({ onReanudar, onVolver, onSaltear, saltando }) {
  return (
    <Pressable style={styles.fondo} onPress={onReanudar} accessibilityLabel="Cerrar el menú de pausa">
      {/* La tarjeta es un Pressable vacío para que tocarla no cierre el menú */}
      <Pressable style={styles.tarjeta} accessible={false}>
        <Text style={styles.titulo}>En pausa</Text>
        <Button title="Reanudar" icono="play" onPress={onReanudar} style={[styles.boton, styles.botonReanudar]} />
        <Button title="Volver atrás" icono="volver" variant="secondary" onPress={onVolver} style={styles.boton} />
        <Button title="Saltear (sin XP)" variant="secondary" onPress={onSaltear} loading={saltando} style={styles.boton} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fondo: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(8,6,28,0.82)', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  tarjeta: { width: 320, maxWidth: '90%', padding: 20, borderRadius: 24, gap: 2, backgroundColor: '#2b2660', borderWidth: 1.5, borderColor: 'rgba(178,140,255,0.6)' },
  titulo: { color: '#fff', fontSize: 24, fontFamily: FUENTE_TITULO, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  boton: { marginVertical: 4 },
  botonReanudar: { backgroundColor: '#4c52d9' },
});
