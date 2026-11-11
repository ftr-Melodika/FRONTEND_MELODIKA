// Archivo: src/components/practica/ModoContrarreloj.js
// La app pide una nota (con su cuerda) o un acorde; hay que tocarlo.
// Gana el que toca más antes de que termine el tiempo.
import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextoConIcono, COLORES_ICONO } from '../icono/Icono';
import { Button } from '../Button';
import { GuitarNeck } from '../leccion/GuitarNeck';
import { AvisoMicrofono } from '../leccion/EstadoDeteccion';
import { useDeteccionPractica } from '../../hooks/useDeteccionPractica';
import { obtenerObjetivo } from '../../utils/deteccionSonido';
import { posicionAlAzar } from '../../utils/practica';
import { acordeAlAzar } from '../../utils/acordes';
import { estilosPractica, VERDE } from './estilos';

const DURACION_S = 60;
const MS_FESTEJO = 450; // Lo que se ve el punto dorado antes de pasar a la siguiente
// Cada material tiene su récord: un acorde lleva más tiempo que una nota
const CLAVE_RECORD = { notas: 'practicaRecordContrarreloj', acordes: 'practicaRecordContrarrelojAcordes' };

const formatearTiempo = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// Lo que dice el detector de un acorde que todavía no suena bien
function pistaDeAcorde(lectura) {
  const partes = [];
  if (lectura.faltantes?.length) partes.push(`Falta ${lectura.faltantes.join(', ')}`);
  if (lectura.sobrantes?.length) partes.push(`Sobra ${lectura.sobrantes.join(', ')}`);
  return partes.join('  •  ');
}

