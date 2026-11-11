// Archivo: src/components/leccion/QuizStep.js
// Quiz de opción múltiple. Cada pregunta puede mostrar una imagen (con una parte marcada o un acercamiento);
// si ni la pregunta ni el quiz traen imagen, la pregunta ocupa todo el ancho.
// Al responder se ve si estuvo bien y por qué. Al final se puede repasar lo que se falló.
import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Button } from '../Button';
import { GuitarraIlustrada, proporcionImagen } from './GuitarraIlustrada';
import { FUENTE_TITULO } from '../../theme/fuentes';

const VERDE = '#a3fba3';

// El tamaño más grande con esa proporción que entra en el área: un recorte alto (las clavijas)
// no puede ocupar todo el ancho porque se saldría por abajo
function encajar(area, proporcion) {
  if (!area) return { width: '100%' };
  const width = Math.min(area.width, area.height * proporcion);
  return { width, height: width / proporcion };
}

export function QuizStep({ quiz, onBack, onFinish, finishing }) {
  // Los índices de las preguntas que se están respondiendo: todas, o solo las falladas al repasar
  const [ronda, setRonda] = useState(() => quiz.preguntas.map((_, i) => i));
  const [posicion, setPosicion] = useState(0);
  const [elegida, setElegida] = useState(null);
  const [falladas, setFalladas] = useState([]);
  const [aciertos, setAciertos] = useState(0); // De la primera vuelta: es lo que se informa
  const [primeraVuelta, setPrimeraVuelta] = useState(true);
  const [terminado, setTerminado] = useState(false);
  const [areaImagen, setAreaImagen] = useState(null);

  const indice = ronda[posicion];
  const pregunta = quiz.preguntas[indice];
  const respondida = elegida !== null;
  const acerto = elegida === pregunta?.correcta;
  // Cada pregunta puede traer su propia imagen o un acercamiento; si no, se usa la del quiz
  const imagen = pregunta?.imagen ?? quiz.imagen ?? null;

  const responder = (opcion) => {
    if (respondida) return;
    setElegida(opcion);
    if (opcion === pregunta.correcta) {
      if (primeraVuelta) setAciertos((n) => n + 1);
    } else {
      setFalladas((lista) => [...lista, indice]);
    }
  };

  const siguiente = () => {
    setElegida(null);
    if (posicion + 1 < ronda.length) setPosicion(posicion + 1);
    else setTerminado(true);
  };

  const repasar = () => {
    setRonda(falladas);
    setFalladas([]);
    setPosicion(0);
    setPrimeraVuelta(false);
    setTerminado(false);
  };

  if (terminado) {
    const total = quiz.preguntas.length;
    const perfecto = falladas.length === 0;
    return (
      <View style={styles.container}>
        <View style={styles.final}>
          <Text style={styles.titulo}>{primeraVuelta ? `Acertaste ${aciertos} de ${total}` : perfecto ? '¡Ahora sí, todas bien!' : 'Seguí practicando'}</Text>
          <Text style={styles.texto}>
            {perfecto ? (quiz.nombre ? `Dominaste "${quiz.nombre}".` : '¡Respondiste todo bien!') : `Te ${falladas.length === 1 ? 'faltó 1' : `faltaron ${falladas.length}`}. Podés repasarlas antes de terminar.`}
          </Text>
          {quiz.imagen ? <GuitarraIlustrada imagen={quiz.imagen} style={styles.imagenFinal} /> : null}
        </View>
        <View style={styles.btnRow}>
          {perfecto ? (
            onBack ? <Button title="Atrás" icono="volver" variant="secondary" onPress={onBack} style={styles.btnHalf} /> : null
          ) : (
            <Button title="Repasar las que fallé" icono="cambiar" variant="secondary" onPress={repasar} style={styles.btnHalf} />
          )}
          <Button title="Terminar Lección" onPress={() => onFinish()} loading={finishing} style={[styles.btnHalf, styles.btnTerminar]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.contador}>
        {primeraVuelta ? 'Pregunta' : 'Repaso'} {posicion + 1} de {ronda.length}
      </Text>

      <View style={styles.fila}>
        {imagen ? (
        <View
          style={styles.columnaImagen}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setAreaImagen({ width, height });
          }}
        >
          <GuitarraIlustrada
            key={indice}
            imagen={imagen}
            marcador={pregunta.marcador}
            recorte={pregunta.recorte}
            colorMarcador={!respondida ? '#ffd35c' : acerto ? VERDE : '#ff7e8d'}
            style={encajar(areaImagen, proporcionImagen({ imagen: imagen, recorte: pregunta.recorte }))}
          />
        </View>
        ) : null}

        <ScrollView style={styles.columnaPregunta} contentContainerStyle={styles.preguntaContenido}>
          <Text style={styles.pregunta}>{pregunta.pregunta}</Text>
          <View style={styles.opciones}>
            {pregunta.opciones.map((opcion, i) => {
              const esCorrecta = respondida && i === pregunta.correcta;
              const esError = respondida && i === elegida && !acerto;
              return (
                <TouchableOpacity
                  key={opcion}
                  style={[styles.opcion, esCorrecta && styles.opcionCorrecta, esError && styles.opcionError]}
                  onPress={() => responder(i)}
                  disabled={respondida}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: respondida, selected: i === elegida }}
                >
                  <Text style={styles.opcionTexto} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{opcion}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {respondida && (
            <Text style={[styles.resultado, acerto ? styles.resultadoOk : styles.resultadoMal]} accessibilityLiveRegion="polite">
              {acerto ? '¡Correcto! ' : `Es ${pregunta.opciones[pregunta.correcta]}. `}
              {pregunta.explicacion ? <Text style={styles.explicacion}>{pregunta.explicacion}</Text> : null}
            </Text>
          )}
        </ScrollView>
      </View>

      <View style={styles.btnRow}>
        {onBack ? <Button title="Atrás" icono="volver" variant="secondary" onPress={onBack} style={styles.btnHalf} /> : null}
        <Button
          title={posicion + 1 < ronda.length ? 'Siguiente' : 'Ver resultado'}
          iconoDerecha="adelante"
          onPress={siguiente}
          disabled={!respondida}
          style={[styles.btnHalf, styles.btnTerminar]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', justifyContent: 'space-between' },
  contador: { color: '#fff', fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  fila: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  columnaImagen: { flex: 1.15, alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center' },
  columnaPregunta: { flex: 1 },
  preguntaContenido: { flexGrow: 1, justifyContent: 'center' },
  pregunta: { color: '#fff', fontSize: 17, fontWeight: 'bold', fontFamily: FUENTE_TITULO, marginBottom: 8 },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcion: { flexGrow: 1, flexBasis: '45%', paddingVertical: 10, paddingHorizontal: 6, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  opcionCorrecta: { backgroundColor: 'rgba(50,205,50,0.35)', borderColor: VERDE },
  opcionError: { backgroundColor: 'rgba(255,126,141,0.3)', borderColor: '#ff7e8d' },
  opcionTexto: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  resultado: { fontSize: 14, fontWeight: 'bold', marginTop: 8 },
  resultadoOk: { color: VERDE },
  resultadoMal: { color: '#ffb3bd' },
  explicacion: { color: '#fff', fontWeight: 'normal' },
  final: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  titulo: { color: '#fff', fontSize: 24, fontWeight: 'bold', fontFamily: FUENTE_TITULO, textAlign: 'center' },
  texto: { color: '#fff', fontSize: 15, textAlign: 'center' },
  imagenFinal: { maxWidth: 420, marginTop: 6 },
  btnRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 15, paddingTop: 4 },
  btnHalf: { flex: 1 },
  btnTerminar: { backgroundColor: '#4c52d9' },
});
