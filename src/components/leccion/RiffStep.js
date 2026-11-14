// Archivo: src/components/leccion/RiffStep.js
// El riff en movimiento: las notas avanzan de derecha a izquierda sobre las cuerdas, en cuadrados
// con el número de traste, y hay que tocar cada una cuando pasa por la línea amarilla.
// Si se erra mucho, el mástil se frena y vuelve a donde se empezó a errar.
// En las canciones avanzan acordes: un rectángulo con el nombre (cifrado americano) que cubre las
// cuerdas que se tocan.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Button } from '../Button';
import { useRiff } from '../../hooks/useRiff';
import { nombreDeMidi } from '../../utils/deteccionSonido';
import { APROBAR } from '../../utils/riff';

const CUERDAS = [6, 5, 4, 3, 2, 1]; // De arriba hacia abajo, como el mástil del resto de la app
const GROSOR = { 1: 1.5, 2: 1.8, 3: 2.2, 4: 2.6, 5: 3.1, 6: 3.6 };
const ALTO = 186;
const ANCHO_ETIQUETA = 22;
const X_LINEA = 56; // Dónde está la línea para tocar, desde el borde izquierdo del mástil
const TAMANO_NOTA = 26;
const ANCHO_ACORDE = 48;
const PX_POR_PULSO = 110;
const SEGUNDOS_PARA_SALTEAR = 20;

const MENSAJE_MICROFONO = {
  'sin-permiso': 'Necesitamos el micrófono para escuchar tus notas. Activalo en los ajustes del celular.',
  'no-disponible': 'En este dispositivo no podemos usar el micrófono.',
  error: 'No pudimos abrir el micrófono. Probá salir y volver a entrar.',
};

const altoCuerda = ALTO / CUERDAS.length;
const centroCuerda = (cuerda) => altoCuerda * (CUERDAS.indexOf(cuerda) + 0.5);

function Nota({ nota, resultado, pxPorMs }) {
  if (nota.tipo === 'acorde') {
    const arriba = centroCuerda(nota.cuerdaGrave) - TAMANO_NOTA / 2;
    const abajo = centroCuerda(nota.cuerdaAguda) + TAMANO_NOTA / 2;
    return (
      <View
        style={[
          styles.nota,
          styles.acorde,
          resultado === true && styles.notaBien,
          resultado === false && styles.notaMal,
          { left: X_LINEA + nota.t * pxPorMs - ANCHO_ACORDE / 2, top: arriba, height: abajo - arriba },
        ]}
      >
        <Text style={styles.acordeTexto} numberOfLines={1} adjustsFontSizeToFit>{nota.nombre}</Text>
      </View>
    );
  }
  return (
    <View
      style={[
        styles.nota,
        resultado === true && styles.notaBien,
        resultado === false && styles.notaMal,
        { left: X_LINEA + nota.t * pxPorMs - TAMANO_NOTA / 2, top: centroCuerda(nota.cuerda) - TAMANO_NOTA / 2 },
      ]}
    >
      <Text style={styles.notaTexto}>{nota.traste}</Text>
    </View>
  );
}

// Las notas, en una tira que se desplaza con una animación nativa (no depende del reloj de JavaScript)
function Tira({ recorrido, resultados, tramo, pxPorMs }) {
  const desplazamiento = useRef(new Animated.Value(0)).current;
  const fin = recorrido.duracion + 1500;

  useEffect(() => {
    if (!tramo) {
      desplazamiento.setValue(0);
      return undefined;
    }
    const desde = tramo.inicio === null ? tramo.desde : tramo.desde + (Date.now() - tramo.inicio);
    desplazamiento.setValue(-desde * pxPorMs);
    if (tramo.inicio === null) return undefined; // Quieta (volviendo atrás)
    const animacion = Animated.timing(desplazamiento, {
      toValue: -fin * pxPorMs,
      duration: Math.max(0, fin - desde),
      easing: Easing.linear,
      useNativeDriver: true,
      isInteraction: false,
    });
    animacion.start();
    return () => animacion.stop();
  }, [tramo, pxPorMs, fin]);

  return (
    <Animated.View style={[styles.tira, { transform: [{ translateX: desplazamiento }] }]} pointerEvents="none">
      {recorrido.notas.map((nota, i) => <Nota key={i} nota={nota} resultado={resultados[i]} pxPorMs={pxPorMs} />)}
    </Animated.View>
  );
}

