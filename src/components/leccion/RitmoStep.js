// Archivo: src/components/leccion/RitmoStep.js
// Ejercicio de tempo: cuenta, metrónomo (con sonido en Android, visual en iOS) y el resultado.
// Un medidor muestra el volumen del micrófono y un aviso destella con cada golpe que escucha,
// así se ve enseguida si la app está tomando los golpes.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../Button';
import { Rasgueo } from '../canciones/Rasgueo';
import { useRitmo, CLIC_DISPONIBLE } from '../../hooks/useRitmo';
import { cuentaDelCompas, tramosDeLuces, OPACIDAD_LUZ_APAGADA } from '../../utils/ritmo';

const SEGUNDOS_PARA_SALTEAR = 20;
const MS_DESTELLO = 250;

const MENSAJE_MICROFONO = {
  'sin-permiso': 'Necesitamos el micrófono para escuchar tus golpes. Activalo en los ajustes del celular.',
  'no-disponible': 'En este dispositivo no podemos usar el micrófono.',
  error: 'No pudimos abrir el micrófono. Probá salir y volver a entrar.',
};

const TENDENCIA = {
  apura: 'Tendés a apurarte: esperá el pulso, no lo persigas.',
  atrasa: 'Tendés a atrasarte: anticipá apenas cada golpe.',
  parejo: 'Mantuviste el tempo parejo.',
};

// El patrón como un rasgueo: abajo en los números y arriba en las "y"
function rasgueoDelPatron({ nombre, compas, subdivision, patron }) {
  return {
    nombre,
    cuenta: cuentaDelCompas(compas, subdivision),
    golpes: patron.map((tocar, i) => (tocar ? (i % subdivision === 0 ? '↓' : '↑') : '')),
  };
}

// Una luz por pulso del compás (la del 1, amarilla). Quietas: todas apagadas.
function estiloLuz(i, grande) {
  const tamano = grande ? 40 : 28;
  return [styles.luz, { width: tamano, height: tamano, borderRadius: tamano / 2 }, i === 0 ? styles.luzFuerte : styles.luzActiva];
}

function LucesQuietas({ compas, grande }) {
  return (
    <View style={styles.luces} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: compas }, (_, i) => <View key={i} style={[estiloLuz(i, grande), { opacity: OPACIDAD_LUZ_APAGADA }]} />)}
    </View>
  );
}

// Las luces mientras se toca. Se animan con un loop nativo programado desde el inicio, así se prenden
// en el momento justo aunque JavaScript esté ocupado procesando el micrófono (con un reloj de
// JavaScript se prendían tarde y desparejas, y el alumno seguía un pulso que no era el evaluado).
function LucesPrecisas({ linea, compas, inicio, grande }) {
  const tramos = useMemo(() => tramosDeLuces(linea, compas), [linea, compas]);
  const progreso = useRef(new Animated.Value(1)).current;
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    let animacion = null;
    const esperas = tramos.map((tramo, i) =>
      setTimeout(() => {
        if (animacion) animacion.stop();
        progreso.setValue(0);
        setIndice(i);
        animacion = Animated.loop(
          Animated.timing(progreso, { toValue: 1, duration: tramo.msCiclo, easing: Easing.linear, useNativeDriver: true, isInteraction: false }),
          { iterations: tramo.ciclos },
        );
        animacion.start();
      }, Math.max(0, inicio + tramo.inicio - Date.now())),
    );
    return () => {
      esperas.forEach(clearTimeout);
      if (animacion) animacion.stop();
    };
  }, [tramos, inicio]);

  const opacidades = useMemo(() => tramos[indice].luces.map((curva) => progreso.interpolate(curva)), [tramos, indice]);
  return (
    <View style={styles.luces} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {opacidades.map((opacity, i) => <Animated.View key={i} style={[estiloLuz(i, grande), { opacity }]} />)}
    </View>
  );
}

// Volumen del micrófono y un destello con cada golpe detectado
function Escucha({ nivel, golpesDetectados }) {
  const [destello, setDestello] = useState(false);
  const anterior = useRef(golpesDetectados);
  useEffect(() => {
    if (golpesDetectados <= anterior.current) {
      anterior.current = golpesDetectados;
      return undefined;
    }
    anterior.current = golpesDetectados;
    setDestello(true);
    const espera = setTimeout(() => setDestello(false), MS_DESTELLO);
    return () => clearTimeout(espera);
  }, [golpesDetectados]);

  // Escala logarítmica: un golpe suave también se ve en el medidor
  const ancho = nivel > 0 ? Math.min(100, Math.max(0, (Math.log10(nivel) + 3) * 40)) : 0;
  return (
    <View style={styles.escucha}>
      <Text style={styles.escuchaTexto}>🎤</Text>
      <View style={styles.medidor}><View style={[styles.medidorNivel, { width: `${ancho}%` }]} /></View>
      <Text style={[styles.escuchado, destello && styles.escuchadoActivo]}>{destello ? '¡Te escuché!' : `${golpesDetectados} golpes`}</Text>
    </View>
  );
}

