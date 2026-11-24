// Archivo: src/components/leccion/CancionStep.js
// La clase de canción al final de un curso, con el mismo formato que la sección Canciones:
// - fase 'aprender' (anteúltima clase): cada acorde y después los cambios entre acordes.
// - fase 'tocar' (última clase): la canción a tempo, con los acordes avanzando por el mástil.
import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '../Button';
import { PracticaConDeteccion } from './PracticaConDeteccion';
import { RiffStep } from './RiffStep';
import { useCancion, mensajeError } from '../../hooks/useConsultas';
import { aprendizajeDeCancion, riffDeCancion } from '../../utils/canciones';
import { opcionesConEscalon } from '../../utils/riff';

// `bpm` (opcional) pisa el tempo de la canción. Con `escalon` (0 a 1) se puede practicar más lento,
// pero la clase solo se aprueba a velocidad original.
export function CancionStep({ cancionId, fase, bpm, escalon, onBack, onFinish, finishing }) {
  const consulta = useCancion(cancionId);
  const cancionBase = consulta.data;
  const cancion = useMemo(() => (cancionBase && bpm ? { ...cancionBase, bpm } : cancionBase), [cancionBase, bpm]);
  const [velocidad, setVelocidad] = useState(escalon ?? 1);
  // 0 = los acordes, 1 = los cambios
  const [paso, setPaso] = useState(0);
  const aprendizaje = useMemo(() => (cancion && fase === 'aprender' ? aprendizajeDeCancion(cancion) : null), [cancion, fase]);
  const riff = useMemo(() => (cancion && fase === 'tocar' ? riffDeCancion(cancion, velocidad) : null), [cancion, fase, velocidad]);

  if (!cancion) {
    return (
      <View style={styles.centro}>
        {consulta.isLoading
          ? <ActivityIndicator color="#fff" size="large" />
          : <Text style={styles.texto}>{mensajeError(consulta) || 'No encontramos la canción de esta clase.'}</Text>}
        {!consulta.isLoading && onBack ? <Button title="Atrás" icono="volver" variant="secondary" onPress={onBack} /> : null}
      </View>
    );
  }

  if (fase === 'tocar') {
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

  // "Saltear" saltea la clase entera, igual que en el resto de las lecciones
  const alTerminarAcordes = (opciones) => (opciones?.omitida ? onFinish(opciones) : setPaso(1));
  if (paso === 0) {
    return (
      <PracticaConDeteccion
        key="acordes"
        secuencia={aprendizaje.acordes}
        onBack={onBack}
        onFinish={alTerminarAcordes}
        finishing={finishing}
        textoFinal="Siguiente: los cambios →"
      />
    );
  }
  return (
    <PracticaConDeteccion
      key="cambios"
      secuencia={aprendizaje.cambios}
      onBack={() => setPaso(0)}
      onFinish={onFinish}
      finishing={finishing}
      autoTerminar
    />
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  texto: { color: '#fff', fontSize: 14, textAlign: 'center' },
});
