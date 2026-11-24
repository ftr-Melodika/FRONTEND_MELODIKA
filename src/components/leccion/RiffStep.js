// Archivo: src/components/leccion/RiffStep.js
// El riff en movimiento: las notas avanzan de derecha a izquierda sobre las cuerdas, en cuadrados
// con el número de traste, y hay que tocar cada una cuando pasa por la línea amarilla (ver RiffMastil).
// Si se erra mucho, el mástil se frena y vuelve a donde se empezó a errar. Si se traba siempre en el
// mismo acorde (o nota), se abre la práctica de ese acorde y, al hacerla bien, sigue desde ahí.
// En modo zurdo (ver useZurdo) el mástil se ve espejado: la línea queda a la derecha y las notas
// avanzan hacia la derecha. Los textos se vuelven a dar vuelta para que se lean.
// En las canciones avanzan acordes: un rectángulo con el nombre (cifrado americano) que cubre las
// cuerdas que se tocan. Detrás vienen los golpes del rasgueo, más transparentes y con su flecha,
// en el tiempo en que se tocan: son una guía, lo que se evalúa es el acorde.
//
// Dos vistas (ver VistaLeccionContext):
// - normal (la sección Canciones): título, botones Empezar / Parar y textos de estado.
// - inmersiva (las clases): sin botones. El riff arranca solo, el mástil ocupa casi toda la pantalla,
//   el resultado sale en un cartel sobre el mástil y el menú de pausa lo abre LeccionScreen.
//   Al pausar el riff se frena donde estaba y, al reanudar, sigue desde ahí (un instante antes, para ver venir las notas).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Button } from '../Button';
import { Icono } from '../icono/Icono';
import { PracticaConDeteccion } from './PracticaConDeteccion';
import { RiffMastil } from './RiffMastil';
import { SwitchVelocidad } from './SwitchVelocidad';
import { AvisoRiff, CartelRiff } from './CartelRiff';
import { useRiff } from '../../hooks/useRiff';
import { estilosZurdo, useZurdo } from '../../hooks/useZurdo';
import { VISTA_NORMAL, VistaLeccionContext, useVistaLeccion } from '../../context/VistaLeccionContext';
import { nombreDeMidi } from '../../utils/deteccionSonido';
import { APROBAR, secuenciaDePractica } from '../../utils/riff';
import { ALTO_MASTIL_BASE, medidasDelMastil } from '../../utils/medidasRiff';

const PROPORCION_ALTO_INMERSIVO = 0.58; // Del alto de la pantalla
const ALTO_INMERSIVO_MAXIMO = 320;
const SEGUNDOS_PARA_SALTEAR = 20;
const MS_FESTEJO_PRACTICA = 1200; // Lo que se ve el "¡Bien!" de la práctica antes de volver a tocar
// En una lección, al lograrlo se termina sola (un instante después, para que se vea el acierto)
const MS_AUTO_TERMINAR = 1200;
const MS_SUGERENCIA_INICIO = 4000; // Lo que se ve la sugerencia de velocidad lenta al empezar
const MS_RECORDATORIO = 4500; // Y el recordatorio después de errar muchas seguidas

const MENSAJE_MICROFONO = {
  'sin-permiso': 'Necesitamos el micrófono para escuchar tus notas. Activalo en los ajustes del celular.',
  'no-disponible': 'En este dispositivo no podemos usar el micrófono.',
  error: 'No pudimos abrir el micrófono. Probá salir y volver a entrar.',
};