export function ModoContrarreloj({ material, acordes }) {
  const conAcordes = material === 'acordes';
  // { posicion } con notas, { acorde } con acordes. Nunca se repite el anterior: el que todavía
  // suena aprobaría el siguiente sin tocar nada.
  const elegirSiguiente = (anterior) =>
    conAcordes ? { acorde: acordeAlAzar(acordes, anterior?.acorde) } : { posicion: posicionAlAzar(anterior?.posicion) };

  const [fase, setFase] = useState('inicio'); // inicio | preparando | jugando | fin
  const [actual, setActual] = useState(() => elegirSiguiente(null));
  const [pista, setPista] = useState(false);
  const [festejo, setFestejo] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const [salteadas, setSalteadas] = useState(0);
  const [restante, setRestante] = useState(DURACION_S);
  const [record, setRecord] = useState(0);
  const [nuevoRecord, setNuevoRecord] = useState(false);
  const finEn = useRef(0);
  const faseActual = useRef(fase);
  faseActual.current = fase;

  const objetivo = useMemo(
    () => (actual.acorde ? actual.acorde.objetivo : obtenerObjetivo({ cuerda: actual.posicion.cuerda, trasteObjetivo: actual.posicion.traste })),
    [actual]
  );
  const enCurso = fase === 'preparando' || fase === 'jugando';
  // El micrófono sigue abierto entre una y otra: si se cerrara, tardaría en volver
  const { estado, lectura, aprobado } = useDeteccionPractica(objetivo, enCurso, { seguirAlAprobar: true });
  const sinMicrofono = estado === 'sin-permiso' || estado === 'no-disponible' || estado === 'error';
  const claveRecord = CLAVE_RECORD[material];

  const siguiente = () => {
    setPista(false);
    setActual((anterior) => elegirSiguiente(anterior));
  };

  useEffect(() => {
    AsyncStorage.getItem(claveRecord)
      .then((valor) => setRecord(Number(valor) || 0))
      .catch(() => {});
  }, [claveRecord]);

  // El reloj arranca recién cuando terminó de medir el ruido del lugar
  useEffect(() => {
    if (fase !== 'preparando' || !lectura || lectura.calibrando) return;
    finEn.current = Date.now() + DURACION_S * 1000;
    setRestante(DURACION_S);
    siguiente(); // Lo que se tocó mientras medía no cuenta
    setFase('jugando');
  }, [fase, lectura]);

  useEffect(() => {
    if (fase !== 'jugando') return undefined;
    const intervalo = setInterval(() => {
      setRestante(Math.max(0, Math.ceil((finEn.current - Date.now()) / 1000)));
    }, 200);
    return () => clearInterval(intervalo);
  }, [fase]);

  useEffect(() => {
    if (fase !== 'jugando' || restante > 0) return;
    setFase('fin');
    setFestejo(false);
    if (aciertos > record) {
      setRecord(aciertos);
      setNuevoRecord(true);
      AsyncStorage.setItem(claveRecord, String(aciertos)).catch(() => {});
    }
  }, [fase, restante, aciertos, record, claveRecord]);

  // Solo depende de `aprobado`: cada objetivo nuevo lo vuelve a false, así se cuenta una vez
  useEffect(() => {
    if (!aprobado || faseActual.current !== 'jugando') return undefined;
    setAciertos((n) => n + 1);
    setFestejo(true);
    const espera = setTimeout(() => {
      setFestejo(false);
      siguiente();
    }, MS_FESTEJO);
    return () => clearTimeout(espera);
  }, [aprobado]);

  const empezar = () => {
    setAciertos(0);
    setSalteadas(0);
    setNuevoRecord(false);
    setFestejo(false);
    setRestante(DURACION_S);
    siguiente();
    setFase('preparando');
  };

  const saltear = () => {
    if (festejo) return;
    setSalteadas((n) => n + 1);
    siguiente();
  };

  const jugando = fase === 'jugando';
  const mostrarForma = jugando && (pista || festejo);
  // Solo se avisa lo que se mantiene: un ruido suelto no debe aparecer
  const suenaMal = jugando && !festejo && lectura?.hayNota && !lectura.correcta;

  let consigna = conAcordes ? 'Contrarreloj de acordes' : 'Contrarreloj de notas';
  if (jugando && conAcordes) consigna = (suenaMal && pistaDeAcorde(lectura)) || `Rasgueá ${objetivo.nombre}`;
  if (jugando && !conAcordes) {
    consigna = suenaMal
      ? `Suena ${lectura.notaDetectada}, buscá ${objetivo.nombre}`
      : `Tocá ${objetivo.nombre} en la cuerda ${actual.posicion.cuerda}`;
  }

  const unidad = conAcordes ? 'acordes' : 'notas';

  return (
    <View style={estilosPractica.fila}>
      <View style={estilosPractica.columnaMastil}>
        <Text style={estilosPractica.consigna} numberOfLines={1}>{consigna}</Text>
        {conAcordes ? (
          <GuitarNeck posiciones={mostrarForma ? actual.acorde.objetivo.posiciones : undefined} correcto={festejo} />
        ) : (
          <GuitarNeck
            targetNumber={mostrarForma ? actual.posicion.traste : null}
            cuerda={jugando ? actual.posicion.cuerda : null}
            correcto={festejo}
          />
        )}
        <Text style={estilosPractica.ayuda}>Practicá libremente: esto no suma XP ni racha.</Text>
      </View>

      <ScrollView style={estilosPractica.columnaLateral} contentContainerStyle={estilosPractica.lateralContenido}>
        {fase === 'inicio' && (
          <>
            <Text style={estilosPractica.pregunta}>¿Cuántos {unidad} llegás a tocar?</Text>
            <Text style={styles.explicacion}>
              {conAcordes
                ? `Tenés ${DURACION_S} segundos. Te digo un acorde: armalo y rasguealo hasta que suene bien. Si no te acordás la forma, pedí una pista.`
                : `Tenés ${DURACION_S} segundos. Te digo una nota y su cuerda: buscala en el mástil y tocala. Si no la encontrás, pedí una pista.`}
            </Text>
            {record > 0 && <TextoConIcono nombre="trofeo" acento={COLORES_ICONO.oro} centrado style={estilosPractica.marcador}>Tu récord: {record} {unidad}</TextoConIcono>}
            <Button title="Empezar" iconoDerecha="play" onPress={empezar} />
          </>
        )}

        {fase === 'preparando' && (
          <>
            {sinMicrofono ? (
              <AvisoMicrofono estado={estado} />
            ) : (
              <Text style={styles.explicacion}>Hacé silencio un momento: estoy midiendo el ruido del lugar…</Text>
            )}
            <Button title="Cancelar" variant="secondary" onPress={() => setFase('inicio')} />
          </>
        )}

        {jugando && (
          <>
            <TextoConIcono nombre="reloj" tamano={20} acento={restante <= 10 ? COLORES_ICONO.rojo : COLORES_ICONO.celeste} centrado style={[styles.reloj, restante <= 10 && styles.relojFinal]}>
              {formatearTiempo(restante)}
            </TextoConIcono>
            <Text style={[estilosPractica.notaGrande, festejo && styles.notaFestejo]}>{objetivo.nombre}</Text>
            <Text style={estilosPractica.detalleNota}>
              {festejo ? '¡Bien!' : conAcordes ? actual.acorde.titulo : `en la cuerda ${actual.posicion.cuerda}`}
            </Text>
            <View style={estilosPractica.botonesFila}>
              <Button title="Pista" variant="secondary" onPress={() => setPista(true)} disabled={pista || festejo} style={estilosPractica.botonMitad} />
              <Button title="Saltear" variant="secondary" onPress={saltear} disabled={festejo} style={estilosPractica.botonMitad} />
            </View>
            <View style={estilosPractica.marcadorFila}>
              <TextoConIcono nombre="completado" acento={COLORES_ICONO.verde} style={estilosPractica.marcador}>{aciertos} {unidad}</TextoConIcono>
              {record > 0 && <TextoConIcono nombre="trofeo" acento={COLORES_ICONO.oro} style={estilosPractica.marcador}>Récord {record}</TextoConIcono>}
            </View>
          </>
        )}

        {fase === 'fin' && (
          <>
            <Text style={estilosPractica.pregunta}>¡Tiempo!</Text>
            <Text style={estilosPractica.notaGrande}>{aciertos}</Text>
            <Text style={estilosPractica.detalleNota}>
              {conAcordes ? 'acordes tocados' : 'notas tocadas'}
              {salteadas ? `  •  ${salteadas} ${conAcordes ? 'salteados' : 'salteadas'}` : ''}
            </Text>
            {nuevoRecord ? (
              <TextoConIcono nombre="trofeo" acento={COLORES_ICONO.oro} centrado style={styles.nuevoRecord}>¡Nuevo récord!</TextoConIcono>
            ) : (
              record > 0 && <TextoConIcono nombre="trofeo" acento={COLORES_ICONO.oro} centrado style={estilosPractica.marcador}>Tu récord: {record} {unidad}</TextoConIcono>
            )}
            <Button title="Jugar de nuevo" iconoDerecha="cambiar" onPress={empezar} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  explicacion: { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', marginBottom: 10, lineHeight: 20 },
  reloj: { color: '#fff', fontSize: 22, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  relojFinal: { color: '#ff9eaa' },
  notaFestejo: { color: '#f5b82e' },
  nuevoRecord: { color: VERDE, fontSize: 16, fontWeight: 'bold' },
});
