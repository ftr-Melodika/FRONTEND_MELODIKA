// Archivo: src/components/leccion/RiffMastil.js
// El mástil del riff: cuerdas, línea amarilla para tocar y las notas que avanzan hacia ella.
// Cada nota es un cuadrado con el número de traste, sobre la cuerda en la que se toca; un acorde
// es un rectángulo con su nombre que cubre las cuerdas que se tocan, y detrás van los golpes del
// rasgueo (más transparentes, con su flecha). Todo crece con el alto del mástil (ver medidasRiff).
import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { CUERDAS_RIFF } from '../../utils/medidasRiff';

const GROSOR = { 1: 1.5, 2: 1.8, 3: 2.2, 4: 2.6, 5: 3.1, 6: 3.6 };
const RADIO_NOTA = 0.3; // Del tamaño de la nota: esquinas bien redondeadas
const AIRE_ENTRE_GOLPES = 4;
const MS_DE_COLA = 1500; // La tira sigue un poco después de la última nota

// El estado de una nota o acorde: todavía no pasó, acertada o errada
const estilosDeResultado = (resultado) => [resultado === true && styles.notaBien, resultado === false && styles.notaMal];

const Nota = memo(function Nota({ nota, resultado, esProxima, medidas, pxPorMs, espejo }) {
  const { tamanoNota, xLinea, anchoAcorde, anchoGolpe, centroCuerda } = medidas;
  const radio = Math.round(tamanoNota * RADIO_NOTA);

  if (nota.tipo === 'acorde') {
    const arriba = centroCuerda(nota.cuerdaGrave) - tamanoNota / 2;
    const abajo = centroCuerda(nota.cuerdaAguda) + tamanoNota / 2;
    const ancho = Math.min(anchoGolpe, (nota.msParte ?? Infinity) * pxPorMs - AIRE_ENTRE_GOLPES);
    const angosto = ancho < anchoGolpe;
    return (
      <>
        {nota.golpes?.map((g, i) => (
          <View
            key={i}
            style={[
              styles.nota,
              styles.golpe,
              ...estilosDeResultado(resultado),
              { width: ancho, left: xLinea + (nota.t + g.t) * pxPorMs - ancho / 2, top: arriba, height: abajo - arriba, borderRadius: radio },
            ]}
          >
            <Text style={[styles.golpeTexto, { fontSize: Math.round(tamanoNota * (angosto ? 0.55 : 0.7)) }, espejo]}>{g.golpe}</Text>
          </View>
        ))}
        {/* El acorde va al final para quedar encima si un golpe lo toca */}
        <View
          style={[
            styles.nota,
            esProxima && styles.notaProxima,
            ...estilosDeResultado(resultado),
            { width: anchoAcorde, left: xLinea + nota.t * pxPorMs - anchoAcorde / 2, top: arriba, height: abajo - arriba, borderRadius: radio },
          ]}
        >
          <View style={[styles.brillo, { borderRadius: radio - 2 }]} />
          <Text style={[styles.texto, { fontSize: Math.round(tamanoNota * 0.58) }, espejo]} numberOfLines={1} adjustsFontSizeToFit>{nota.nombre}</Text>
        </View>
      </>
    );
  }

  return (
    <View
      style={[
        styles.nota,
        esProxima && styles.notaProxima,
        ...estilosDeResultado(resultado),
        { width: tamanoNota, height: tamanoNota, borderRadius: radio, left: xLinea + nota.t * pxPorMs - tamanoNota / 2, top: centroCuerda(nota.cuerda) - tamanoNota / 2 },
      ]}
    >
      <View style={[styles.brillo, { borderRadius: radio - 2 }]} />
      <Text style={[styles.texto, { fontSize: Math.round(tamanoNota * 0.54) }, espejo]}>{nota.traste}</Text>
    </View>
  );
});

