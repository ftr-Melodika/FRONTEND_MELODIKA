// Archivo: src/components/leccion/GuitarNeck.js
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';

// El alto del mástil se adapta a la pantalla (en un celular horizontal no entran 220px + botones)
const ALTO_MAXIMO = 220;
const ALTO_MINIMO = 130;
const BORDE = 3;
const ALTO_CABECERA = 18; // Fila de arriba, con "Aire" y el número de cada traste
const MARGEN_INFERIOR = 4;
const CANT_TRASTES = 5; // Los acordes abiertos entran; un traste más alto corre la vista
const TAMANO_PUNTO = 38;

// De izquierda a derecha: número de cuerda, columna de cuerdas al aire y, desde la cejuela, los trastes
const ANCHO_ETIQUETA_CUERDA = 26;
const ANCHO_AL_AIRE = TAMANO_PUNTO + 6;
const INICIO_TRASTES = ANCHO_ETIQUETA_CUERDA + ANCHO_AL_AIRE;
const ANCHO_CEJUELA = 6;

const CUERDAS = [6, 5, 4, 3, 2, 1]; // De arriba hacia abajo: la 1ra (la más fina) queda abajo, como la ve quien toca

const numeroDeCuerda = (cuerda) => Math.min(Math.max(Number(cuerda) || 1, 1), 6);

// Altura de una cuerda dentro del mástil
function alturaDeCuerda(cuerda, separacion) {
  return ALTO_CABECERA + separacion * (CUERDAS.indexOf(numeroDeCuerda(cuerda)) + 0.5);
}

// Punto lleno sobre un traste, o anillo vacío si la cuerda se toca al aire
function Punto({ cuerda, traste, etiqueta, tamano, separacion, primerTraste }) {
  const alAire = traste === 0;
  const top = alturaDeCuerda(cuerda, separacion) - tamano / 2;
  const left = alAire
    ? ANCHO_ETIQUETA_CUERDA + (ANCHO_AL_AIRE - tamano) / 2
    : `${(((traste - primerTraste + 0.5) / CANT_TRASTES) * 100).toFixed(2)}%`;

  return (
    <View
      accessibilityLabel={alAire ? `Cuerda ${cuerda} al aire` : `Cuerda ${cuerda}, traste ${traste}`}
      style={[
        styles.punto,
        alAire && styles.puntoAlAire,
        { width: tamano, height: tamano, borderRadius: tamano / 2, top, left },
        !alAire && { marginLeft: -tamano / 2 },
      ]}
    >
      {alAire ? null : <Text style={[styles.puntoTexto, { fontSize: Math.round(tamano * 0.55) }]}>{String(etiqueta ?? traste)}</Text>}
    </View>
  );
}