// Un punto por golpe: verde a tiempo, amarillo tocado fuera de tiempo, gris no se escuchó
const MAX_PUNTOS = 40;
function Golpes({ golpes }) {
  if (golpes.length > MAX_PUNTOS) return null;
  return (
    <View
      style={styles.puntosGolpes}
      accessibilityLabel={`${golpes.filter((g) => g.aTiempo).length} a tiempo, ${golpes.filter((g) => !g.aTiempo && g.desfase !== null).length} fuera de tiempo, ${golpes.filter((g) => g.desfase === null).length} sin escuchar`}
    >
      {golpes.map((g, i) => (
        <View key={i} style={[styles.puntoGolpe, g.aTiempo ? styles.puntoATiempo : g.desfase !== null ? styles.puntoFuera : styles.puntoPerdido]} />
      ))}
    </View>
  );
}

function Resultado({ resultado, aprobar, golpesDetectados }) {
  const necesarios = Math.ceil(resultado.total * aprobar);
  // Si casi no escuchó nada, el problema es el sonido y no el tempo
  const pocoSonido = golpesDetectados < resultado.total / 3;
  return (
    <View style={styles.resultado}>
      <Golpes golpes={resultado.golpes} />
      <Text style={[styles.resultadoTitulo, resultado.aprobado ? styles.ok : styles.casi]}>
        {resultado.aprobado ? '¡Aprobado!' : 'Casi'}  {resultado.aciertos} de {resultado.total} golpes a tiempo
      </Text>
      {pocoSonido ? (
        <Text style={styles.resultadoTexto}>Casi no te escuchamos ({golpesDetectados} golpes). Aplaudí más fuerte o acercá el celular.</Text>
      ) : (
        <>
          {!resultado.aprobado ? <Text style={styles.resultadoTexto}>Necesitás {necesarios} para aprobar. ¡Probá de nuevo!</Text> : null}
          <Text style={styles.resultadoTexto}>{TENDENCIA[resultado.tendencia]}</Text>
          {resultado.desviacionMs !== null ? (
            <Text style={styles.resultadoTexto}>En promedio, tus golpes se separaron ±{resultado.desviacionMs} ms del pulso.</Text>
          ) : null}
          {resultado.deMas > 0 ? <Text style={styles.resultadoTexto}>Hubo {resultado.deMas} golpe{resultado.deMas > 1 ? 's' : ''} de más.</Text> : null}
        </>
      )}
    </View>
  );
}