// Fuera de una lección (en Canciones) no hay XP: se cambia el texto final y no se ofrece saltear
export function RiffStep({ riff, onBack, onFinish, finishing, textoFinal = 'Terminar Lección', permitirSaltear = true }) {
  const [puedeSaltear, setPuedeSaltear] = useState(false);
  const { fase, estado, empezar, detener, recorrido, tramo, resultados, resumen, retrocesos } = useRiff(riff);
  const pxPorMs = PX_POR_PULSO / riff.msPulso;

  useEffect(() => {
    const espera = setTimeout(() => setPuedeSaltear(true), SEGUNDOS_PARA_SALTEAR * 1000);
    return () => clearTimeout(espera);
  }, []);

  const sinMicrofono = !!MENSAJE_MICROFONO[estado];
  const enMarcha = fase === 'preparando' || fase === 'tocando' || fase === 'retrocediendo';
  const aprobado = fase === 'terminado' && resumen.aprobado;
  const proxima = useMemo(() => recorrido.notas[resultados.findIndex((r) => r === null)] ?? null, [recorrido, resultados]);
  const esCancion = riff.notas[0]?.tipo === 'acorde';
  // Cuerdas que se resaltan a la izquierda: las de la próxima nota o acorde
  const cuerdasProximas = proxima ? (proxima.tipo === 'acorde' ? proxima.posiciones.map((pos) => pos.cuerda) : [proxima.cuerda]) : [];
  const vueltas = recorrido.notas.length / riff.notas.length;
  const elementos = esCancion ? 'acordes' : 'notas';

  let estadoTexto;
  if (sinMicrofono) estadoTexto = MENSAJE_MICROFONO[estado];
  else if (fase === 'listo') {
    estadoTexto = esCancion
      ? `Tocá "Empezar". Los acordes avanzan hacia la izquierda: armá cada uno y rasgueá cuando llegue a la línea amarilla. La progresión se repite ${vueltas} veces.`
      : `Tocá "Empezar". Las notas avanzan hacia la izquierda: tocá cada una cuando llegue a la línea amarilla. El riff se toca ${vueltas} veces.`;
  } else if (fase === 'preparando') estadoTexto = 'Abriendo el micrófono…';
  else if (fase === 'retrocediendo') estadoTexto = '↩ Volvamos a donde empezaste a errar';
  else if (fase === 'tocando') {
    if (!proxima) estadoTexto = `${resumen.aciertos} ${elementos} acertados`;
    else if (proxima.tipo === 'acorde') estadoTexto = `Próximo acorde: ${proxima.nombre}  •  ${resumen.aciertos} acertados`;
    else estadoTexto = `Próxima: cuerda ${proxima.cuerda}, ${proxima.traste === 0 ? 'al aire' : `traste ${proxima.traste}`} (${nombreDeMidi(proxima.midi)})  •  ${resumen.aciertos} acertadas`;
  } else if (fase === 'terminado') {
    estadoTexto = resumen.aprobado
      ? `¡Muy bien! Acertaste ${resumen.aciertos} de ${resumen.total} ${elementos}.`
      : `Acertaste ${resumen.aciertos} de ${resumen.total} ${elementos}. Para superarlo necesitás ${Math.ceil(resumen.total * APROBAR)}: ¡probá de nuevo!`;
    if (retrocesos > 0) estadoTexto += `  (Volviste atrás ${retrocesos} ${retrocesos === 1 ? 'vez' : 'veces'}.)`;
  }

  const principal = (() => {
    if (enMarcha) return <Button title="Parar" variant="secondary" onPress={detener} style={styles.btnHalf} />;
    if (aprobado) return <Button title={textoFinal} onPress={() => onFinish()} loading={finishing} style={[styles.btnHalf, styles.btnTerminar]} />;
    return <Button title={fase === 'terminado' ? 'Reintentar' : 'Empezar'} onPress={empezar} style={[styles.btnHalf, styles.btnTerminar]} />;
  })();
  const secundario = permitirSaltear && !aprobado && (puedeSaltear || sinMicrofono)
    ? <Button title="Saltear (sin XP)" variant="secondary" onPress={() => onFinish({ omitida: true })} loading={finishing} style={styles.btnHalf} />
    : onBack ? <Button title="Atrás" icono="volver" variant="secondary" onPress={onBack} style={styles.btnHalf} /> : null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.titulo} numberOfLines={1}>{riff.nombre}  •  {riff.bpm} BPM</Text>

        <View style={styles.fila}>
          <View style={styles.etiquetas}>
            {CUERDAS.map((c) => (
              <View key={c} style={[styles.etiquetaFila, { height: altoCuerda }]}>
                <Text style={[styles.etiqueta, cuerdasProximas.includes(c) && fase === 'tocando' && styles.etiquetaActiva]}>{c}</Text>
              </View>
            ))}
          </View>
          <View style={styles.mastil}>
            {CUERDAS.map((c) => (
              <View key={c} style={[styles.cuerda, { top: centroCuerda(c) - GROSOR[c] / 2, height: GROSOR[c] }, c > 3 && styles.cuerdaEntorchada]} />
            ))}
            <View style={styles.linea} />
            <Tira recorrido={recorrido} resultados={resultados} tramo={tramo} pxPorMs={pxPorMs} />
          </View>
        </View>

        <Text style={[styles.estado, sinMicrofono && styles.estadoError, fase === 'retrocediendo' && styles.estadoRetroceso]}>{estadoTexto}</Text>
        {riff.capo || riff.rasgueo ? (
          <Text style={styles.guia} numberOfLines={2}>
            {[riff.capo ? `Capo en el traste ${riff.capo}` : null, riff.rasgueo ? `Rasgueo: ${riff.rasgueo}` : null].filter(Boolean).join('   •   ')}
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
  titulo: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  fila: { flexDirection: 'row', width: '100%', height: ALTO },
  etiquetas: { width: ANCHO_ETIQUETA },
  etiquetaFila: { justifyContent: 'center', alignItems: 'center' },
  etiqueta: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold', width: 20, height: 20, lineHeight: 20, textAlign: 'center', borderRadius: 10, overflow: 'hidden' },
  etiquetaActiva: { color: '#fff', backgroundColor: '#2fbf5b' },
  mastil: { flex: 1, overflow: 'hidden', borderRadius: 6, backgroundColor: '#3a2416', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(240,226,196,0.55)' },
  cuerda: { position: 'absolute', left: 0, right: 0, backgroundColor: '#d9dce0' },
  cuerdaEntorchada: { backgroundColor: '#c99b55' },
  linea: { position: 'absolute', top: 0, bottom: 0, left: X_LINEA - 2, width: 4, backgroundColor: '#ffd35c', opacity: 0.9 },
  tira: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 1 },
  nota: {
    position: 'absolute', width: TAMANO_NOTA, height: TAMANO_NOTA, borderRadius: 6, backgroundColor: '#4c52d9',
    borderWidth: 2, borderColor: '#e6e8ff', justifyContent: 'center', alignItems: 'center',
  },
  notaBien: { backgroundColor: '#2fbf5b', borderColor: '#eafff0' },
  notaMal: { backgroundColor: 'rgba(220,70,90,0.55)', borderColor: 'rgba(255,255,255,0.4)' },
  notaTexto: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  acorde: { width: ANCHO_ACORDE, borderRadius: 10, paddingHorizontal: 2 },
  acordeTexto: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  guia: { color: 'rgba(255,255,255,0.85)', fontSize: 13, textAlign: 'center', paddingHorizontal: 12 },
  estado: { color: 'rgba(255,255,255,0.9)', fontSize: 14, textAlign: 'center', paddingHorizontal: 12 },
  estadoError: { color: '#ff9aa5' },
  estadoRetroceso: { color: '#ffd35c', fontWeight: 'bold' },
  btnRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 15, paddingTop: 4 },
  btnHalf: { flex: 1 },
  btnTerminar: { backgroundColor: '#4c52d9' },
});
