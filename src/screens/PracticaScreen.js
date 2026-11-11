// Archivo: src/screens/PracticaScreen.js
// Práctica libre, en tres modos: adivinar lo que marca el mástil, tocar contra reloj lo que pide
// la app, o elegir qué tocar y que el micrófono corrija. Cada modo funciona con notas o con acordes.
// Es solo para entrenar: no suma XP ni racha, y los aciertos duran hasta salir de la pantalla.
import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { ScreenHeader } from '../components/ScreenHeader';
import { ModoAdivinar } from '../components/practica/ModoAdivinar';
import { ModoContrarreloj } from '../components/practica/ModoContrarreloj';
import { ModoLibre } from '../components/practica/ModoLibre';
import { useAcordes } from '../hooks/useAcordes';

const MODOS = [
  { id: 'adivinar', titulo: 'Adivinar', Componente: ModoAdivinar },
  { id: 'contrarreloj', titulo: 'Contrarreloj', Componente: ModoContrarreloj },
  { id: 'libre', titulo: 'Tocar libre', Componente: ModoLibre },
];

const MATERIALES = [
  { id: 'notas', titulo: 'Notas' },
  { id: 'acordes', titulo: 'Acordes' },
];

function Selector({ opciones, elegida, onCambiar }) {
  return (
    <View style={styles.selector} accessibilityRole="tablist">
      {opciones.map(({ id, titulo }) => {
        const activa = id === elegida;
        return (
          <TouchableOpacity
            key={id}
            style={[styles.opcion, activa && styles.opcionActiva]}
            onPress={() => onCambiar(id)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activa }}
          >
            <Text style={[styles.opcionTexto, activa && styles.opcionTextoActiva]} numberOfLines={1}>{titulo}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function PracticaScreen() {
  const insets = useSafeAreaInsets();
  const [modo, setModo] = useState('adivinar');
  const [material, setMaterial] = useState('notas');
  // Los acordes vienen del backend: se piden al abrir la pantalla y quedan en memoria
  const { acordes, cargando } = useAcordes();
  const { Componente } = MODOS.find((m) => m.id === modo);
  const esperandoAcordes = material === 'acordes' && cargando;

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
        <ScreenHeader
          title="Práctica"
          right={
            <View style={styles.selectores}>
              <Selector opciones={MATERIALES} elegida={material} onCambiar={setMaterial} />
              <Selector opciones={MODOS} elegida={modo} onCambiar={setModo} />
            </View>
          }
        />
        {esperandoAcordes ? (
          <View style={styles.cargando}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.cargandoTexto}>Buscando los acordes…</Text>
          </View>
        ) : (
          // Cada modo se monta solo cuando está activo: así el micrófono se cierra al salir de él
          <Componente key={`${modo}-${material}`} material={material} acordes={acordes} />
        )}
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  selectores: { flexDirection: 'row', gap: 8, flexShrink: 1 },
  selector: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 20, padding: 3, gap: 2 },
  opcion: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 17 },
  opcionActiva: { backgroundColor: '#b28cff' },
  opcionTexto: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 'bold' },
  opcionTextoActiva: { color: '#fff' },
  cargando: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  cargandoTexto: { color: '#fff', fontSize: 14 },
});
