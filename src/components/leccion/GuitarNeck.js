// Archivo: src/components/leccion/GuitarNeck.js
import { memo } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// El alto del mástil se adapta a la pantalla (en un celular horizontal no entran 220px + botones)
const ALTO_MAXIMO = 220;
const ALTO_MINIMO = 130;
const ALTO_PIE = 18; // Fila de abajo, fuera de la madera, con "Aire" y el número de cada traste
const CANT_TRASTES = 5; // Los acordes abiertos entran; un traste más alto corre la vista
const TAMANO_PUNTO = 30;
// El punto es más chico que la separación entre cuerdas, para que se vea sobre una sola
const PROPORCION_PUNTO = 0.8;

// De izquierda a derecha: número de cuerda, zona de cuerdas al aire, cejuela y los trastes
const ANCHO_ETIQUETA_CUERDA = 24;
const ANCHO_AL_AIRE = TAMANO_PUNTO + 8;
const ANCHO_CEJUELA = 6;
const ANCHO_TRASTE = 3;

const CUERDAS = [6, 5, 4, 3, 2, 1]; // De arriba hacia abajo: la 1ra (la más fina) queda abajo, como la ve quien toca
// Grosor de cada cuerda; de la 4ta a la 6ta son entorchadas (color bronce)
const GROSOR = { 1: 1.5, 2: 1.8, 3: 2.2, 4: 2.6, 5: 3.1, 6: 3.6 };
const COLOR_LISA = ['#ffffff', '#c9cdd2', '#7d8288'];
const COLOR_ENTORCHADA = ['#fbe7bd', '#c99b55', '#7a5427'];

const MADERA = ['#2a1910', '#4b2e1d', '#563622', '#4b2e1d', '#2a1910'];
const MADERA_CABEZAL = ['#1c110a', '#3a2416', '#1c110a'];
const METAL_TRASTE = ['#7c7f84', '#f4f5f7', '#8d9095'];
const HUESO = ['#d8cdb4', '#fbf7ec', '#cfc3a8'];

// Trastes con marcador de nácar, como en una guitarra real (el 12 lleva dos)
const MARCADORES = { 3: 1, 5: 1, 7: 1, 9: 1, 12: 2, 15: 1, 17: 1 };

const numeroDeCuerda = (cuerda) => Math.min(Math.max(Number(cuerda) || 1, 1), 6);

// Altura del centro de una cuerda dentro de la madera
function alturaDeCuerda(cuerda, separacion) {
  return separacion * (CUERDAS.indexOf(numeroDeCuerda(cuerda)) + 0.5);
}

// Dedo sugerido para una nota suelta (1 índice … 4 meñique): un dedo por traste, desde el primer traste visible
export function dedoSugerido(traste, primerTraste = Math.max(1, traste - CANT_TRASTES + 1)) {
  if (!traste) return null;
  return Math.min(Math.max(traste - primerTraste + 1, 1), 4);
}

// Punto lleno sobre un traste (con el número de dedo), o anillo vacío si la cuerda se toca al aire
function Punto({ cuerda, traste, dedo, tamano, separacion, primerTraste, correcto }) {
  const alAire = traste === 0;
  const top = alturaDeCuerda(cuerda, separacion) - tamano / 2;
  const left = alAire
    ? (ANCHO_AL_AIRE - tamano) / 2
    : `${(((traste - primerTraste + 0.5) / CANT_TRASTES) * 100).toFixed(2)}%`;

  return (
    <View
      accessibilityLabel={alAire ? `Cuerda ${cuerda} al aire` : `Cuerda ${cuerda}, traste ${traste}${dedo ? `, dedo ${dedo}` : ''}`}
      style={[
        styles.punto,
        correcto && styles.puntoCorrecto,
        alAire && styles.puntoAlAire,
        alAire && correcto && styles.puntoAlAireCorrecto,
        { width: tamano, height: tamano, borderRadius: tamano / 2, top, left },
        !alAire && { marginLeft: -tamano / 2 },
      ]}
    >
      {alAire || !dedo ? null : <Text style={[styles.puntoTexto, { fontSize: Math.round(tamano * 0.52) }]}>{String(dedo)}</Text>}
    </View>
  );
}

function Cuerda({ numero, separacion }) {
  const grosor = GROSOR[numero];
  const top = alturaDeCuerda(numero, separacion) - grosor / 2;
  return (
    <>
      {/* Sombra que la cuerda proyecta sobre la madera */}
      <View style={[styles.sombraCuerda, { top: top + grosor + 1, height: Math.max(1, grosor * 0.6) }]} />
      <LinearGradient colors={numero > 3 ? COLOR_ENTORCHADA : COLOR_LISA} style={[styles.cuerdaLinea, { top, height: grosor }]} />
    </>
  );
}

