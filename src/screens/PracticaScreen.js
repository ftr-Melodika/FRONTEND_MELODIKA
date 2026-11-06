// Archivo: src/screens/PracticaScreen.js
// Práctica libre: el mástil marca una posición y hay que adivinar qué nota es.
// Es solo para entrenar: no suma XP ni racha, y los aciertos duran hasta salir de la pantalla.
import { TextoConIcono, COLORES_ICONO } from '../components/icono/Icono';
import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Button } from '../components/Button';
import { ScreenHeader } from '../components/ScreenHeader';
import { GuitarNeck } from '../components/leccion/GuitarNeck';

const NOTAS = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
// Índice en NOTAS de cada cuerda al aire (afinación estándar; la 1 es la más fina)
const CUERDAS_AL_AIRE = { 1: 4, 2: 11, 3: 7, 4: 2, 5: 9, 6: 4 };
const TRASTES = 5; // Los mismos que dibuja GuitarNeck
const CANT_OPCIONES = 4;

const azar = (maximo) => Math.floor(Math.random() * maximo);

function mezclar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = azar(i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function notaDe(cuerda, traste) {
  return NOTAS[(CUERDAS_AL_AIRE[cuerda] + traste) % NOTAS.length];
}

function nuevaPregunta(anterior) {
  let cuerda;
  let traste;
  do {
    cuerda = azar(6) + 1;
    traste = azar(TRASTES + 1);
  } while (anterior && anterior.cuerda === cuerda && anterior.traste === traste);

  const nota = notaDe(cuerda, traste);
  const incorrectas = mezclar(NOTAS.filter((n) => n !== nota)).slice(0, CANT_OPCIONES - 1);
  return { cuerda, traste, nota, opciones: mezclar([nota, ...incorrectas]) };
}

export function PracticaScreen() {
  const insets = useSafeAreaInsets();
  const [pregunta, setPregunta] = useState(() => nuevaPregunta());
  const [elegida, setElegida] = useState(null);
  const [marcador, setMarcador] = useState({ aciertos: 0, total: 0, seguidos: 0 });

  const respondida = elegida !== null;
  const acerto = elegida === pregunta.nota;

  const responder = (opcion) => {
    if (respondida) return;
    const correcta = opcion === pregunta.nota;
    setElegida(opcion);
    setMarcador((m) => ({
      aciertos: m.aciertos + (correcta ? 1 : 0),
      total: m.total + 1,
      seguidos: correcta ? m.seguidos + 1 : 0,
    }));
  };

  const siguiente = () => {
    setPregunta(nuevaPregunta(pregunta));
    setElegida(null);
  };

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
        <ScreenHeader title="Práctica" />

        <View style={styles.fila}>
          <View style={styles.columnaMastil}>
            <Text style={styles.consigna}>
              Cuerda {pregunta.cuerda}  •  {pregunta.traste === 0 ? 'Al aire' : `Traste ${pregunta.traste}`}
            </Text>
            <GuitarNeck targetNumber={pregunta.traste} cuerda={pregunta.cuerda} />
            <Text style={styles.ayuda}>Practicá libremente: esto no suma XP ni racha.</Text>
          </View>

          <ScrollView style={styles.columnaOpciones} contentContainerStyle={styles.opcionesContenido}>
            <Text style={styles.pregunta}>¿Qué nota es?</Text>
            <View style={styles.opciones}>
              {pregunta.opciones.map((opcion) => {
                const esCorrecta = respondida && opcion === pregunta.nota;
                const esError = respondida && opcion === elegida && !acerto;
                return (
                  <TouchableOpacity
                    key={opcion}
                    style={[styles.opcion, esCorrecta && styles.opcionCorrecta, esError && styles.opcionError]}
                    onPress={() => responder(opcion)}
                    disabled={respondida}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.opcionTexto}>{opcion}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {respondida && (
              <Text style={[styles.resultado, acerto ? styles.resultadoOk : styles.resultadoMal]}>
                {acerto ? '¡Correcto!' : `Era ${pregunta.nota}`}
              </Text>
            )}
            {respondida && <Button title="Siguiente" iconoDerecha="adelante" onPress={siguiente} />}

            <View style={styles.marcadorFila}>
              <TextoConIcono nombre="completado" tamano={16} acento={COLORES_ICONO.verde} style={styles.marcador}>{marcador.aciertos} de {marcador.total}</TextoConIcono>
              <TextoConIcono nombre="llama" tamano={16} acento={COLORES_ICONO.llama} style={styles.marcador}>{marcador.seguidos} seguidas</TextoConIcono>
            </View>
          </ScrollView>
        </View>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  fila: { flex: 1, flexDirection: 'row', gap: 20 },
  columnaMastil: { flex: 1.6, justifyContent: 'center' },
  columnaOpciones: { flex: 1 },
  opcionesContenido: { flexGrow: 1, justifyContent: 'center', paddingBottom: 10 },
  consigna: { color: '#a3fba3', fontSize: 15, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  ayuda: { color: 'rgba(255,255,255,0.65)', fontSize: 12, textAlign: 'center' },
  pregunta: { color: '#fff', fontSize: 20, fontFamily: 'serif', fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcion: { flexGrow: 1, flexBasis: '45%', paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  opcionCorrecta: { backgroundColor: 'rgba(50,205,50,0.35)', borderColor: '#a3fba3' },
  opcionError: { backgroundColor: 'rgba(255,126,141,0.3)', borderColor: '#ff7e8d' },
  opcionTexto: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  resultado: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginTop: 10 },
  resultadoOk: { color: '#a3fba3' },
  resultadoMal: { color: '#ffb3bd' },
  marcadorFila: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 10 },
  marcador: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
});
