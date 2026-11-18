// Archivo: src/components/form/ModoZurdoField.js
// Interruptor del modo zurdo, al crear y al editar un perfil (ver useZurdo).
import { StyleSheet, Switch, Text, View } from 'react-native';

export function ModoZurdoField({ value, onChange }) {
  return (
    <View style={styles.fila}>
      <View style={styles.textos}>
        <Text style={styles.titulo}>Modo zurdo</Text>
        <Text style={styles.detalle}>
          {value
            ? 'Mástiles, acordes, riffs y videos se ven como en un espejo, como tu guitarra.'
            : 'Activalo si sos zurdo: rasgueás con la mano izquierda y pisás con la derecha.'}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#b28cff' }}
        thumbColor="#fff"
        accessibilityLabel="Modo zurdo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.3)', borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 10 },
  textos: { flex: 1 },
  titulo: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  detalle: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
});
