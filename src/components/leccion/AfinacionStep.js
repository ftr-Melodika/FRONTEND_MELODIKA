// Archivo: src/components/leccion/AfinacionStep.js
// Paso de una lección de afinación: guía cuerda por cuerda con el afinador y, cuando están todas
// afinadas, habilita terminar. Si no hay micrófono, o pasa un rato, se puede saltear sin XP.
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../Button';
import { AvisoMicrofono } from './EstadoDeteccion';
import { LecturaAfinador, COLOR_AFINADA } from '../afinador/LecturaAfinador';
import { useAfinacionGuiada } from '../../hooks/useAfinacionGuiada';

const SEGUNDOS_PARA_SALTEAR = 45; // Afinar seis cuerdas lleva más que tocar una nota

export function AfinacionStep({ afinacion, onBack, onFinish, finishing }) {
  const { cuerdas, toleranciaCents, msEstable } = afinacion;
  const { estado, frecuencia, resultado, cuerdaElegida, afinadas, terminado } = useAfinacionGuiada({ cuerdas, toleranciaCents, msEstable });
  const [puedeSaltear, setPuedeSaltear] = useState(false);
  const sinMicrofono = estado === 'sin-permiso' || estado === 'no-disponible' || estado === 'error';
  const actual = cuerdas.find((c) => c.cuerda === cuerdaElegida);

  useEffect(() => {
    const espera = setTimeout(() => setPuedeSaltear(true), SEGUNDOS_PARA_SALTEAR * 1000);
    return () => clearTimeout(espera);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.cuerdas} accessibilityLabel={`${afinadas.length} de ${cuerdas.length} cuerdas afinadas`}>
        {cuerdas.map(({ cuerda, nota }) => {
          const hecha = afinadas.includes(cuerda);
          const activa = !terminado && cuerda === cuerdaElegida;
          return (
            <View key={cuerda} style={[styles.chip, hecha && styles.chipHecho, activa && styles.chipActivo]}>
              <Text style={styles.chipTexto}>{hecha ? '✓ ' : ''}{cuerda} • {nota}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.lectura}>
        {terminado ? (
          <>
            <Text style={[styles.listo, { color: COLOR_AFINADA }]}>¡Guitarra afinada!</Text>
            <Text style={styles.texto}>Afinaste las {cuerdas.length} cuerdas. Ya podés terminar la lección.</Text>
          </>
        ) : estado === 'escuchando' ? (
          <>
            {actual && <Text style={styles.guia}>Tocá la cuerda {actual.cuerda} ({actual.nota}) al aire y girá su clavija</Text>}
            <LecturaAfinador resultado={resultado} frecuencia={frecuencia} toleranciaCents={toleranciaCents} compacta />
          </>
        ) : (
          <AvisoMicrofono estado={estado} />
        )}
      </View>

      <View style={styles.btnRow}>
        {onBack ? <Button title="Atrás" icono="volver" variant="secondary" onPress={onBack} style={styles.btnHalf} /> : null}
        {!terminado && (puedeSaltear || sinMicrofono) ? (
          <Button title="Saltear (sin XP)" variant="secondary" onPress={() => onFinish({ omitida: true })} loading={finishing} style={styles.btnHalf} />
        ) : (
          <Button
            title="Terminar Lección"
            onPress={() => onFinish()}
            loading={finishing && terminado}
            disabled={!terminado}
            style={[styles.btnHalf, styles.btnTerminar]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', justifyContent: 'space-between' },
  cuerdas: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  chip: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'transparent' },
  chipHecho: { backgroundColor: 'rgba(50,205,50,0.35)' },
  chipActivo: { borderColor: '#fff', backgroundColor: '#4c52d9' },
  chipTexto: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  lectura: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  guia: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 2, textAlign: 'center' },
  listo: { fontSize: 32, fontWeight: 'bold', textAlign: 'center' },
  texto: { color: '#fff', fontSize: 15, textAlign: 'center', marginTop: 4 },
  btnRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 15, paddingTop: 4 },
  btnHalf: { flex: 1 },
  btnTerminar: { backgroundColor: '#4c52d9' },
});
