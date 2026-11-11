// Archivo: src/screens/AfinadorScreen.js
// Afinador para las seis cuerdas. Guía de la 6ta a la 1ra: cuando una cuerda queda afinada
// pasa sola a la siguiente. También se puede elegir una cuerda a mano y cambiar de afinación.
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { ScreenHeader } from '../components/ScreenHeader';
import { Icono } from '../components/icono/Icono';
import { AvisoMicrofono } from '../components/leccion/EstadoDeteccion';
import { LecturaAfinador, COLOR_AFINADA } from '../components/afinador/LecturaAfinador';
import { useAfinacionGuiada } from '../hooks/useAfinacionGuiada';
import { AFINACIONES, cuerdasDeAfinacion } from '../utils/afinador';

const notasDe = (id) => cuerdasDeAfinacion(id).map((c) => c.nota).join(' ');

function OpcionCuerda({ titulo, activa, hecha, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.opcion, activa && styles.opcionActiva]}
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
  const [afinacionId, setAfinacionId] = useState(AFINACIONES[0].id);
  const [eligiendoAfinacion, setEligiendoAfinacion] = useState(false);
  const afinacion = AFINACIONES.find((a) => a.id === afinacionId);
  const cuerdas = useMemo(() => cuerdasDeAfinacion(afinacionId), [afinacionId]);

  // Arranca guiando desde la 6ta; al cambiar de afinación vuelve a empezar
  const { estado, frecuencia, resultado, cuerdaElegida, afinadas, terminado, elegir, reiniciar } =
    useAfinacionGuiada({ cuerdas });
  const actual = cuerdas.find((c) => c.cuerda === cuerdaElegida);

  const cambiarAfinacion = (id) => {
    setAfinacionId(id);
    setEligiendoAfinacion(false);
  };

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
        <ScreenHeader title="Afinador" />

        <View style={styles.fila}>
          <View style={styles.columnaLectura}>
            {terminado ? (
              <View style={styles.final}>
                <Text style={[styles.listo, { color: COLOR_AFINADA }]}>¡Listo!</Text>
                <Text style={styles.mensajeFinal}>Las 6 cuerdas quedaron afinadas en {afinacion.nombre}</Text>
                <TouchableOpacity style={styles.botonDeNuevo} onPress={reiniciar} activeOpacity={0.8}>
                  <Text style={styles.opcionTexto}>Afinar de nuevo</Text>
                </TouchableOpacity>
              </View>
            ) : estado === 'escuchando' ? (
              <>
                {!!actual && (
                  <Text style={styles.guia}>
                    Tocá la cuerda {actual.cuerda} ({actual.nota}) al aire  •  {afinadas.length} de {cuerdas.length} afinadas
                  </Text>
                )}
                <LecturaAfinador resultado={resultado} frecuencia={frecuencia} />
              </>
            ) : (
              <AvisoMicrofono estado={estado} />
            )}
          </View>

          <View style={styles.columnaCuerdas}>
            <TouchableOpacity
              style={[styles.selector, eligiendoAfinacion && styles.opcionActiva]}
              onPress={() => setEligiendoAfinacion((abierto) => !abierto)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Afinación: ${afinacion.nombre}. Tocá para cambiarla`}
              accessibilityState={{ expanded: eligiendoAfinacion }}
            >
              <View style={styles.selectorTextos}>
                <Text style={styles.selectorEtiqueta}>Afinación</Text>
                <Text style={styles.opcionTexto} numberOfLines={1}>{afinacion.nombre}</Text>
              </View>
              <Icono nombre={eligiendoAfinacion ? 'arriba' : 'abajo'} tamano={14} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>

            {eligiendoAfinacion ? (
              <ScrollView contentContainerStyle={styles.lista}>
                {AFINACIONES.map(({ id, nombre }) => (
                  <TouchableOpacity
                    key={id}
                    style={[styles.itemAfinacion, id === afinacionId && styles.opcionActiva]}
                    onPress={() => cambiarAfinacion(id)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ selected: id === afinacionId }}
                  >
                    <Text style={styles.opcionTexto} numberOfLines={1}>{nombre}</Text>
                    <Text style={styles.itemNotas} numberOfLines={1}>{notasDe(id)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <ScrollView contentContainerStyle={styles.cuerdas}>
                {cuerdas.map(({ cuerda, nota }) => (
                  <OpcionCuerda
                    key={cuerda}
                    titulo={`${cuerda} • ${nota}`}
                    activa={cuerdaElegida === cuerda}
                    hecha={afinadas.includes(cuerda)}
                    onPress={() => elegir(cuerda)}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', paddingTop: 12, paddingBottom: 8 },
  fila: { flex: 1, flexDirection: 'row', gap: 20 },
  columnaLectura: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  columnaCuerdas: { width: 200, justifyContent: 'center' },
  cuerdas: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 8 },
  opcion: { width: '48%', minHeight: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.3)' },
  opcionActiva: { backgroundColor: '#4c52d9' },
  opcionTexto: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  selector: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginBottom: 8, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  selectorTextos: { flex: 1, marginRight: 8 },
  selectorEtiqueta: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  lista: { paddingBottom: 8 },
  itemAfinacion: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 6, marginBottom: 6, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.3)' },
  itemNotas: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 },
  guia: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  final: { alignItems: 'center', gap: 6 },
  listo: { fontSize: 52, lineHeight: 60, fontWeight: 'bold' },
  mensajeFinal: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  botonDeNuevo: { marginTop: 10, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24, backgroundColor: '#4c52d9' },
});
