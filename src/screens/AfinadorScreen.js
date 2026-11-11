// Archivo: src/screens/AfinadorScreen.js
// Afinador cromático para las seis cuerdas. Guía de la 6ta a la 1ra: cuando una cuerda queda afinada
// pasa sola a la siguiente. También se puede elegir una a mano o dejar que detecte la cuerda sola.
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { ScreenHeader } from '../components/ScreenHeader';
import { AvisoMicrofono } from '../components/leccion/EstadoDeteccion';
import { LecturaAfinador, COLOR_AFINADA } from '../components/afinador/LecturaAfinador';
import { useAfinacionGuiada } from '../hooks/useAfinacionGuiada';
import { CUERDAS_AFINADOR } from '../utils/afinador';

function OpcionCuerda({ titulo, activa, hecha, onPress, ancha }) {
  return (
    <TouchableOpacity
      style={[styles.opcion, ancha && styles.opcionAncha, activa && styles.opcionActiva]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: activa }}
    >
      <Text style={styles.opcionTexto} numberOfLines={1}>{hecha ? `✓ ${titulo}` : titulo}</Text>
    </TouchableOpacity>
  );
}

export function AfinadorScreen() {
  const insets = useSafeAreaInsets();
  // Arranca guiando desde la 6ta; elegir(null) = automático (detecta la cuerda sola, sin avanzar)
  const { estado, frecuencia, resultado, cuerdaElegida, afinadas, terminado, elegir, reiniciar } =
    useAfinacionGuiada({ cuerdas: CUERDAS_AFINADOR });

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
        <ScreenHeader title="Afinador" />

        <View style={styles.fila}>
          <View style={styles.columnaLectura}>
            {terminado ? (
              <View style={styles.final}>
                <Text style={[styles.listo, { color: COLOR_AFINADA }]}>¡Listo!</Text>
                <Text style={styles.mensajeFinal}>Las 6 cuerdas quedaron afinadas</Text>
                <TouchableOpacity style={styles.botonDeNuevo} onPress={reiniciar} activeOpacity={0.8}>
                  <Text style={styles.opcionTexto}>Afinar de nuevo</Text>
                </TouchableOpacity>
              </View>
            ) : estado === 'escuchando' ? (
              <>
                {cuerdaElegida !== null && (
                  <Text style={styles.guia}>
                    Tocá la cuerda {cuerdaElegida} al aire  •  {afinadas.length} de {CUERDAS_AFINADOR.length} afinadas
                  </Text>
                )}
                <LecturaAfinador resultado={resultado} frecuencia={frecuencia} />
              </>
            ) : (
              <AvisoMicrofono estado={estado} />
            )}
          </View>

          <ScrollView style={styles.columnaCuerdas} contentContainerStyle={styles.cuerdas}>
            <OpcionCuerda titulo="Automático" ancha activa={cuerdaElegida === null} onPress={() => elegir(null)} />
            {CUERDAS_AFINADOR.map(({ cuerda, nota }) => (
              <OpcionCuerda
                key={cuerda}
                titulo={`${cuerda} • ${nota}`}
                activa={cuerdaElegida === cuerda}
                hecha={afinadas.includes(cuerda)}
                onPress={() => elegir(cuerda)}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', paddingTop: 12, paddingBottom: 8 },
  fila: { flex: 1, flexDirection: 'row', gap: 20 },
  columnaLectura: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  columnaCuerdas: { flexGrow: 0, width: 200 },
  cuerdas: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', flexGrow: 1, alignContent: 'center' },
  opcion: { width: '48%', minHeight: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.3)' },
  opcionAncha: { width: '100%' },
  opcionActiva: { backgroundColor: '#4c52d9' },
  opcionTexto: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  guia: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  final: { alignItems: 'center', gap: 6 },
  listo: { fontSize: 52, lineHeight: 60, fontWeight: 'bold' },
  mensajeFinal: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  botonDeNuevo: { marginTop: 10, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24, backgroundColor: '#4c52d9' },
});
