// Archivo: src/components/leccion/IntroPractica.js
// La pantalla de antes de arrancar una práctica en la vista inmersiva: qué clase es, cuánto XP da y
// la instrucción. Es lo único que se lee con calma; después el mástil ocupa toda la pantalla.
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../Button';
import { Icono, COLORES_ICONO, TextoConIcono } from '../icono/Icono';
import { FUENTE_TITULO } from '../../theme/fuentes';

export function IntroPractica({ titulo, xp, instruccion, onEmpezar, onVolver }) {
  return (
    <View style={styles.container}>
      <View style={styles.icono}>
        <Icono nombre="guitarra" tamano={52} acento={COLORES_ICONO.violeta} />
      </View>
      <Text style={styles.titulo} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75}>{titulo || 'Lección'}</Text>
      <TextoConIcono nombre="rayo" tamano={16} acento={COLORES_ICONO.rayo} centrado style={styles.xp}>{xp ?? 0} XP</TextoConIcono>
      {instruccion ? <Text style={styles.instruccion}>{instruccion}</Text> : null}

      <View style={styles.botones}>
        {onVolver ? <Button title="Volver" icono="volver" variant="secondary" onPress={onVolver} style={styles.boton} /> : null}
        <Button title="Empezar" iconoDerecha="adelante" onPress={onEmpezar} style={[styles.boton, styles.botonEmpezar]} />
      </View>
      <Text style={styles.pista}>Durante la clase, tocá cualquier parte de la pantalla para pausar.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  icono: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  titulo: { color: '#fff', fontSize: 26, fontFamily: FUENTE_TITULO, fontWeight: 'bold', textAlign: 'center', marginTop: 4 },
  xp: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  instruccion: { color: 'rgba(255,255,255,0.9)', fontSize: 15, lineHeight: 21, textAlign: 'center', maxWidth: 560 },
  botones: { flexDirection: 'row', gap: 15, width: '100%', maxWidth: 520, marginTop: 8 },
  boton: { flex: 1 },
  botonEmpezar: { backgroundColor: '#4c52d9' },
  pista: { color: 'rgba(255,255,255,0.55)', fontSize: 12, textAlign: 'center' },
});
