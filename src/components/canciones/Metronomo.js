// Archivo: src/components/canciones/Metronomo.js
// Metrónomo visual: marca cada pulso con una luz y resalta en el rasgueo la parte que toca.
// Es visual (sin sonido): se puede seguir con la vista mientras se toca.
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Rasgueo } from './Rasgueo';

const BPM_MIN = 40;
const BPM_MAX = 200;
const PASO_BPM = 5;

// `pulsos`: cuántos pulsos tiene el compás (en 6/8 son 2, uno cada tres partes)
export function Metronomo({ bpmOriginal, pulsos, rasgueo }) {
  const [bpm, setBpm] = useState(bpmOriginal);
  const [activo, setActivo] = useState(false);
  const [parte, setParte] = useState(0);

  // El rasgueo se divide en partes: el metrónomo avanza de a una parte
  const partes = rasgueo.golpes.length;
  const partesPorPulso = partes / pulsos;
  const msPorParte = 60000 / bpm / partesPorPulso;

  useEffect(() => {
    if (!activo) return undefined;
    setParte(0);
    const reloj = setInterval(() => setParte((p) => (p + 1) % partes), msPorParte);
    return () => clearInterval(reloj);
  }, [activo, msPorParte, partes]);

  const pulsoActual = Math.floor(parte / partesPorPulso);
  const cambiar = (delta) => setBpm((b) => Math.min(BPM_MAX, Math.max(BPM_MIN, b + delta)));

  return (
    <View style={styles.contenedor}>
      <Rasgueo rasgueo={rasgueo} parteActual={activo ? parte : null} />
      <View style={styles.controles}>
        <TouchableOpacity style={styles.boton} onPress={() => cambiar(-PASO_BPM)} accessibilityLabel="Más lento" activeOpacity={0.8}>
          <Text style={styles.botonTexto}>−</Text>
        </TouchableOpacity>
        <View style={styles.centro}>
          <View style={styles.luces} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {Array.from({ length: pulsos }, (_, i) => (
              <View key={i} style={[styles.luz, activo && i === pulsoActual && (i === 0 ? styles.luzFuerte : styles.luzActiva)]} />
            ))}
          </View>
          <Text style={styles.bpm}>{bpm} BPM{bpm !== bpmOriginal ? ` (original ~${bpmOriginal})` : ''}</Text>
        </View>
        <TouchableOpacity style={styles.boton} onPress={() => cambiar(PASO_BPM)} accessibilityLabel="Más rápido" activeOpacity={0.8}>
          <Text style={styles.botonTexto}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.botonPlay, activo && styles.botonPlayActivo]}
          onPress={() => setActivo((a) => !a)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={activo ? 'Detener metrónomo' : 'Iniciar metrónomo'}
        >
          <Text style={styles.botonTexto}>{activo ? 'Parar' : 'Marcar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: 8 },
  controles: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  boton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  botonTexto: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  centro: { flex: 1, alignItems: 'center', gap: 4 },
  luces: { flexDirection: 'row', gap: 6 },
  luz: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)' },
  luzActiva: { backgroundColor: '#fff' },
  luzFuerte: { backgroundColor: '#ffd35c' },
  bpm: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  botonPlay: { minWidth: 72, height: 40, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#4c52d9', justifyContent: 'center', alignItems: 'center' },
  botonPlayActivo: { backgroundColor: '#b04c6a' },
});
