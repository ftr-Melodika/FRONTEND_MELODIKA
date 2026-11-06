// Archivo: src/screens/PruebaSonidoScreen.js
// Pantalla solo de desarrollo: permite probar la detección en un teléfono sin cargar lecciones.
import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { ScreenHeader } from '../components/ScreenHeader';
import { GuitarNeck } from '../components/leccion/GuitarNeck';
import { EstadoDeteccion } from '../components/leccion/EstadoDeteccion';
import { useDeteccionPractica } from '../hooks/useDeteccionPractica';
import { obtenerObjetivo } from '../utils/deteccionSonido';

const acorde = (nombre, posiciones) => ({
  tipo: 'acorde',
  nombre,
  posiciones: posiciones.map(([cuerda, traste]) => ({ cuerda, traste })),
});
const nota = (cuerda, traste, nombre) => ({ tipo: 'nota', nombre, posiciones: [{ cuerda, traste }] });

const PRUEBAS = [
  nota(6, 0, 'Mi grave'),
  nota(5, 0, 'La'),
  nota(1, 0, 'Mi agudo'),
  nota(1, 3, 'Sol'),
  acorde('Do', [[5, 3], [4, 2], [3, 0], [2, 1], [1, 0]]),
  acorde('Sol', [[6, 3], [5, 2], [4, 0], [3, 0], [2, 0], [1, 3]]),
  acorde('Re', [[4, 0], [3, 2], [2, 3], [1, 2]]),
  acorde('La', [[5, 0], [4, 2], [3, 2], [2, 2], [1, 0]]),
  acorde('Mi', [[6, 0], [5, 2], [4, 2], [3, 1], [2, 0], [1, 0]]),
  acorde('Lam', [[5, 0], [4, 2], [3, 2], [2, 1], [1, 0]]),
  acorde('Mim', [[6, 0], [5, 2], [4, 2], [3, 0], [2, 0], [1, 0]]),
  acorde('Rem', [[4, 0], [3, 2], [2, 3], [1, 1]]),
];

function Prueba({ objetivo }) {
  const { estado, lectura, aprobado } = useDeteccionPractica(objetivo);
  return (
    <View style={styles.prueba}>
      <GuitarNeck
        posiciones={objetivo.tipo === 'acorde' ? objetivo.posiciones : undefined}
        targetNumber={objetivo.posiciones[0].traste}
        cuerda={objetivo.posiciones[0].cuerda}
      />
      <EstadoDeteccion objetivo={objetivo} estado={estado} lectura={lectura} aprobado={aprobado} />
      <Text style={styles.datos}>
        {`Estado: ${estado}  •  Volumen: ${lectura ? lectura.nivel.toFixed(4) : '—'}`}
        {lectura?.frecuencia ? `  •  ${lectura.frecuencia.toFixed(1)} Hz (${lectura.cents} cents)` : ''}
        {lectura?.oidas?.length ? `  •  Oigo: ${[...new Set(lectura.oidas)].join(', ')}` : ''}
      </Text>
    </View>
  );
}

export function PruebaSonidoScreen() {
  const insets = useSafeAreaInsets();
  const [indice, setIndice] = useState(4);
  const [intento, setIntento] = useState(0);
  const objetivo = useMemo(() => obtenerObjetivo({ practica: PRUEBAS[indice] }), [indice, intento]);

  return (
    <Background>
      <ScreenHeader title="Probar micrófono" />
      <View style={[styles.cuerpo, { paddingLeft: Math.max(insets.left, 12), paddingRight: Math.max(insets.right, 12) }]}>
        <ScrollView style={styles.lista}>
          {PRUEBAS.map((prueba, i) => (
            <TouchableOpacity
              key={`${prueba.tipo}-${prueba.nombre}`}
              style={[styles.opcion, i === indice && styles.opcionActiva]}
              onPress={() => { setIndice(i); setIntento((n) => n + 1); }}
            >
              <Text style={styles.opcionTexto}>{prueba.tipo === 'acorde' ? '🎶' : '🎵'} {prueba.nombre}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Prueba objetivo={objetivo} />
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  cuerpo: { flex: 1, width: '100%', flexDirection: 'row', gap: 12, padding: 12 },
  lista: { flexGrow: 0, width: 130 },
  opcion: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10, marginBottom: 6, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.3)' },
  opcionActiva: { backgroundColor: '#4c52d9' },
  opcionTexto: { color: '#fff', fontWeight: 'bold' },
  prueba: { flex: 1, justifyContent: 'center' },
  datos: { color: '#fff', fontSize: 12, textAlign: 'center' },
});
