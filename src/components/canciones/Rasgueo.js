// Archivo: src/components/canciones/Rasgueo.js
// Un compás del rasgueo: la cuenta arriba y la flecha de cada golpe abajo.
// Con `parteActual` se resalta la parte que está sonando (lo marca el metrónomo).
import { StyleSheet, Text, View } from 'react-native';

export function Rasgueo({ rasgueo, parteActual = null }) {
  // En semicorcheas (16 partes) no entran a tamaño normal: se achican
  const compacto = rasgueo.golpes.length > 8;
  const descripcion = rasgueo.golpes
    .map((g, i) => `${rasgueo.cuenta[i]}: ${g === '↓' ? 'abajo' : g === '↑' ? 'arriba' : 'sin tocar'}`)
    .join(', ');
  return (
    <View style={[styles.fila, compacto && styles.filaCompacta]} accessibilityLabel={`Rasgueo ${rasgueo.nombre}. ${descripcion}`}>
      {rasgueo.golpes.map((golpe, i) => {
        const activa = parteActual === i;
        return (
          <View key={i} style={[styles.parte, compacto && styles.parteCompacta, activa && styles.parteActiva]}>
            <Text style={[styles.cuenta, compacto && styles.cuentaCompacta, activa && styles.cuentaActiva]}>{rasgueo.cuenta[i]}</Text>
            <Text style={[styles.golpe, compacto && styles.golpeCompacto, !golpe && styles.golpeVacio]}>{golpe || '·'}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 4 },
  filaCompacta: { gap: 2 },
  parteCompacta: { paddingVertical: 4, borderRadius: 6 },
  cuentaCompacta: { fontSize: 10 },
  golpeCompacto: { fontSize: 16, lineHeight: 20 },
  parte: { flex: 1, maxWidth: 44, alignItems: 'center', paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.25)' },
  parteActiva: { backgroundColor: '#4c52d9' },
  cuenta: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold' },
  cuentaActiva: { color: '#fff' },
  golpe: { color: '#fff', fontSize: 22, fontWeight: 'bold', lineHeight: 26 },
  golpeVacio: { color: 'rgba(255,255,255,0.3)' },
});
