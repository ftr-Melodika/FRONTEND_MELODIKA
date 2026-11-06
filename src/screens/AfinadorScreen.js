// Archivo: src/screens/AfinadorScreen.js
// Afinador cromático para las seis cuerdas. Detecta sola la cuerda, o se puede elegir una a mano.
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { ScreenHeader } from '../components/ScreenHeader';
import { AvisoMicrofono } from '../components/leccion/EstadoDeteccion';
import { useAfinador } from '../hooks/useAfinador';
import { CENTS_AFINADA, CUERDAS_AFINADOR, compararConCuerda } from '../utils/afinador';

const CENTS_ESCALA = 50; // El medidor llega hasta medio tono para cada lado
const COLOR_AFINADA = '#32CD32';
const COLOR_DESAFINADA = '#ff9a4d';

const MENSAJES = {
  afinada: '¡Afinada!',
  baja: 'Está baja: apretá la clavija',
  alta: 'Está alta: aflojá la clavija',
};

function Medidor({ cents, color }) {
  const posicion = useRef(new Animated.Value(0)).current;
  const objetivo = Math.max(-CENTS_ESCALA, Math.min(CENTS_ESCALA, cents ?? 0));

  useEffect(() => {
    Animated.timing(posicion, { toValue: objetivo, duration: 120, useNativeDriver: false }).start();
  }, [objetivo, posicion]);

  const left = posicion.interpolate({ inputRange: [-CENTS_ESCALA, CENTS_ESCALA], outputRange: ['0%', '100%'] });
  const anchoZona = `${(CENTS_AFINADA * 2 * 100) / (CENTS_ESCALA * 2)}%`;

  return (
    <View style={styles.medidor} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.barra}>
        <View style={[styles.zonaAfinada, { width: anchoZona }]} />
        <Animated.View style={[styles.aguja, { left, backgroundColor: color }]} />
      </View>
      <View style={styles.escala}>
        <Text style={styles.escalaTexto}>Baja</Text>
        <Text style={styles.escalaTexto}>Alta</Text>
      </View>
    </View>
  );
}

function Lectura({ resultado, frecuencia }) {
  const color = !resultado ? 'rgba(255,255,255,0.5)' : resultado.estado === 'afinada' ? COLOR_AFINADA : COLOR_DESAFINADA;

  return (
    <>
      <Text style={[styles.nota, resultado && { color }]} numberOfLines={1}>{resultado ? resultado.nota : '—'}</Text>
      <Text style={styles.cuerda}>{resultado ? `Cuerda ${resultado.cuerda}` : ' '}</Text>
      <Medidor cents={resultado?.cents} color={color} />
      <Text style={[styles.mensaje, resultado && { color }]} accessibilityLiveRegion="polite">
        {resultado ? MENSAJES[resultado.estado] : 'Tocá una cuerda al aire'}
      </Text>
      <Text style={styles.detalle}>
        {resultado ? `${frecuencia.toFixed(1)} Hz  •  ${resultado.cents > 0 ? '+' : ''}${resultado.cents} cents` : ' '}
      </Text>
    </>
  );
}

function OpcionCuerda({ titulo, activa, onPress, ancha }) {
  return (
    <TouchableOpacity
      style={[styles.opcion, ancha && styles.opcionAncha, activa && styles.opcionActiva]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: activa }}
    >
      <Text style={styles.opcionTexto} numberOfLines={1}>{titulo}</Text>
    </TouchableOpacity>
  );
}

export function AfinadorScreen() {
  const insets = useSafeAreaInsets();
  const { estado, frecuencia } = useAfinador();
  const [cuerdaElegida, setCuerdaElegida] = useState(null);

  const resultado = frecuencia ? compararConCuerda(frecuencia, cuerdaElegida) : null;

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
        <ScreenHeader title="Afinador" />

        <View style={styles.fila}>
          <View style={styles.columnaLectura}>
            {estado === 'escuchando'
              ? <Lectura resultado={resultado} frecuencia={frecuencia} />
              : <AvisoMicrofono estado={estado} />}
          </View>

          <ScrollView style={styles.columnaCuerdas} contentContainerStyle={styles.cuerdas}>
            <OpcionCuerda titulo="Automático" ancha activa={cuerdaElegida === null} onPress={() => setCuerdaElegida(null)} />
            {CUERDAS_AFINADOR.map(({ cuerda, nota }) => (
              <OpcionCuerda
                key={cuerda}
                titulo={`${cuerda} • ${nota}`}
                activa={cuerdaElegida === cuerda}
                onPress={() => setCuerdaElegida(cuerda)}
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
  nota: { color: 'rgba(255,255,255,0.5)', fontSize: 52, lineHeight: 60, fontWeight: 'bold' },
  cuerda: { color: '#fff', fontSize: 14, marginBottom: 8 },
  medidor: { width: '100%', maxWidth: 480 },
  barra: { height: 28, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  zonaAfinada: { height: '100%', backgroundColor: 'rgba(50,205,50,0.45)' },
  aguja: { position: 'absolute', top: 0, bottom: 0, width: 4, marginLeft: -2, borderRadius: 2 },
  escala: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  escalaTexto: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  mensaje: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 6, textAlign: 'center' },
  detalle: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  opcion: { width: '48%', minHeight: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.3)' },
  opcionAncha: { width: '100%' },
  opcionActiva: { backgroundColor: '#4c52d9' },
  opcionTexto: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
