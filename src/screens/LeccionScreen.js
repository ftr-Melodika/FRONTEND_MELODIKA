// Archivo: src/screens/LeccionScreen.js
import { useState, useContext, useMemo } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Background } from '../components/Background';

import { LeccionSidebar } from '../components/leccion/LeccionSideBar';
import { VideoStep } from '../components/leccion/VideoStep';
import { TheoryStep } from '../components/leccion/TheoryStep';
import { PracticeStep } from '../components/leccion/PracticeStep';

import { AuthContext } from '../context/AuthContext';
import { useStreak } from '../hooks/useStreak';
import { rachaService } from '../services/rachaService';
import { leccionesService } from '../services/leccionesService';

// Texto por defecto de la barra lateral según el tipo de paso
const INSTRUCCION_POR_DEFECTO = {
  video: 'Mirá la técnica que usa el profe en el video antes de agarrar la guitarra.',
  teoria: 'Leé la teoría con atención. Acordate que la cuerda más fina es la 1ra.',
  practica: '¡A tocar! Posicioná tus dedos exactamente como marca el mástil.',
};

// Armamos los pasos según lo que traiga la lección: si no tiene video, no mostramos ese paso, etc.
function armarPasos(leccion) {
  const pasos = [];
  if (leccion.videoId) pasos.push('video');
  pasos.push('teoria');
  if (leccion.trasteObjetivo !== null && leccion.trasteObjetivo !== undefined) pasos.push('practica');
  return pasos;
}

export function LeccionScreen({ route, navigation }) {
  const leccion = route.params?.leccion || {};
  const cursoId = route.params?.cursoId ?? leccion.cursoId;

  const pasos = useMemo(() => armarPasos(leccion), [leccion]);
  const [indice, setIndice] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const { perfil, parchearPerfil } = useContext(AuthContext);
  const perfilId = perfil?.id;
  const { showStreak } = useStreak();

  const pasoActual = pasos[indice];
  const esUltimo = indice === pasos.length - 1;
  const irAtras = indice > 0 ? () => setIndice(indice - 1) : null;
  const irAdelante = () => setIndice(Math.min(indice + 1, pasos.length - 1));

  const instruccion =
    leccion.instrucciones?.[indice] ||
    INSTRUCCION_POR_DEFECTO[pasoActual];

  // Al terminar: 1) registramos la lección (XP) en el backend, 2) chequeamos la racha,
  // 3) actualizamos el perfil en memoria y 4) volvemos al mapa.
  // El frontend NO decide si la racha sube: solo obedece lo que devuelve el backend.
  const handleTerminar = async () => {
    if (finishing) return;
    setFinishing(true);

    let xpGanada = 0;
    let yaCompletada = false;
    let cursoCompletado = false;
    const cambiosPerfil = {};

    try {
      if (perfilId && !leccion.esMock) {
        const resultado = await leccionesService.completarLeccion(perfilId, cursoId, leccion.id);
        xpGanada = resultado.xpGanada || 0;
        yaCompletada = resultado.yaCompletada;
        cursoCompletado = !!resultado.cursoCompletado;
        if (resultado.xpTotal !== null && resultado.xpTotal !== undefined) {
          cambiosPerfil.xp = Number(resultado.xpTotal);
        }
      }
    } catch (error) {
      setFinishing(false);
      Alert.alert('No se pudo guardar tu progreso', error.message);
      return;
    }

    if (perfilId) {
      const racha = await rachaService.chequearRacha(perfilId);
      if (racha?.exito !== false && racha?.rachaActual !== undefined) {
        cambiosPerfil.racha = racha.rachaActual;
      }
      if (racha?.mostrarAnimacion) {
        showStreak(racha.rachaAnterior, racha.rachaActual);
      }
    }
    if (Object.keys(cambiosPerfil).length > 0) {
      await parchearPerfil(cambiosPerfil);
    }

    setFinishing(false);

    if (yaCompletada) {
      Alert.alert('¡Bien repasado! 🎸', 'Ya habías completado esta lección, así que no suma XP de nuevo.');
    } else if (cursoCompletado) {
      Alert.alert('¡Curso completado! 🏆', `Ganaste ${xpGanada} XP y terminaste el curso. ¡Se desbloqueó el siguiente!`);
    } else {
      Alert.alert('¡Lección Completada! 🏆', `Ganaste ${xpGanada || leccion.xp || 0} XP.`);
    }
    navigation.goBack();
  };

  return (
    <Background>
      <View style={styles.horizontalContainer}>

        <LeccionSidebar
          leccion={leccion}
          paso={indice + 1}
          totalPasos={pasos.length}
          instruccion={instruccion}
          onBack={() => navigation.goBack()}
        />

        <View style={styles.mainContent}>
          {pasoActual === 'video' && (
            <VideoStep
              videoId={leccion.videoId}
              onNext={esUltimo ? handleTerminar : irAdelante}
            />
          )}

          {pasoActual === 'teoria' && (
            <TheoryStep
              textoPrincipal={leccion.textoTeoria || leccion.descripcion || 'Prestá atención a la explicación y practicá a tu ritmo.'}
              textoDestacado={leccion.textoDestacado}
              onBack={irAtras}
              onNext={esUltimo ? handleTerminar : irAdelante}
              esUltimo={esUltimo}
              finishing={finishing}
            />
          )}

          {pasoActual === 'practica' && (
            <PracticeStep
              trasteObjetivo={leccion.trasteObjetivo}
              cuerda={leccion.cuerda}
              notaEsperada={leccion.notaEsperada}
              dotLeft={leccion.dotLeft}
              dotBottom={leccion.dotBottom}
              onBack={irAtras}
              onFinish={handleTerminar}
              finishing={finishing}
            />
          )}
        </View>

      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  horizontalContainer: { flex: 1, flexDirection: 'row', padding: 15, gap: 15 },
  // Eliminamos alignItems: 'center' para evitar que los steps colapsen
  mainContent: { flex: 1, justifyContent: 'center' },
});
