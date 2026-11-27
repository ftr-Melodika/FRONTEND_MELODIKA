// Archivo: src/screens/UsoMicrofonoScreen.js
// Para qué y en qué partes de la app se usa el micrófono.
// Si cambia dónde se escucha (ver utils/ruidoAmbiente.js y LeccionScreen), actualizar estos textos.
import { View, Text, StyleSheet, ScrollView, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { ScreenHeader } from '../components/ScreenHeader';
import { Button } from '../components/Button';
import { FUENTE_TITULO } from '../theme/fuentes';

const USOS = [
  {
    titulo: 'Para reconocer lo que tocás',
    donde: [
      'Prácticas de las lecciones: notas, acordes, ritmo, riffs y canciones.',
      'La sección Práctica y las canciones para tocar.',
      'El afinador y las lecciones de afinación.',
      'La bienvenida de un perfil nuevo ("Tocá cualquier cuerda").',
    ],
  },
  {
    titulo: 'Para medir el ruido del lugar (cuando no estás tocando)',
    donde: [
      'Mientras navegás por los menús: cursos, perfil, ranking, amigos, grupos, soporte y la lista de canciones.',
      'En las lecciones: la teoría, las preguntas, antes de empezar a tocar, con la pausa abierta y al terminar.',
    ],
  },
  {
    titulo: 'Cuándo no se usa',
    donde: [
      'Mientras mirás un video.',
      'Con la app en segundo plano o cerrada.',
    ],
  },
];

export function UsoMicrofonoScreen() {
  const insets = useSafeAreaInsets();

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20) }]}>
        <ScreenHeader title="Uso del micrófono" />
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <Text style={styles.promesa}>
            El audio se procesa solo en tu celular: Melodika no lo guarda ni lo envía a ningún lado.
          </Text>
          {USOS.map((uso) => (
            <View key={uso.titulo} style={styles.item}>
              <Text style={styles.titulo}>{uso.titulo}</Text>
              {uso.donde.map((lugar) => (
                <Text key={lugar} style={styles.lugar}>• {lugar}</Text>
              ))}
            </View>
          ))}
          {/* En web no hay ajustes del sistema para abrir */}
          {Platform.OS !== 'web' && (
            <>
              <Text style={styles.ayuda}>Podés dar o quitar el permiso desde los ajustes del celular.</Text>
              <Button title="Abrir ajustes" variant="secondary" onPress={() => Linking.openSettings()} />
            </>
          )}
        </ScrollView>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, width: '100%' },
  promesa: { color: '#a3fba3', fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
  item: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  titulo: { color: '#fff', fontSize: 16, fontFamily: FUENTE_TITULO, fontWeight: 'bold', marginBottom: 6 },
  lugar: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 21 },
  ayuda: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4 },
});
