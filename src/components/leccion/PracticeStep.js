// Archivo: src/components/leccion/PracticeStep.js
import { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from '../Button';
import { GuitarNeck } from './GuitarNeck';
import { PracticaConDeteccion } from './PracticaConDeteccion';
import { obtenerSecuencia } from '../../utils/deteccionSonido';
import { obtenerAfinacion, obtenerQuiz } from '../../utils/actividades';
import { QuizStep } from './QuizStep';
import { AfinacionStep } from './AfinacionStep';
import { RitmoStep } from './RitmoStep';
import { obtenerRitmo } from '../../utils/ritmo';
import { RiffStep } from './RiffStep';
import { obtenerRiff } from '../../utils/riff';

// Práctica de una lección que no permite detección, por no indicar qué tocar
function PracticaLibre({ onBack, onFinish, finishing, leccion }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <GuitarNeck targetNumber={leccion.trasteObjetivo} cuerda={leccion.cuerda} dotLeft={leccion.dotLeft} dotBottom={leccion.dotBottom} />
      </View>
      <View style={styles.btnRow}>
        {onBack ? <Button title="Atrás" icono="volver" variant="secondary" onPress={onBack} style={styles.btnHalf} /> : null}
        <Button title="Terminar Lección" onPress={() => onFinish()} loading={finishing} style={[styles.btnHalf, styles.btnTerminar]} />
      </View>
    </View>
  );
}

// La práctica de una lección puede ser un quiz, afinar la guitarra o tocar una o varias consignas
export function PracticeStep({ onBack, onFinish, finishing, leccion }) {
  const quiz = useMemo(() => obtenerQuiz(leccion), [leccion]);
  const afinacion = useMemo(() => obtenerAfinacion(leccion), [leccion]);
  const secuencia = useMemo(() => obtenerSecuencia(leccion), [leccion]);
  const ritmo = useMemo(() => obtenerRitmo(leccion), [leccion]);
  // Un riff o melodía con ritmo tiene dos partes: primero las notas una por una, después a tempo
  const riff = useMemo(() => obtenerRiff(leccion), [leccion]);
  const [aTempo, setATempo] = useState(false);

  if (ritmo) return <RitmoStep ritmo={ritmo} onBack={onBack} onFinish={onFinish} finishing={finishing} autoTerminar />;
  if (quiz) return <QuizStep quiz={quiz} onBack={onBack} onFinish={onFinish} finishing={finishing} autoTerminar />;
  if (afinacion) return <AfinacionStep afinacion={afinacion} onBack={onBack} onFinish={onFinish} finishing={finishing} autoTerminar />;
  // Se separan porque el hook del micrófono solo debe existir si hay algo que detectar
  if (!secuencia) return <PracticaLibre onBack={onBack} onFinish={onFinish} finishing={finishing} leccion={leccion} />;
  if (riff && aTempo) return <RiffStep riff={riff} onBack={() => setATempo(false)} onFinish={onFinish} finishing={finishing} autoTerminar />;
  if (riff) {
    // Al completar las notas sigue el riff en movimiento; "Saltear" saltea la lección entera
    const alTerminarNotas = (opciones) => (opciones?.omitida ? onFinish(opciones) : setATempo(true));
    return <PracticaConDeteccion onBack={onBack} onFinish={alTerminarNotas} finishing={finishing} secuencia={secuencia} textoFinal="Ahora a tempo →" />;
  }
  return <PracticaConDeteccion onBack={onBack} onFinish={onFinish} finishing={finishing} secuencia={secuencia} autoTerminar />;
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  btnRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 15, paddingTop: 4 },
  btnHalf: { flex: 1 },
  btnTerminar: { backgroundColor: '#4c52d9' },
});