function Marcador({ traste, primerTraste, separacion, tamano }) {
  const cantidad = MARCADORES[traste];
  if (!cantidad) return null;
  const left = `${(((traste - primerTraste + 0.5) / CANT_TRASTES) * 100).toFixed(2)}%`;
  // Uno entre la 4ta y la 3ra cuerda; el doble, entre la 5ta y la 4ta y entre la 3ra y la 2da
  const centros = cantidad === 2 ? [separacion * 2, separacion * 4] : [separacion * 3];
  return centros.map((centro) => (
    <View
      key={centro}
      style={[styles.marcador, { width: tamano, height: tamano, borderRadius: tamano / 2, top: centro - tamano / 2, left, marginLeft: -tamano / 2 }]}
    />
  ));
}

// Con `posiciones` dibuja un acorde: un punto por cuerda y una ✕ en las cuerdas que no se tocan.
// Con `onElegir(cuerda, traste)` cada posición del mástil se puede tocar para elegirla.
// `correcto` pinta el punto de dorado, para festejar un acierto.
// dotLeft y dotBottom ubican el punto a mano: solo sirven para una lección que no indica su cuerda.
// Con memo no se vuelve a dibujar si no cambió nada: la detección y el reloj de la práctica
// actualizan la pantalla varias veces por segundo. `posiciones` y `onElegir` deben ser estables.
export const GuitarNeck = memo(function GuitarNeck({ targetNumber, cuerda, dotLeft, dotBottom, posiciones, onElegir, correcto }) {
  const { height } = useWindowDimensions();
  const altoMastil = Math.round(Math.min(ALTO_MAXIMO, Math.max(ALTO_MINIMO, height * 0.42)));
  const altoMadera = altoMastil - ALTO_PIE;
  const hayObjetivo = targetNumber !== null && targetNumber !== undefined && targetNumber !== '';

  const separacion = altoMadera / CUERDAS.length;
  const tamano = Math.floor(Math.min(TAMANO_PUNTO, separacion * PROPORCION_PUNTO));

  const puntosBase = posiciones
    ? posiciones.map((p) => ({ cuerda: p.cuerda, traste: Number(p.traste), dedo: p.dedo }))
    : hayObjetivo ? [{ cuerda: numeroDeCuerda(cuerda), traste: Number(targetNumber) || 0 }] : [];
  const conManual = !posiciones && hayObjetivo && dotLeft && dotBottom;

  // Un traste alto corre la vista del mástil, para que el punto coincida con su número
  const trasteMaximo = Math.max(0, ...puntosBase.map((p) => p.traste));
  const primerTraste = Math.max(1, trasteMaximo - CANT_TRASTES + 1);
  // Si la lección no indica el dedo, se sugiere uno
  const puntos = puntosBase.map((p) => ({ ...p, dedo: p.dedo ?? dedoSugerido(p.traste, primerTraste) }));
  const trastes = Array.from({ length: CANT_TRASTES }, (_, i) => primerTraste + i);
  const conCejuela = primerTraste === 1;

  const cuerdasActivas = posiciones ? posiciones.map((p) => Number(p.cuerda)) : [Number(cuerda)];
  const puntoProps = { tamano, separacion, primerTraste, correcto };
  const tamanoMarcador = Math.max(6, Math.round(separacion * 0.38));

  return (
    <View style={[styles.contenedor, { height: altoMastil }]}>
      <View style={[styles.fila, { height: altoMadera }]}>

        {/* Número de cada cuerda, fuera de la madera */}
        <View style={styles.columnaEtiquetas}>
          {CUERDAS.map((num) => {
            const muda = posiciones && !cuerdasActivas.includes(num);
            const activa = cuerdasActivas.includes(num);
            return (
              <View key={num} style={[styles.etiquetaFila, { height: separacion }]}>
                <Text
                  style={[styles.cuerdaNumero, muda && styles.cuerdaMuda, activa && styles.cuerdaNumeroActiva]}
                  accessibilityLabel={muda ? `Cuerda ${num}: no se toca` : `Cuerda ${num}`}
                >
                  {muda ? '✕' : num}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.madera}>
          {/* Cabezal: la zona de las cuerdas al aire */}
          <LinearGradient colors={MADERA_CABEZAL} style={styles.cabezal} />

          {/* Diapasón */}
          <LinearGradient colors={MADERA} style={[styles.diapason, { left: ANCHO_AL_AIRE }]} />
          {conCejuela ? (
            <LinearGradient colors={HUESO} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cejuela} />
          ) : (
            <View style={styles.cejuelaCorrida} />
          )}

          <View style={[styles.zonaTrastes, { left: ANCHO_AL_AIRE + ANCHO_CEJUELA }]}>
            {trastes.map((numero) => (
              <View key={numero} style={styles.traste}>
                <LinearGradient colors={METAL_TRASTE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.alambre} />
              </View>
            ))}
            {trastes.map((numero) => (
              <Marcador key={`m${numero}`} traste={numero} primerTraste={primerTraste} separacion={separacion} tamano={tamanoMarcador} />
            ))}
          </View>

          {CUERDAS.map((num) => <Cuerda key={num} numero={num} separacion={separacion} />)}

          {/* Indicador Visual Dinámico */}
          {conManual ? (
            <View style={[styles.punto, { width: tamano, height: tamano, borderRadius: tamano / 2, left: dotLeft, bottom: dotBottom }]}>
              {puntos[0]?.dedo ? <Text style={[styles.puntoTexto, { fontSize: Math.round(tamano * 0.52) }]}>{String(puntos[0].dedo)}</Text> : null}
            </View>
          ) : (
            <>
              {puntos.filter((p) => p.traste === 0).map((p) => (
                <Punto key={p.cuerda} {...p} {...puntoProps} />
              ))}
              <View style={[styles.capaPuntos, { left: ANCHO_AL_AIRE + ANCHO_CEJUELA }]} pointerEvents="none">
                {puntos.filter((p) => p.traste !== 0).map((p) => (
                  <Punto key={p.cuerda} {...p} {...puntoProps} />
                ))}
              </View>
            </>
          )}

          {/* Zonas táctiles: una por cuerda y traste, incluida la columna al aire */}
          {onElegir ? (
            <View style={styles.capaTactil}>
              {[0, ...trastes].map((traste) => (
                <View key={traste} style={traste === 0 ? { width: ANCHO_AL_AIRE + ANCHO_CEJUELA } : styles.traste}>
                  {CUERDAS.map((num) => (
                    <Pressable
                      key={num}
                      onPress={() => onElegir(num, traste)}
                      accessibilityRole="button"
                      accessibilityLabel={traste === 0 ? `Cuerda ${num} al aire` : `Cuerda ${num}, traste ${traste}`}
                      style={({ pressed }) => [{ height: separacion }, pressed && styles.zonaPresionada]}
                    />
                  ))}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {/* Número de cada traste, debajo de las cuerdas */}
      <View style={styles.pie}>
        <Text style={[styles.pieTexto, { width: ANCHO_AL_AIRE + ANCHO_CEJUELA }]} numberOfLines={1}>Aire</Text>
        {trastes.map((numero) => (
          <Text key={numero} style={[styles.pieTexto, styles.traste]} numberOfLines={1}>Traste {numero}</Text>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  contenedor: { width: '100%', marginBottom: 8 },
  fila: { flexDirection: 'row' },
  columnaEtiquetas: { width: ANCHO_ETIQUETA_CUERDA },
  etiquetaFila: { justifyContent: 'center', alignItems: 'center' },
  cuerdaNumero: { width: 20, height: 20, lineHeight: 20, borderRadius: 10, overflow: 'hidden', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  cuerdaNumeroActiva: { color: '#fff', backgroundColor: '#2fbf5b' },
  cuerdaMuda: { color: '#ff9aa5' },

  madera: { flex: 1, borderRadius: 6, overflow: 'hidden', backgroundColor: MADERA[2], borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(240,226,196,0.55)' },
  cabezal: { position: 'absolute', top: 0, bottom: 0, left: 0, width: ANCHO_AL_AIRE },
  diapason: { position: 'absolute', top: 0, bottom: 0, right: 0 },
  cejuela: { position: 'absolute', top: 0, bottom: 0, left: ANCHO_AL_AIRE, width: ANCHO_CEJUELA },
  cejuelaCorrida: { position: 'absolute', top: 0, bottom: 0, left: ANCHO_AL_AIRE + ANCHO_CEJUELA - ANCHO_TRASTE, width: ANCHO_TRASTE, backgroundColor: '#9a9da2' },
  zonaTrastes: { position: 'absolute', top: 0, bottom: 0, right: 0, flexDirection: 'row' },
  traste: { flex: 1 },
  alambre: { position: 'absolute', top: 0, bottom: 0, right: 0, width: ANCHO_TRASTE },
  marcador: { position: 'absolute', backgroundColor: 'rgba(238,232,220,0.75)' },

  sombraCuerda: { position: 'absolute', left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  cuerdaLinea: { position: 'absolute', left: 0, right: 0 },

  capaPuntos: { position: 'absolute', top: 0, bottom: 0, right: 0 },
  punto: {
    position: 'absolute', backgroundColor: '#2fbf5b', borderWidth: 2, borderColor: '#eafff0',
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.45, shadowRadius: 3, elevation: 5,
  },
  puntoCorrecto: { backgroundColor: '#f5b82e', borderColor: '#fff6dc' },
  // La cuerda se ve a través del anillo: indica que no se pisa nada
  puntoAlAire: { backgroundColor: 'transparent', borderWidth: 3, borderColor: '#4be07a', elevation: 0, shadowOpacity: 0 },
  puntoAlAireCorrecto: { borderColor: '#f5b82e' },
  puntoTexto: { color: '#fff', fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 },

  capaTactil: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, flexDirection: 'row', zIndex: 20 },
  zonaPresionada: { backgroundColor: 'rgba(255,255,255,0.15)' },

  pie: { flexDirection: 'row', height: ALTO_PIE, alignItems: 'center', marginLeft: ANCHO_ETIQUETA_CUERDA },
  pieTexto: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
});
