// Archivo: src/components/leccion/PracticeStep.js
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../Button';
import { GuitarNeck, dedoSugerido } from './GuitarNeck';
import { EstadoDeteccion } from './EstadoDeteccion';
import { useDeteccionPractica } from '../../hooks/useDeteccionPractica';
import { obtenerSecuencia } from '../../utils/deteccionSonido';
import { cejillasDeSecuencia } from '../../utils/cejilla';
import { acordesDeContexto } from '../../utils/acordes';
import { obtenerAfinacion, obtenerQuiz } from '../../utils/actividades';
import { QuizStep } from './QuizStep';
import { AfinacionStep } from './AfinacionStep';
import { RitmoStep } from './RitmoStep';
import { obtenerRitmo } from '../../utils/ritmo';
import { RiffStep } from './RiffStep';
import { obtenerRiff } from '../../utils/riff';

const SEGUNDOS_PARA_SALTEAR = 20;
const MS_FESTEJO = 700; // Lo que se ve el acierto antes de pasar a la consigna siguiente

// Texto de una consigna: en una nota indica dónde pisar; en un acorde lo muestra el mástil
function describir(objetivo) {
  if (objetivo.tipo === 'acorde') return `Acorde: ${objetivo.nombre}`;
  const { cuerda, traste } = objetivo.posiciones[0];
  const donde = traste === 0 ? 'Al aire' : `Traste ${traste}  •  Dedo ${objetivo.posiciones[0].dedo ?? dedoSugerido(traste)}`;
  return `Cuerda ${cuerda}  •  ${donde}  •  Nota: ${objetivo.nombre}`;
}

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

function Progreso({ total, actual, completo }) {
  return (
    <View style={styles.progreso} accessibilityLabel={`Consigna ${Math.min(actual + 1, total)} de ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.punto, (completo || i < actual) && styles.puntoHecho, !completo && i === actual && styles.puntoActual]} />
      ))}
    </View>
  );
}

// Recorre las consignas una por una. El micrófono queda abierto entre consigna y consigna.
// Fuera de una lección (en Canciones) no hay XP: se cambia el texto final y no se ofrece saltear.
export function PracticaConDeteccion({ onBack, onFinish, finishing, secuencia, textoFinal = 'Terminar Lección', permitirSaltear = true }) {
  const [indice, setIndice] = useState(0);
  const [festejo, setFestejo] = useState(false);
  const [completo, setCompleto] = useState(false);
  const [puedeSaltear, setPuedeSaltear] = useState(false);

  const objetivo = secuencia[Math.min(indice, secuencia.length - 1)];
  // En una lección de cejilla, las notas sueltas que aprieta la cejilla también la muestran
  const cejillas = useMemo(() => cejillasDeSecuencia(secuencia), [secuencia]);
  // Al tocar un acorde cuerda por cuerda, cada nota muestra el acorde entero (remarcando su cuerda)
  const contextos = useMemo(() => acordesDeContexto(secuencia), [secuencia]);
  const acordeDeLaNota = contextos[Math.min(indice, secuencia.length - 1)];
  const { estado, lectura, aprobado } = useDeteccionPractica(objetivo, !completo, { seguirAlAprobar: true });

  // Sin micrófono no hay forma de aprobar: el alumno no puede quedar trabado en la lección
  const sinMicrofono = estado === 'sin-permiso' || estado === 'no-disponible' || estado === 'error';
  const varias = secuencia.length > 1;

  useEffect(() => {
    const espera = setTimeout(() => setPuedeSaltear(true), SEGUNDOS_PARA_SALTEAR * 1000);
    return () => clearTimeout(espera);
  }, []);

  // Cada acierto se festeja un momento y pasa a la siguiente consigna
  useEffect(() => {
    if (!aprobado || completo) return undefined;
    setFestejo(true);
    const espera = setTimeout(() => {
      setFestejo(false);
      if (indice + 1 >= secuencia.length) setCompleto(true);
      else setIndice(indice + 1);
    }, MS_FESTEJO);
    return () => clearTimeout(espera);
  }, [aprobado]);

  const titulo = completo
    ? (varias ? `¡Hiciste las ${secuencia.length} consignas!` : `¡Sonó ${objetivo.nombre}!`)
    : `${varias ? `Consigna ${indice + 1} de ${secuencia.length}:  ` : ''}${describir(objetivo)}`;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {varias && <Progreso total={secuencia.length} actual={indice} completo={completo} />}
        <Text style={styles.consigna} numberOfLines={1}>{titulo}</Text>
        {objetivo.tipo === 'acorde' ? (
          <GuitarNeck posiciones={objetivo.posiciones} correcto={festejo || completo} />
        ) : acordeDeLaNota ? (
          <GuitarNeck posiciones={acordeDeLaNota} resaltar={Number(objetivo.posiciones[0].cuerda)} correcto={festejo || completo} />
        ) : (
          <GuitarNeck targetNumber={objetivo.posiciones[0].traste} cuerda={objetivo.posiciones[0].cuerda} cejillas={cejillas} correcto={festejo || completo} />
        )}
        <EstadoDeteccion objetivo={objetivo} estado={estado} lectura={lectura} aprobado={festejo || completo} />
      </View>

      <View style={styles.btnRow}>
        {onBack ? <Button title="Atrás" icono="volver" variant="secondary" onPress={onBack} style={styles.btnHalf} /> : null}
        {/* En una fila no entran tres botones, y "Terminar" no sirve hasta completar todas las consignas */}
        {permitirSaltear && !completo && (puedeSaltear || sinMicrofono) ? (
          <Button
            title="Saltear (sin XP)"
            variant="secondary"
            onPress={() => onFinish({ omitida: true })}
            loading={finishing}
            style={styles.btnHalf}
          />
        ) : (
          <Button
            title={textoFinal}
            onPress={() => onFinish()}
            loading={finishing && completo}
            disabled={!completo}
            style={[styles.btnHalf, styles.btnTerminar]}
          />
        )}
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

  if (ritmo) return <RitmoStep ritmo={ritmo} onBack={onBack} onFinish={onFinish} finishing={finishing} />;
  if (quiz) return <QuizStep quiz={quiz} onBack={onBack} onFinish={onFinish} finishing={finishing} />;
  if (afinacion) return <AfinacionStep afinacion={afinacion} onBack={onBack} onFinish={onFinish} finishing={finishing} />;
  // Se separan porque el hook del micrófono solo debe existir si hay algo que detectar
  if (!secuencia) return <PracticaLibre onBack={onBack} onFinish={onFinish} finishing={finishing} leccion={leccion} />;
  if (riff && aTempo) return <RiffStep riff={riff} onBack={() => setATempo(false)} onFinish={onFinish} finishing={finishing} />;
  if (riff) {
    // Al completar las notas sigue el riff en movimiento; "Saltear" saltea la lección entera
    const alTerminarNotas = (opciones) => (opciones?.omitida ? onFinish(opciones) : setATempo(true));
    return <PracticaConDeteccion onBack={onBack} onFinish={alTerminarNotas} finishing={finishing} secuencia={secuencia} textoFinal="Ahora a tempo →" />;
  }
  return <PracticaConDeteccion onBack={onBack} onFinish={onFinish} finishing={finishing} secuencia={secuencia} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  consigna: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  progreso: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  punto: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.25)' },
  puntoHecho: { backgroundColor: '#2fbf5b' },
  puntoActual: { backgroundColor: '#fff' },
  btnRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 15, paddingTop: 4 },
  btnHalf: { flex: 1 },
  btnTerminar: { backgroundColor: '#4c52d9' },
});
