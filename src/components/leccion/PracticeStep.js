// Archivo: src/components/leccion/PracticeStep.js
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../Button';
import { GuitarNeck } from './GuitarNeck';
import { EstadoDeteccion } from './EstadoDeteccion';
import { useDeteccionPractica } from '../../hooks/useDeteccionPractica';
import { obtenerObjetivo } from '../../utils/deteccionSonido';

const SEGUNDOS_PARA_SALTEAR = 20;

// Texto de la consigna: en una nota indica dónde pisar; en un acorde lo muestra el mástil
function armarConsigna(objetivo) {
  if (objetivo.tipo === 'acorde') return `Acorde: ${objetivo.nombre}`;
  const { cuerda, traste } = objetivo.posiciones[0];
  return `Cuerda ${cuerda}  •  ${traste === 0 ? 'Al aire' : `Traste ${traste}`}  •  Nota: ${objetivo.nombre}`;
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

function PracticaConDeteccion({ onBack, onFinish, finishing, objetivo }) {
  const { estado, lectura, aprobado } = useDeteccionPractica(objetivo);
  const [puedeSaltear, setPuedeSaltear] = useState(false);

  // Sin micrófono no hay forma de aprobar: el alumno no puede quedar trabado en la lección
  const sinMicrofono = estado === 'sin-permiso' || estado === 'no-disponible' || estado === 'error';

  useEffect(() => {
    const espera = setTimeout(() => setPuedeSaltear(true), SEGUNDOS_PARA_SALTEAR * 1000);
    return () => clearTimeout(espera);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.consigna}>{armarConsigna(objetivo)}</Text>
        <GuitarNeck
          posiciones={objetivo.tipo === 'acorde' ? objetivo.posiciones : undefined}
          targetNumber={objetivo.posiciones[0].traste}
          cuerda={objetivo.posiciones[0].cuerda}
        />
        <EstadoDeteccion objetivo={objetivo} estado={estado} lectura={lectura} aprobado={aprobado} />
      </View>

      <View style={styles.btnRow}>
        {onBack ? <Button title="Atrás" icono="volver" variant="secondary" onPress={onBack} style={styles.btnHalf} /> : null}
        {/* En una fila no entran tres botones, y "Terminar" no sirve hasta aprobar */}
        {!aprobado && (puedeSaltear || sinMicrofono) ? (
          <Button
            title="Saltear (sin XP)"
            variant="secondary"
            onPress={() => onFinish({ omitida: true })}
            loading={finishing}
            style={styles.btnHalf}
          />
        ) : (
          <Button
            title="Terminar Lección"
            onPress={() => onFinish()}
            loading={finishing && aprobado}
            disabled={!aprobado}
            style={[styles.btnHalf, styles.btnTerminar]}
          />
        )}
      </View>
    </View>
  );
}

export function PracticeStep({ onBack, onFinish, finishing, leccion }) {
  const objetivo = useMemo(() => obtenerObjetivo(leccion), [leccion]);

  // Se separan porque el hook del micrófono solo debe existir si hay algo que detectar
  if (!objetivo) return <PracticaLibre onBack={onBack} onFinish={onFinish} finishing={finishing} leccion={leccion} />;
  return <PracticaConDeteccion onBack={onBack} onFinish={onFinish} finishing={finishing} objetivo={objetivo} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  consigna: { color: '#a3fba3', fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  btnRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 15, paddingTop: 4 },
  btnHalf: { flex: 1 },
  btnTerminar: { backgroundColor: '#4c52d9' },
});