// Las notas, en una tira que se desplaza con una animación nativa (no depende del reloj de JavaScript)
function Tira({ recorrido, resultados, indiceProxima, tramo, medidas, pxPorMs, espejo }) {
  const desplazamiento = useRef(new Animated.Value(0)).current;
  const fin = recorrido.duracion + MS_DE_COLA;

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
      {recorrido.notas.map((nota, i) => (
        <Nota key={i} nota={nota} resultado={resultados[i]} esProxima={i === indiceProxima} medidas={medidas} pxPorMs={pxPorMs} espejo={espejo} />
      ))}
    </Animated.View>
  );
}

// `cuerdasResaltadas`: las cuerdas de la próxima nota, que se marcan a la izquierda.
// `indiceProxima`: la próxima nota por tocar (se destaca con un borde amarillo), o -1.
export function RiffMastil({ medidas, recorrido, resultados, indiceProxima, tramo, pxPorMs, espejo, cuerdasResaltadas }) {
  const { alto, altoCuerda, xLinea, centroCuerda, etiqueta, anchoEtiqueta } = medidas;
  return (
    <View style={[styles.fila, { height: alto }, espejo]}>
      <View style={{ width: anchoEtiqueta }}>
        {CUERDAS_RIFF.map((c) => (
          <View key={c} style={[styles.etiquetaFila, { height: altoCuerda }]}>
            <Text
              style={[
                styles.etiqueta,
                { width: etiqueta, height: etiqueta, lineHeight: etiqueta, borderRadius: etiqueta / 2, fontSize: Math.round(etiqueta * 0.6) },
                cuerdasResaltadas.includes(c) && styles.etiquetaActiva,
                espejo,
              ]}
            >
              {c}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.mastil}>
        {CUERDAS_RIFF.map((c) => (
          <View key={c} style={[styles.cuerda, { top: centroCuerda(c) - GROSOR[c] / 2, height: GROSOR[c] }, c > 3 && styles.cuerdaEntorchada]} />
        ))}
        <View style={[styles.linea, { left: xLinea - 2 }]} />
        <Tira recorrido={recorrido} resultados={resultados} indiceProxima={indiceProxima} tramo={tramo} medidas={medidas} pxPorMs={pxPorMs} espejo={espejo} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', width: '100%' },
  etiquetaFila: { justifyContent: 'center', alignItems: 'center' },
  etiqueta: { color: 'rgba(255,255,255,0.7)', fontWeight: 'bold', textAlign: 'center', overflow: 'hidden' },
  etiquetaActiva: { color: '#fff', backgroundColor: '#2fbf5b' },
  mastil: { flex: 1, overflow: 'hidden', borderRadius: 6, backgroundColor: '#3a2416', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(240,226,196,0.55)' },
  cuerda: { position: 'absolute', left: 0, right: 0, backgroundColor: '#d9dce0' },
  cuerdaEntorchada: { backgroundColor: '#c99b55' },
  linea: { position: 'absolute', top: 0, bottom: 0, width: 4, backgroundColor: '#ffd35c', opacity: 0.9 },
  tira: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 1 },
  nota: {
    position: 'absolute', backgroundColor: '#4c52d9', borderWidth: 2.5, borderColor: '#d9dcff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 3, elevation: 4,
  },
  // La próxima en tocarse: borde dorado para encontrarla de un vistazo
  notaProxima: { borderColor: '#ffd35c', backgroundColor: '#5a60f0' },
  notaBien: { backgroundColor: '#2fbf5b', borderColor: '#eafff0' },
  notaMal: { backgroundColor: 'rgba(220,70,90,0.55)', borderColor: 'rgba(255,255,255,0.4)' },
  // Franja clara arriba: le da volumen, como un botón con brillo
  brillo: { position: 'absolute', top: 2, left: 3, right: 3, height: '38%', backgroundColor: 'rgba(255,255,255,0.22)' },
  texto: { color: '#fff', fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  golpe: { opacity: 0.4 },
  golpeTexto: { color: '#fff', fontWeight: 'bold' },
});