// La práctica de un acorde (o nota) donde se trabó: cuerda por cuerda y después entero.
// Al hacerla bien vuelve sola a la canción; también se puede volver sin terminarla.
function ModalPractica({ nota, onVolver }) {
  const secuencia = useMemo(() => secuenciaDePractica(nota), [nota]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!listo) return undefined;
    const espera = setTimeout(onVolver, MS_FESTEJO_PRACTICA);
    return () => clearTimeout(espera);
  }, [listo]);

  const esAcorde = nota.tipo === 'acorde';
  const nombre = esAcorde ? nota.nombre : secuencia[0].nombre;
  return (
    // La práctica aparte tiene sus propios botones, aunque la clase sea inmersiva
    <VistaLeccionContext.Provider value={VISTA_NORMAL}>
      <View style={styles.tarjetaPractica}>
        <Text style={styles.tituloPractica}>Practiquemos {esAcorde ? `el acorde ${nombre}` : `la nota ${nombre}`}</Text>
        <Text style={styles.ayudaPractica}>
          {listo
            ? '¡Bien! Volvemos a la canción…'
            : esAcorde
              ? 'Te trabaste acá. Tocá cada cuerda por separado y después el acorde completo.'
              : 'Te trabaste acá. Tocá esta nota y seguimos.'}
        </Text>
        <PracticaConDeteccion
          secuencia={secuencia}
          permitirSaltear={false}
          textoAtras="Volver a la canción"
          onBack={onVolver}
          textoFinal="Seguir tocando"
          onFinish={onVolver}
          onCompletar={() => setListo(true)}
        />
      </View>
    </VistaLeccionContext.Provider>
  );
}

// Arriba del mástil en la vista inmersiva: el tempo, la velocidad y cuánto se lleva acertado
function BarraDeAciertos({ aciertos, total }) {
  const avance = total > 0 ? Math.min(1, aciertos / total) : 0;
  return (
    <View style={styles.aciertos} accessibilityLabel={`${aciertos} de ${total} acertados`}>
      <View style={styles.aciertosBarra}>
        <View style={[styles.aciertosRelleno, { width: `${Math.round(avance * 100)}%` }]} />
      </View>
      <Text style={styles.aciertosTexto}>{aciertos}/{total}</Text>
    </View>
  );
}

