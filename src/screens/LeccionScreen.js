// Archivo: src/screens/LeccionScreen.js
import { useState, useContext, useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, Pressable, Text, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';

import { LeccionSidebar } from '../components/leccion/LeccionSideBar';
import { VideoStep } from '../components/leccion/VideoStep';
import { TheoryStep } from '../components/leccion/TheoryStep';
import { PracticeStep } from '../components/leccion/PracticeStep';
import { FinLeccion } from '../components/leccion/FinLeccion';
import { IntroPractica } from '../components/leccion/IntroPractica';
import { MenuPausa } from '../components/leccion/MenuPausa';

import { AuthContext } from '../context/AuthContext';
import { VistaLeccionContext } from '../context/VistaLeccionContext';
import { FUENTE_TITULO } from '../theme/fuentes';
import { useStreak } from '../hooks/useStreak';
import { rachaService } from '../services/rachaService';
import { leccionesService } from '../services/leccionesService';
import { obtenerSecuencia } from '../utils/deteccionSonido';
import { obtenerAfinacion, obtenerCancion, obtenerQuiz } from '../utils/actividades';
import { obtenerRitmo } from '../utils/ritmo';
import { armarNotasAlAzar, obtenerConsignas } from '../utils/consignas';
import { usaVistaInmersiva } from '../utils/vistaInmersiva';

// Texto por defecto de la barra lateral según el tipo de paso
const INSTRUCCION_POR_DEFECTO = {
  video: 'Mirá la técnica que usa el profe en el video antes de agarrar la guitarra.',
  teoria: 'Leé la teoría con atención. Acordate que la cuerda más fina es la 1ra.',
  practica: '¡A tocar! Posicioná tus dedos exactamente como marca el mástil.',
  quiz: 'Leé cada pregunta y elegí la respuesta correcta. Si hay una imagen, mirala con atención.',
  afinacion: 'Tocá cada cuerda al aire y girá su clavija hasta que la aguja quede en el centro.',
  ritmo: 'Tocá Empezar, esperá la cuenta y aplaudí con cada pulso (el clic o la luz). Marcá el pulso con el pie.',
  cancion: 'Armá cada acorde de la canción. En la última clase vas a tocarla entera, con los acordes avanzando por el mástil.',
  cancionTocar: 'Tocá Empezar y rasgueá cada acorde cuando llegue a la línea amarilla. ¡Es la prueba final del curso!',
};

// Armamos los pasos según lo que traiga la lección: si no tiene video, no mostramos ese paso, etc.
function armarPasos(leccion) {
  const pasos = [];
  if (leccion.videoId) pasos.push('video');
  const hayTraste = leccion.trasteObjetivo !== null && leccion.trasteObjetivo !== undefined;
  const hayPractica = hayTraste || !!obtenerSecuencia(leccion) || !!obtenerQuiz(leccion) || !!obtenerAfinacion(leccion) || !!obtenerRitmo(leccion) || !!obtenerCancion(leccion) || !!obtenerConsignas(leccion) || !!armarNotasAlAzar(leccion.practica);
  // Sin texto de teoría, ese paso solo mostraría un mensaje genérico: si hay práctica, se saltea
  const hayTeoria = !!leccion.textoTeoria || !!leccion.textoDestacado;
  if (hayTeoria || !hayPractica) pasos.push('teoria');
  if (hayPractica) pasos.push('practica');
  return pasos;
}

export function LeccionScreen({ route, navigation }) {
  const leccion = route.params?.leccion || {};
  const cursoId = route.params?.cursoId ?? leccion.cursoId;

  const pasos = useMemo(() => armarPasos(leccion), [leccion]);
  const [indice, setIndice] = useState(0);
  const [finishing, setFinishing] = useState(false);
  // Candado instantáneo: `finishing` (estado) tarda un render en activarse y dos disparos seguidos lo pasan
  const terminandoRef = useRef(false);
  const [instruccionConsigna, setInstruccionConsigna] = useState(null);
  // Vista inmersiva de la práctica: la intro se ve una vez y el menú de pausa se abre al tocar la pantalla
  const [introHecha, setIntroHecha] = useState(false);
  const [pausado, setPausado] = useState(false);
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
  const tipoPractica = ['quiz', 'afinacion', 'ritmo'].includes(leccion.practica?.tipo) ? leccion.practica.tipo
    : obtenerCancion(leccion) ? (leccion.practica.fase === 'tocar' ? 'cancionTocar' : 'cancion')
    : 'practica';
  const esUltimo = indice === pasos.length - 1;
  const irAtras = indice > 0 ? () => setIndice(indice - 1) : null;
  const irAdelante = () => setIndice(Math.min(indice + 1, pasos.length - 1));

  // La práctica con mástil ocupa casi toda la pantalla; la intro solo va si es lo primero de la clase
  const inmersiva = pasoActual === 'practica' && usaVistaInmersiva(leccion);
  const mostrarIntro = inmersiva && indice === 0 && !introHecha;
  const jugandoInmersiva = inmersiva && !mostrarIntro && !fin;
  const salirDeLaClase = () => (irAtras ? irAtras() : navigation.goBack());

  // El botón "atrás" de Android abre la pausa (y la cierra si ya estaba abierta) en vez de salir de golpe
  useEffect(() => {
    if (!jugandoInmersiva) {
      setPausado(false);
      return undefined;
    }
    const suscripcion = BackHandler.addEventListener('hardwareBackPress', () => {
      setPausado((abierto) => !abierto);
      return true;
    });
    return () => suscripcion.remove();
  }, [jugandoInmersiva]);
  const vistaInmersiva = useMemo(() => ({ inmersivo: true, pausado }), [pausado]);

  // En una clase con varias consignas, cada una puede traer su propia instrucción
  const instruccion =
    (pasoActual === 'practica' && instruccionConsigna) ||
    leccion.instrucciones?.[indice] ||
    INSTRUCCION_POR_DEFECTO[pasoActual === 'practica' ? tipoPractica : pasoActual];

  // Al terminar: 1) registramos la lección (XP) en el backend, 2) chequeamos la racha,
  // 3) actualizamos el perfil en memoria y 4) mostramos el cierre, con el botón para seguir.
  // El frontend NO decide si la racha sube: solo obedece lo que devuelve el backend.
  // Si el alumno salteó la detección (omitida) no suma XP ni sostiene la racha.
  const handleTerminar = async ({ omitida = false } = {}) => {
    if (finishing || terminandoRef.current) return;
    terminandoRef.current = true;
    setPausado(false);
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
      terminandoRef.current = false;
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
            onVolver={fin.cursoCompletado ? () => navigation.navigate('Home', { verCursos: true }) : () => navigation.goBack()}
            textoVolver={fin.cursoCompletado ? 'Volver a los cursos' : 'Volver al curso'}
          />
        </View>
      </Background>
    );
  }

  if (mostrarIntro) {
    return (
      <Background>
        <View style={[styles.horizontalContainer, { paddingLeft: Math.max(insets.left, 15), paddingRight: Math.max(insets.right, 15) }]}>
          <IntroPractica
            titulo={leccion.titulo}
            xp={leccion.xp}
            instruccion={instruccion}
            onEmpezar={() => setIntroHecha(true)}
            onVolver={salirDeLaClase}
          />
        </View>
      </Background>
    );
  }

  if (jugandoInmersiva) {
    const instruccionCorta = instruccionConsigna || leccion.instrucciones?.[indice] || null;
    return (
      <Background>
        <VistaLeccionContext.Provider value={vistaInmersiva}>
          {/* Tocar cualquier parte abre la pausa; los botones de adentro (carteles) siguen andando */}
          <Pressable
            style={[styles.inmersivo, { paddingLeft: Math.max(insets.left, 15), paddingRight: Math.max(insets.right, 15) }]}
            onPress={() => { if (!finishing) setPausado(true); }}
            accessible={false}
          >
            <View style={styles.cabeceraInmersiva} pointerEvents="none">
              <Text style={styles.tituloInmersivo} numberOfLines={1}>{leccion.titulo || 'Lección'}</Text>
              {instruccionCorta ? <Text style={styles.instruccionInmersiva} numberOfLines={2}>{instruccionCorta}</Text> : null}
            </View>
            <View style={styles.zonaInmersiva}>
              <PracticeStep
                leccion={leccion}
                onBack={irAtras}
                onFinish={handleTerminar}
                finishing={finishing}
                onInstruccion={setInstruccionConsigna}
              />
            </View>
            {/* Pista de que se puede pausar: no se toca, vale toda la pantalla */}
            <View style={[styles.pistaPausa, { right: Math.max(insets.right, 15) }]} pointerEvents="none">
              <View style={styles.barraPausa} />
              <View style={styles.barraPausa} />
            </View>
          </Pressable>
          {pausado ? (
            <MenuPausa
              onReanudar={() => setPausado(false)}
              onVolver={() => { setPausado(false); salirDeLaClase(); }}
              onSaltear={() => handleTerminar({ omitida: true })}
              saltando={finishing}
            />
          ) : null}
        </VistaLeccionContext.Provider>
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
              onInstruccion={setInstruccionConsigna}
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
  // Vista inmersiva: título centrado arriba y la práctica ocupa el resto
  inmersivo: { flex: 1, paddingVertical: 10 },
  cabeceraInmersiva: { alignItems: 'center', paddingHorizontal: 40, gap: 2 },
  tituloInmersivo: { color: '#fff', fontSize: 20, fontFamily: FUENTE_TITULO, fontWeight: 'bold', textAlign: 'center' },
  instruccionInmersiva: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center' },
  zonaInmersiva: { flex: 1, justifyContent: 'center' },
  pistaPausa: { position: 'absolute', top: 14, flexDirection: 'row', gap: 3, opacity: 0.35 },
  barraPausa: { width: 4, height: 14, borderRadius: 2, backgroundColor: '#fff' },
});
