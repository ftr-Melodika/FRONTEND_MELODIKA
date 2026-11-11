// Archivo: src/screens/LeccionScreen.js
import { useState, useContext, useMemo } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';

import { LeccionSidebar } from '../components/leccion/LeccionSideBar';
import { VideoStep } from '../components/leccion/VideoStep';
import { TheoryStep } from '../components/leccion/TheoryStep';
import { PracticeStep } from '../components/leccion/PracticeStep';
import { FinLeccion } from '../components/leccion/FinLeccion';

import { AuthContext } from '../context/AuthContext';
import { useStreak } from '../hooks/useStreak';
import { rachaService } from '../services/rachaService';
import { leccionesService } from '../services/leccionesService';
import { obtenerSecuencia } from '../utils/deteccionSonido';
import { obtenerAfinacion, obtenerQuiz } from '../utils/actividades';

// Texto por defecto de la barra lateral según el tipo de paso
const INSTRUCCION_POR_DEFECTO = {
  video: 'Mirá la técnica que usa el profe en el video antes de agarrar la guitarra.',
  teoria: 'Leé la teoría con atención. Acordate que la cuerda más fina es la 1ra.',
  practica: '¡A tocar! Posicioná tus dedos exactamente como marca el mástil.',
  quiz: 'Mirá la parte marcada en el dibujo y elegí cómo se llama.',
  afinacion: 'Tocá cada cuerda al aire y girá su clavija hasta que la aguja quede en el centro.',
};

// Armamos los pasos según lo que traiga la lección: si no tiene video, no mostramos ese paso, etc.
function armarPasos(leccion) {
  const pasos = [];
  if (leccion.videoId) pasos.push('video');
  pasos.push('teoria');
  const hayTraste = leccion.trasteObjetivo !== null && leccion.trasteObjetivo !== undefined;
  if (hayTraste || obtenerSecuencia(leccion) || obtenerQuiz(leccion) || obtenerAfinacion(leccion)) pasos.push('practica');
  return pasos;
}

export function LeccionScreen({ route, navigation }) {
  const leccion = route.params?.leccion || {};
  const cursoId = route.params?.cursoId ?? leccion.cursoId;

  const pasos = useMemo(() => armarPasos(leccion), [leccion]);
  const [indice, setIndice] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [fin, setFin] = useState(null); // { titulo, mensaje, icono, cursoCompletado } al terminar

  // La lección siguiente del mismo curso (Home pasa la lista), para seguir sin volver al mapa
  const lecciones = route.params?.lecciones || [];
  const siguiente = lecciones[lecciones.findIndex((l) => l.id === leccion.id) + 1] || null;

  const { perfil, parchearPerfil } = useContext(AuthContext);
  const perfilId = perfil?.id;
  const { showStreak } = useStreak();
  // La app dibuja hasta el borde: a la derecha pueden estar la cámara o la barra de navegación
  const insets = useSafeAreaInsets();

  const pasoActual = pasos[indice];
  const tipoPractica = leccion.practica?.tipo === 'quiz' || leccion.practica?.tipo === 'afinacion' ? leccion.practica.tipo : 'practica';
  const esUltimo = indice === pasos.length - 1;
  const irAtras = indice > 0 ? () => setIndice(indice - 1) : null;
  const irAdelante = () => setIndice(Math.min(indice + 1, pasos.length - 1));

  const instruccion =
    leccion.instrucciones?.[indice] ||
    INSTRUCCION_POR_DEFECTO[pasoActual === 'practica' ? tipoPractica : pasoActual];

  // Al terminar: 1) registramos la lección (XP) en el backend, 2) chequeamos la racha,
  // 3) actualizamos el perfil en memoria y 4) mostramos el cierre, con el botón para seguir.
  // El frontend NO decide si la racha sube: solo obedece lo que devuelve el backend.
  // Si el alumno salteó la detección (omitida) no suma XP ni sostiene la racha.
  const handleTerminar = async ({ omitida = false } = {}) => {
    if (finishing) return;
    setFinishing(true);

    let xpGanada = 0;
    let yaCompletada = false;
    let cursoCompletado = false;
    let quedoOmitida = omitida;
    const cambiosPerfil = {};

    try {
      if (perfilId && !leccion.esMock) {
        const resultado = await leccionesService.completarLeccion(perfilId, cursoId, leccion.id, { omitida });
        xpGanada = resultado.xpGanada || 0;
        yaCompletada = resultado.yaCompletada;
        // El backend avisa si el curso está terminado, aunque ya lo estuviera antes de esta lección
        cursoCompletado = !!resultado.cursoCompletado && !route.params?.cursoYaCompletado;
        quedoOmitida = resultado.omitida === true;
        // Pidió saltear una lección ya completada: el backend no cambia nada
        if (omitida && resultado.omitida === false && xpGanada === 0) yaCompletada = true;
        if (resultado.xpTotal !== null && resultado.xpTotal !== undefined) {
          cambiosPerfil.xp = Number(resultado.xpTotal);
        }
      }
    } catch (error) {
      setFinishing(false);
      Alert.alert('No se pudo guardar tu progreso', error.message);
      return;
    }

    if (perfilId && !omitida) {
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

    if (quedoOmitida) {
      setFin({ titulo: 'Lección salteada', icono: 'adelante', mensaje: 'No sumó XP, pero si volvés y la tocás bien lo ganás.' });
    } else if (yaCompletada) {
      setFin({ titulo: '¡Bien repasado!', icono: 'check', mensaje: 'Ya habías completado esta lección, así que no suma XP de nuevo.' });
    } else if (cursoCompletado) {
      setFin({ titulo: '¡Curso completado!', mensaje: `Ganaste ${xpGanada} XP y terminaste el curso. ¡Se desbloqueó el siguiente!`, cursoCompletado });
    } else {
      setFin({ titulo: '¡Lección completada!', mensaje: `Ganaste ${xpGanada || leccion.xp || 0} XP.` });
    }
  };

  // Reemplaza la pantalla: "Atrás" vuelve al curso, no a la lección anterior
  const irASiguiente = () => {
    navigation.replace('Leccion', {
      ...route.params,
      leccion: siguiente,
      cursoYaCompletado: !!route.params?.cursoYaCompletado || !!fin?.cursoCompletado,
    });
  };

  if (fin) {
    return (
      <Background>
        <View style={[styles.horizontalContainer, { paddingRight: Math.max(insets.right, 15) }]}>
          <FinLeccion
            titulo={fin.titulo}
            mensaje={fin.mensaje}
            icono={fin.icono}
            siguiente={siguiente}
            onSiguiente={irASiguiente}
            onVolver={() => navigation.goBack()}
          />
        </View>
      </Background>
    );
  }

  return (
    <Background>
      <View style={[styles.horizontalContainer, { paddingRight: Math.max(insets.right, 15) }]}>

        <LeccionSidebar
          leccion={leccion}
          paso={indice + 1}
          totalPasos={pasos.length}
          instruccion={instruccion}
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
              leccion={leccion}
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
