// Archivo: src/components/leccion/PracticeStep.js
import { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from '../Button';
import { GuitarNeck } from './GuitarNeck';
import { PracticaConDeteccion } from './PracticaConDeteccion';
import { obtenerSecuencia } from '../../utils/deteccionSonido';
import { obtenerAfinacion, obtenerCancion, obtenerQuiz } from '../../utils/actividades';
import { CancionStep } from './CancionStep';
import { QuizStep } from './QuizStep';
import { AfinacionStep } from './AfinacionStep';
import { RitmoStep } from './RitmoStep';
import { obtenerRitmo } from '../../utils/ritmo';
import { RiffStep } from './RiffStep';
import { obtenerEscalon, obtenerRiff, opcionesConEscalon } from '../../utils/riff';
import { obtenerConsignas, resolverNotasAlAzar } from '../../utils/consignas';
import { ConsignasStep } from './ConsignasStep';

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

// Una sola práctica: un quiz, afinar la guitarra, un ritmo, una canción o tocar una o varias notas
function PracticaUnica({ onBack, onFinish, finishing, leccion: leccionOriginal }) {
  // Las notas al azar se arman una vez, al entrar a la práctica
  const leccion = useMemo(() => resolverNotasAlAzar(leccionOriginal), [leccionOriginal]);
  const quiz = useMemo(() => obtenerQuiz(leccion), [leccion]);
  const afinacion = useMemo(() => obtenerAfinacion(leccion), [leccion]);
  const secuencia = useMemo(() => obtenerSecuencia(leccion), [leccion]);
  const ritmo = useMemo(() => obtenerRitmo(leccion), [leccion]);
  // Un riff o melodía con ritmo (secuencia con `tempo`) se toca directo a tempo
  const escalon = obtenerEscalon(leccion.practica?.tempo);
  // Con escalón se empieza más lento, y solo se aprueba a velocidad original
  const [velocidad, setVelocidad] = useState(escalon ?? 1);
  const riff = useMemo(() => obtenerRiff(leccion, velocidad), [leccion, velocidad]);

  const cancion = useMemo(() => obtenerCancion(leccion), [leccion]);

  if (cancion) return <CancionStep cancionId={cancion.cancionId} fase={cancion.fase} bpm={cancion.bpm} escalon={cancion.escalon} onBack={onBack} onFinish={onFinish} finishing={finishing} />;
  if (ritmo) return <RitmoStep ritmo={ritmo} onBack={onBack} onFinish={onFinish} finishing={finishing} autoTerminar />;
  if (quiz) return <QuizStep quiz={quiz} onBack={onBack} onFinish={onFinish} finishing={finishing} autoTerminar />;
  if (afinacion) return <AfinacionStep afinacion={afinacion} onBack={onBack} onFinish={onFinish} finishing={finishing} autoTerminar />;
  // Se separan porque el hook del micrófono solo debe existir si hay algo que detectar
  if (!secuencia) return <PracticaLibre onBack={onBack} onFinish={onFinish} finishing={finishing} leccion={leccion} />;
  // La clase a tiempo no repite el aprender: arranca directo con el mástil en movimiento
  if (riff) {
    return (
      <RiffStep
        key={velocidad}
        riff={riff}
        onBack={onBack}
        onFinish={onFinish}
        finishing={finishing}
        autoTerminar
        {...(escalon ? { velocidad, velocidades: opcionesConEscalon(escalon), onCambiarVelocidad: setVelocidad, velocidadParaAprobar: 1 } : {})}
      />
    );
  }
  return <PracticaConDeteccion onBack={onBack} onFinish={onFinish} finishing={finishing} secuencia={secuencia} autoTerminar />;
}

// La práctica de una lección: una sola, o varias consignas seguidas (practica.tipo = 'consignas').
// `onInstruccion` avisa el texto de la consigna actual para la barra lateral.
export function PracticeStep({ onBack, onFinish, finishing, leccion, onInstruccion }) {
  const consignas = useMemo(() => obtenerConsignas(leccion), [leccion]);
  if (!consignas) return <PracticaUnica onBack={onBack} onFinish={onFinish} finishing={finishing} leccion={leccion} />;
  return (
    <ConsignasStep
      consignas={consignas}
      renderPractica={(consigna, props) => <PracticaUnica leccion={consigna} {...props} />}
      onBack={onBack}
      onFinish={onFinish}
      finishing={finishing}
      onInstruccion={onInstruccion}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  btnRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 15, paddingTop: 4 },
  btnHalf: { flex: 1 },
  btnTerminar: { backgroundColor: '#4c52d9' },
});