// Con `posiciones` dibuja un acorde: un punto por cuerda y una ✕ en las cuerdas que no se tocan.
// dotLeft y dotBottom ubican el punto a mano: solo sirven para una lección que no indica su cuerda.
export function GuitarNeck({ targetNumber, cuerda, dotLeft, dotBottom, posiciones }) {
  const { height } = useWindowDimensions();
  const altoMastil = Math.round(Math.min(ALTO_MAXIMO, Math.max(ALTO_MINIMO, height * 0.42)));
  const hayObjetivo = targetNumber !== null && targetNumber !== undefined && targetNumber !== '';

  const separacion = (altoMastil - BORDE * 2 - ALTO_CABECERA - MARGEN_INFERIOR) / CUERDAS.length;
  // En un acorde los puntos van en cuerdas vecinas: se achican para no pisarse
  const tamano = Math.floor(Math.min(TAMANO_PUNTO, posiciones ? separacion : separacion + 6));

  const puntos = posiciones
    ? posiciones.map((p) => ({ cuerda: p.cuerda, traste: Number(p.traste), etiqueta: p.dedo }))
    : hayObjetivo ? [{ cuerda: numeroDeCuerda(cuerda), traste: Number(targetNumber) || 0 }] : [];
  const conManual = !posiciones && hayObjetivo && dotLeft && dotBottom;

  // Un traste alto corre la vista del mástil, para que el punto coincida con su número
  const trasteMaximo = Math.max(0, ...puntos.map((p) => p.traste));
  const primerTraste = Math.max(1, trasteMaximo - CANT_TRASTES + 1);
  const trastes = Array.from({ length: CANT_TRASTES }, (_, i) => primerTraste + i);

  const cuerdasActivas = posiciones ? posiciones.map((p) => p.cuerda) : [Number(cuerda)];
  const puntoProps = { tamano, separacion, primerTraste };

  return (
    <View style={[styles.mastil, { height: altoMastil }]}>

      <Text style={styles.tituloAlAire} accessibilityElementsHidden>Aire</Text>

      {/* Trastes (Verticales) */}
      <View style={[styles.zonaTrastes, primerTraste === 1 && styles.cejuela]}>
        {trastes.map((numero) => (
          <View key={numero} style={styles.traste}>
            <Text style={styles.trasteNumero} numberOfLines={1}>Traste {numero}</Text>
          </View>
        ))}
      </View>

      {/* Cuerdas (Horizontales) */}
      {CUERDAS.map((num) => (
        <View key={num} style={[styles.cuerda, { top: alturaDeCuerda(num, separacion) - 10 }]}>
          {posiciones && !cuerdasActivas.includes(num) ? (
            <Text style={styles.cuerdaNumero} accessibilityLabel={`Cuerda ${num}: no se toca`}>✕</Text>
          ) : (
            <Text style={[styles.cuerdaNumero, cuerdasActivas.includes(num) && styles.cuerdaNumeroActiva]}>{num}</Text>
          )}
          <View style={[styles.cuerdaLinea, num > 3 && styles.cuerdaGruesa, num === 6 && { height: 4 }]} />
        </View>
      ))}

      {/* Indicador Visual Dinámico */}
      {conManual ? (
        <View style={[styles.punto, { width: tamano, height: tamano, borderRadius: tamano / 2, left: dotLeft, bottom: dotBottom }]}>
          <Text style={[styles.puntoTexto, { fontSize: Math.round(tamano * 0.55) }]}>{String(targetNumber)}</Text>
        </View>
      ) : (
        <>
          {puntos.filter((p) => p.traste === 0).map((p) => (
            <Punto key={p.cuerda} {...p} {...puntoProps} />
          ))}
          <View style={[styles.capaPuntos, primerTraste === 1 && { left: INICIO_TRASTES + ANCHO_CEJUELA }]} pointerEvents="none">
            {puntos.filter((p) => p.traste !== 0).map((p) => (
              <Punto key={p.cuerda} {...p} {...puntoProps} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mastil: { width: '100%', backgroundColor: '#4A2E1B', borderRadius: 10, borderWidth: BORDE, borderColor: '#2A180E', overflow: 'hidden', position: 'relative', marginBottom: 8 },
  tituloAlAire: { position: 'absolute', top: 2, left: ANCHO_ETIQUETA_CUERDA, width: ANCHO_AL_AIRE, color: '#a3fba3', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  zonaTrastes: { position: 'absolute', top: 0, bottom: 0, right: 0, left: INICIO_TRASTES, flexDirection: 'row' },
  cejuela: { borderLeftWidth: ANCHO_CEJUELA, borderLeftColor: '#EDE6D6' },
  traste: { flex: 1, borderRightWidth: 4, borderRightColor: 'rgba(192,192,192,0.8)' },
  trasteNumero: { marginTop: 2, color: '#a3fba3', fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  cuerda: { position: 'absolute', left: 0, right: 0, height: 20, flexDirection: 'row', alignItems: 'center' },
  cuerdaNumero: { color: '#a3fba3', width: 20, fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginRight: ANCHO_ETIQUETA_CUERDA - 20 },
  cuerdaNumeroActiva: { color: '#fff', backgroundColor: '#32CD32', borderRadius: 10, overflow: 'hidden' },
  cuerdaLinea: { flex: 1, height: 2, backgroundColor: '#E8E8E8', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.8, shadowRadius: 2 },
  cuerdaGruesa: { height: 3, backgroundColor: '#D3D3D3' },
  capaPuntos: { position: 'absolute', top: 0, bottom: 0, right: 0, left: INICIO_TRASTES },
  punto: { position: 'absolute', backgroundColor: '#32CD32', borderWidth: 2, borderColor: '#fff', justifyContent: 'center', alignItems: 'center', zIndex: 10, shadowColor: '#32CD32', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 8 },
  // La cuerda se ve a través del anillo: indica que no se pisa nada
  puntoAlAire: { backgroundColor: 'transparent', borderWidth: 4, borderColor: '#32CD32', elevation: 0 },
  puntoTexto: { color: '#fff', fontWeight: 'bold' },
});