export function RitmoStep({ ritmo, onBack, onFinish, finishing }) {
  const [quiereSonido, setQuiereSonido] = useState(true);
  const [puedeSaltear, setPuedeSaltear] = useState(false);
  const {
    fase, estado, empezar, detener, linea, clicActual, parteActual, parcial, resultado, nivel, golpesDetectados, conSonido, inicio,
  } = useRitmo(ritmo, { conSonido: quiereSonido });

  useEffect(() => {
    const espera = setTimeout(() => setPuedeSaltear(true), SEGUNDOS_PARA_SALTEAR * 1000);
    return () => clearTimeout(espera);
  }, []);

  const conPatron = ritmo.subdivision > 1 || ritmo.patron.includes(0);
  const rasgueo = useMemo(() => rasgueoDelPatron(ritmo), [ritmo]);
  const clic = clicActual !== null ? linea.clics[clicActual] : null;
  const parte = parteActual !== null ? linea.partes[parteActual].parte : null;
  const enCuenta = fase === 'tocando' && (!clic || clic.cuenta);
  const escuchando = fase === 'preparando' || fase === 'tocando';
  const sinMicrofono = !!MENSAJE_MICROFONO[estado];
  const aprobado = fase === 'terminado' && resultado?.aprobado;

  const bpms = ritmo.etapas.map((e) => e.bpm);
  const tempo = bpms.every((b) => b === bpms[0]) ? `${bpms[0]} BPM` : bpms.join(' → ') + ' BPM';
  const marca = conSonido ? 'clic' : 'luz';

  let estadoTexto;
  if (sinMicrofono) estadoTexto = MENSAJE_MICROFONO[estado];
  else if (fase === 'listo') {
    estadoTexto = conPatron
      ? `Tocá "Empezar". Después de ${ritmo.compas} ${marca}s de cuenta, aplaudí en cada parte del patrón que tiene flecha.`
      : `Tocá "Empezar". Después de ${ritmo.compas} ${marca}s de cuenta, aplaudí con cada ${marca}.`;
  } else if (fase === 'preparando') estadoTexto = 'Abriendo el micrófono…';
  else if (enCuenta) estadoTexto = 'Cuenta: escuchá el pulso, todavía no toques';
  else if (fase === 'tocando') {
    const silencio = clic && !clic.audible ? '  •  🤫 Seguí sin el clic' : '';
    estadoTexto = `¡Tocá! ${clic?.bpm} BPM${parcial ? `  •  ${parcial.aciertos} de ${parcial.evaluados} a tiempo` : ''}${silencio}`;
  }

  const principal = (() => {
    if (escuchando) return <Button title="Parar" variant="secondary" onPress={detener} style={styles.btnHalf} />;
    if (aprobado) return <Button title="Terminar Lección" onPress={() => onFinish()} loading={finishing} style={[styles.btnHalf, styles.btnTerminar]} />;
    return <Button title={fase === 'terminado' ? 'Reintentar' : 'Empezar'} onPress={empezar} style={[styles.btnHalf, styles.btnTerminar]} />;
  })();
  const secundario = !aprobado && (puedeSaltear || sinMicrofono)
    ? <Button title="Saltear (sin XP)" variant="secondary" onPress={() => onFinish({ omitida: true })} loading={finishing} style={styles.btnHalf} />
    : onBack ? <Button title="Atrás" icono="volver" variant="secondary" onPress={onBack} style={styles.btnHalf} /> : null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.encabezado}>
          <Text style={styles.titulo} numberOfLines={1}>{ritmo.nombre}  •  {tempo}{ritmo.compas !== 4 ? `  •  ${ritmo.compas}/${ritmo.compas === 6 ? 8 : 4}` : ''}</Text>
          {CLIC_DISPONIBLE ? (
            <TouchableOpacity
              onPress={() => setQuiereSonido((s) => !s)}
              disabled={escuchando}
              style={styles.sonido}
              accessibilityRole="switch"
              accessibilityState={{ checked: quiereSonido, disabled: escuchando }}
              accessibilityLabel="Sonido del metrónomo"
            >
              <Text style={styles.sonidoTexto}>{quiereSonido ? '🔊 Clic' : '🔇 Solo luces'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {fase === 'tocando' && inicio ? (
          <LucesPrecisas linea={linea} compas={ritmo.compas} inicio={inicio} grande={!conSonido} />
        ) : (
          <LucesQuietas compas={ritmo.compas} grande={!conSonido} />
        )}
        {conPatron ? <View style={styles.patron}><Rasgueo rasgueo={rasgueo} parteActual={fase === 'tocando' && !enCuenta ? parte : null} /></View> : null}
        {ritmo.clicQueDesaparece ? (
          <Text style={styles.aviso}>{conSonido ? 'El clic se calla' : 'La luz se apaga'} un compás de cada dos: seguí tocando a tiempo.</Text>
        ) : null}

        {fase === 'terminado' && resultado ? (
          <Resultado resultado={resultado} aprobar={ritmo.aprobar} golpesDetectados={golpesDetectados} />
        ) : (
          <Text style={[styles.estado, sinMicrofono && styles.estadoError]}>{estadoTexto}</Text>
        )}
        {escuchando && !sinMicrofono ? <Escucha nivel={nivel} golpesDetectados={golpesDetectados} /> : null}
        {fase === 'listo' ? (
          <Text style={styles.aviso}>
            👏 Aplaudí: la app escucha los aplausos mucho mejor que la guitarra.
            {!CLIC_DISPONIBLE ? ' En iPhone el metrónomo es visual: seguí las luces (el 1 se prende en amarillo).' : ''}
          </Text>
        ) : null}
      </View>

      <View style={styles.btnRow}>
        {secundario}
        {principal}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', gap: 8 },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'center' },
  titulo: { color: '#fff', fontSize: 15, fontWeight: 'bold', flexShrink: 1 },
  sonido: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.3)' },
  sonidoTexto: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  luces: { flexDirection: 'row', gap: 12, height: 48, alignItems: 'center' },
  luz: {},
  luzActiva: { backgroundColor: '#fff' },
  luzFuerte: { backgroundColor: '#ffd35c' },
  patron: { width: '100%', maxWidth: 420, alignItems: 'center' },
  aviso: { color: 'rgba(255,255,255,0.8)', fontSize: 12, textAlign: 'center' },
  estado: { color: 'rgba(255,255,255,0.9)', fontSize: 14, textAlign: 'center', paddingHorizontal: 12 },
  estadoError: { color: '#ff9aa5' },
  escucha: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', maxWidth: 320 },
  escuchaTexto: { fontSize: 14 },
  medidor: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  medidorNivel: { height: '100%', backgroundColor: '#4be07a' },
  escuchado: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 'bold', minWidth: 90, textAlign: 'right' },
  escuchadoActivo: { color: '#4be07a' },
  resultado: { alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16 },
  resultadoTitulo: { fontSize: 16, fontWeight: 'bold' },
  ok: { color: '#4be07a' },
  casi: { color: '#ffd35c' },
  resultadoTexto: { color: '#fff', fontSize: 13, textAlign: 'center' },
  puntosGolpes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginBottom: 4, maxWidth: 360 },
  puntoGolpe: { width: 10, height: 10, borderRadius: 5 },
  puntoATiempo: { backgroundColor: '#4be07a' },
  puntoFuera: { backgroundColor: '#ffd35c' },
  puntoPerdido: { backgroundColor: 'rgba(255,255,255,0.25)' },
  btnRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 15, paddingTop: 4 },
  btnHalf: { flex: 1 },
  btnTerminar: { backgroundColor: '#4c52d9' },
});