// Fuera de una lección (en Canciones) no hay XP: se cambia el texto final y no se ofrece saltear.
// Con `velocidades` (y `velocidad` + `onCambiarVelocidad`) hay un interruptor de velocidad siempre a la vista
// (lenta / original). Se sugiere la lenta antes de empezar y se vuelve a sugerir si se erra muchas veces seguidas.
export function RiffStep({
  riff, onBack, onFinish, finishing, textoFinal = 'Terminar Lección', permitirSaltear = true, autoTerminar = false,
  velocidad, velocidades, onCambiarVelocidad,
  // Si se indica, solo cuenta como aprobado a esa velocidad: en otras es práctica y se ofrece pasar a esa
  velocidadParaAprobar,
}) {
  const { inmersivo, pausado } = useVistaLeccion();
  const { height } = useWindowDimensions();
  const alto = inmersivo ? Math.min(ALTO_INMERSIVO_MAXIMO, Math.max(ALTO_MASTIL_BASE, Math.round(height * PROPORCION_ALTO_INMERSIVO))) : ALTO_MASTIL_BASE;
  const medidas = useMemo(() => medidasDelMastil(alto), [alto]);
  const [puedeSaltear, setPuedeSaltear] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const [alPrincipio, setAlPrincipio] = useState(true);
  const { fase, estado, empezar, detener, pausar, reanudar, recorrido, tramo, resultados, resumen, retrocesos, practica, volverDePracticar } = useRiff(riff);
  const pxPorMs = medidas.pxPorPulso / riff.msPulso;
  const espejo = useZurdo() ? estilosZurdo.espejo : null;

  useEffect(() => {
    const espera = setTimeout(() => setPuedeSaltear(true), SEGUNDOS_PARA_SALTEAR * 1000);
    return () => clearTimeout(espera);
  }, []);

  const sinMicrofono = !!MENSAJE_MICROFONO[estado];
  const enMarcha = fase === 'preparando' || fase === 'tocando' || fase === 'retrocediendo' || fase === 'practicando';
  const superado = fase === 'terminado' && resumen.aprobado;
  // Practicando más lento no se aprueba la clase: se pasa a la velocidad que sí la aprueba
  const soloPractica = superado && velocidadParaAprobar !== undefined && velocidad !== velocidadParaAprobar;
  const aprobado = superado && !soloPractica;

  // Vista inmersiva: arranca sola al entrar, se frena al pausar y sigue desde ahí al reanudar
  const yaArranco = useRef(false);
  const frenadoPorPausa = useRef(false);
  useEffect(() => {
    if (!inmersivo) return;
    if (pausado) {
      if (fase === 'tocando' || fase === 'preparando') {
        pausar();
      } else if (enMarcha && fase !== 'practicando') {
        frenadoPorPausa.current = true;
        detener();
      }
      return;
    }
    if (fase === 'pausado') {
      reanudar();
      return;
    }
    if (fase === 'listo' && (!yaArranco.current || frenadoPorPausa.current)) {
      yaArranco.current = true;
      frenadoPorPausa.current = false;
      empezar();
    }
  }, [inmersivo, pausado, fase]);

  useEffect(() => {
    if (!autoTerminar || !aprobado) return undefined;
    const espera = setTimeout(() => onFinish(), MS_AUTO_TERMINAR);
    return () => clearTimeout(espera);
  }, [autoTerminar, aprobado]);

  // Con la velocidad original y una lenta disponible, se sugiere la lenta: antes de empezar y al errar muchas seguidas
  const sugerirLenta = !!velocidades && velocidad === 1;
  useEffect(() => {
    const espera = setTimeout(() => setAlPrincipio(false), MS_SUGERENCIA_INICIO);
    return () => clearTimeout(espera);
  }, []);
  useEffect(() => {
    if (!sugerirLenta || (fase !== 'retrocediendo' && fase !== 'practicando')) return undefined;
    setRecordar(true);
    const espera = setTimeout(() => setRecordar(false), MS_RECORDATORIO);
    return () => clearTimeout(espera);
  }, [fase, sugerirLenta]);
  const textoLenta = velocidades?.[0]?.titulo;
  const sugerencia = !sugerirLenta ? null
    : recordar ? `¿Te cuesta? Probá en ${textoLenta}`
    : alPrincipio ? `Si te cuesta, probalo en ${textoLenta}`
    : null;

  const indiceProxima = resultados.findIndex((r) => r === null);
  const proxima = recorrido.notas[indiceProxima] ?? null;
  const esCancion = riff.notas[0]?.tipo === 'acorde';
  // Cuerdas que se resaltan a la izquierda: las de la próxima nota o acorde
  const cuerdasProximas = fase === 'tocando' && proxima
    ? (proxima.tipo === 'acorde' ? proxima.posiciones.map((pos) => pos.cuerda) : [proxima.cuerda])
    : [];
  const vueltas = recorrido.notas.length / riff.notas.length;
  const elementos = esCancion ? 'acordes' : 'notas';
  const necesarios = Math.ceil(resumen.total * APROBAR);

  const mastil = (
    <RiffMastil
      medidas={medidas}
      recorrido={recorrido}
      resultados={resultados}
      indiceProxima={fase === 'tocando' ? indiceProxima : -1}
      tramo={tramo}
      pxPorMs={pxPorMs}
      espejo={espejo}
      cuerdasResaltadas={cuerdasProximas}
    />
  );
  const guia = riff.capo || riff.rasgueo ? (
    <Text style={styles.guia} numberOfLines={2}>
      {[riff.capo ? `Capo en el traste ${riff.capo}` : null, riff.rasgueo ? `Rasgueo: ${riff.rasgueo}` : null].filter(Boolean).join('   •   ')}
    </Text>
  ) : null;
  const modalPractica = (
    <Modal
      visible={!!practica}
      transparent
      animationType="fade"
      onRequestClose={volverDePracticar}
      supportedOrientations={['landscape', 'landscape-left', 'landscape-right', 'portrait']}
    >
      <View style={styles.fondoPractica}>
        {practica ? <ModalPractica nota={practica.nota} onVolver={volverDePracticar} /> : null}
      </View>
    </Modal>
  );

  if (inmersivo) {
    let superposicion = null;
    if (sinMicrofono) {
      superposicion = (
        <CartelRiff texto={MENSAJE_MICROFONO[estado]} tono="error">
          {permitirSaltear ? <Button title="Saltear (sin XP)" variant="secondary" onPress={() => onFinish({ omitida: true })} loading={finishing} /> : null}
        </CartelRiff>
      );
    } else if (fase === 'retrocediendo') {
      superposicion = <AvisoRiff texto="↩ Volvamos a donde empezaste a errar" tono="aviso" />;
    } else if (fase === 'preparando') {
      superposicion = <AvisoRiff texto="Abriendo el micrófono…" />;
    } else if (fase === 'terminado' && soloPractica) {
      superposicion = (
        <CartelRiff titulo="¡Muy bien!" texto={`Acertaste ${resumen.aciertos} de ${resumen.total}. Para aprobar la clase tocalo a velocidad normal.`} tono="bien">
          <Button title="Ahora a velocidad normal →" onPress={() => onCambiarVelocidad(velocidadParaAprobar)} style={styles.btnCartel} />
        </CartelRiff>
      );
    } else if (fase === 'terminado' && aprobado) {
      superposicion = (
        <CartelRiff titulo="¡Muy bien!" texto={`Acertaste ${resumen.aciertos} de ${resumen.total}`} tono="bien">
          {autoTerminar ? null : <Button title={textoFinal} onPress={() => onFinish()} loading={finishing} style={styles.btnCartel} />}
        </CartelRiff>
      );
    } else if (fase === 'terminado') {
      superposicion = (
        <CartelRiff titulo="¡Casi!" texto={`Acertaste ${resumen.aciertos} de ${resumen.total}. Necesitás ${necesarios} para superarlo.`}>
          <Button title="Reintentar" onPress={empezar} style={styles.btnCartel} />
        </CartelRiff>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.hud}>
            <View style={styles.chip}>
              <Icono nombre="notas" tamano={16} />
              <Text style={styles.chipTexto}>{riff.bpm} BPM</Text>
            </View>
            {velocidades && onCambiarVelocidad ? <SwitchVelocidad opciones={velocidades} valor={velocidad} onCambiar={onCambiarVelocidad} /> : null}
            {fase === 'tocando' || fase === 'pausado' || fase === 'retrocediendo' || fase === 'terminado' ? <BarraDeAciertos aciertos={resumen.aciertos} total={resumen.total} /> : null}
          </View>
          <View style={styles.zonaMastil}>
            {mastil}
            <View style={styles.superposicion} pointerEvents="box-none">{superposicion}</View>
          </View>
          {velocidades ? <View style={styles.zonaSugerencia}>{sugerencia ? <AvisoRiff texto={`💡 ${sugerencia}`} /> : null}</View> : null}
          {guia}
        </View>
        {modalPractica}
      </View>
    );
  }

  let estadoTexto;
  if (sinMicrofono) estadoTexto = MENSAJE_MICROFONO[estado];
  else if (fase === 'listo') {
    estadoTexto = esCancion
      ? `Tocá "Empezar". Los acordes avanzan hacia la ${espejo ? 'derecha' : 'izquierda'}: armá cada uno y rasgueá cuando llegue a la línea amarilla. La progresión se repite ${vueltas} veces.`
      : `Tocá "Empezar". Las notas avanzan hacia la ${espejo ? 'derecha' : 'izquierda'}: tocá cada una cuando llegue a la línea amarilla. El riff se toca ${vueltas} veces.`;
    if (sugerirLenta) estadoTexto += ` Si te cuesta, probalo en ${textoLenta}.`;
  } else if (fase === 'preparando') estadoTexto = 'Abriendo el micrófono…';
  else if (fase === 'retrocediendo') estadoTexto = `↩ Volvamos a donde empezaste a errar${sugerirLenta ? `. ¿Te cuesta? Probá en ${textoLenta}` : ''}`;
  else if (fase === 'practicando') estadoTexto = esCancion ? 'Practiquemos ese acorde un momento' : 'Practiquemos esa nota un momento';
  else if (fase === 'tocando') {
    if (!proxima) estadoTexto = `${resumen.aciertos} ${elementos} acertados`;
    else if (proxima.tipo === 'acorde') estadoTexto = `Próximo acorde: ${proxima.nombre}  •  ${resumen.aciertos} acertados`;
    else estadoTexto = `Próxima: cuerda ${proxima.cuerda}, ${proxima.traste === 0 ? 'al aire' : `traste ${proxima.traste}`} (${nombreDeMidi(proxima.midi)})  •  ${resumen.aciertos} acertadas`;
  } else if (fase === 'terminado') {
    estadoTexto = soloPractica
      ? `¡Muy bien! Acertaste ${resumen.aciertos} de ${resumen.total} ${elementos}. Para aprobar la clase tocalo a velocidad normal.`
      : resumen.aprobado
      ? `¡Muy bien! Acertaste ${resumen.aciertos} de ${resumen.total} ${elementos}.`
      : `Acertaste ${resumen.aciertos} de ${resumen.total} ${elementos}. Para superarlo necesitás ${necesarios}: ¡probá de nuevo!`;
    if (retrocesos > 0) estadoTexto += `  (Volviste atrás ${retrocesos} ${retrocesos === 1 ? 'vez' : 'veces'}.)`;
  }

  const principal = (() => {
    if (enMarcha) return <Button title="Parar" variant="secondary" onPress={detener} style={styles.btnHalf} />;
    if (soloPractica) return <Button title="Ahora a velocidad normal →" onPress={() => onCambiarVelocidad(velocidadParaAprobar)} style={[styles.btnHalf, styles.btnTerminar]} />;
    if (aprobado) return <Button title={textoFinal} onPress={() => onFinish()} loading={finishing} style={[styles.btnHalf, styles.btnTerminar]} />;
    return <Button title={fase === 'terminado' ? 'Reintentar' : 'Empezar'} onPress={empezar} style={[styles.btnHalf, styles.btnTerminar]} />;
  })();
  const secundario = permitirSaltear && !aprobado && (puedeSaltear || sinMicrofono)
    ? <Button title="Saltear (sin XP)" variant="secondary" onPress={() => onFinish({ omitida: true })} loading={finishing} style={styles.btnHalf} />
    : onBack ? <Button title="Atrás" icono="volver" variant="secondary" onPress={onBack} style={styles.btnHalf} /> : null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.encabezado}>
          <Text style={styles.titulo} numberOfLines={1}>{riff.nombre}  •  {riff.bpm} BPM</Text>
          {velocidades && onCambiarVelocidad ? (
            <SwitchVelocidad opciones={velocidades} valor={velocidad} onCambiar={onCambiarVelocidad} />
          ) : null}
        </View>

        {mastil}

        <Text style={[styles.estado, sinMicrofono && styles.estadoError, fase === 'retrocediendo' && styles.estadoRetroceso]}>{estadoTexto}</Text>
        {guia}
      </View>

      <View style={styles.btnRow}>
        {secundario}
        {principal}
      </View>

      {modalPractica}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', gap: 8 },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 12 },
  titulo: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  hud: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 10, minHeight: 28 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.35)' },
  chipTexto: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  aciertos: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aciertosBarra: { width: 150, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  aciertosRelleno: { height: '100%', borderRadius: 4, backgroundColor: '#2fbf5b' },
  aciertosTexto: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  zonaSugerencia: { minHeight: 34, justifyContent: 'center' },
  zonaMastil: { width: '100%', justifyContent: 'center' },
  superposicion: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' },
  btnCartel: { backgroundColor: '#4c52d9', minWidth: 220 },
  guia: { color: 'rgba(255,255,255,0.85)', fontSize: 13, textAlign: 'center', paddingHorizontal: 12 },
  estado: { color: 'rgba(255,255,255,0.9)', fontSize: 14, textAlign: 'center', paddingHorizontal: 12 },
  estadoError: { color: '#ff9aa5' },
  estadoRetroceso: { color: '#ffd35c', fontWeight: 'bold' },
  fondoPractica: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  tarjetaPractica: { width: '100%', maxWidth: 760, height: '100%', maxHeight: 420, padding: 14, borderRadius: 18, backgroundColor: '#2b2660', gap: 6 },
  tituloPractica: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  ayudaPractica: { color: 'rgba(255,255,255,0.85)', fontSize: 13, textAlign: 'center' },
  btnRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 15, paddingTop: 4 },
  btnHalf: { flex: 1 },
  btnTerminar: { backgroundColor: '#4c52d9' },
});
