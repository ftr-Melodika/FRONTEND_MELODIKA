// Archivo: src/components/practica/ModoAdivinar.js
// El mástil marca una posición (o la forma de un acorde) y hay que elegir qué nota (o acorde) es.
import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { TextoConIcono, COLORES_ICONO } from '../icono/Icono';
import { Button } from '../Button';
import { GuitarNeck, dedoSugerido } from '../leccion/GuitarNeck';
import { preguntaAlAzar } from '../../utils/practica';
import { preguntaDeAcorde } from '../../utils/acordes';
import { estilosPractica as styles } from './estilos';

// Las dos clases de pregunta tienen la misma forma: { respuesta, opciones, ... }
function nuevaPregunta(conAcordes, acordes, anterior) {
  if (conAcordes) {
    const { acorde, opciones } = preguntaDeAcorde(acordes, anterior?.acorde);
    return { acorde, opciones, respuesta: acorde.nombre };
  }
  const pregunta = preguntaAlAzar(anterior);
  return { ...pregunta, respuesta: pregunta.nota };
}

export function ModoAdivinar({ material, acordes }) {
  const conAcordes = material === 'acordes';
  const [pregunta, setPregunta] = useState(() => nuevaPregunta(conAcordes, acordes, null));
  const [elegida, setElegida] = useState(null);
  const [marcador, setMarcador] = useState({ aciertos: 0, total: 0, seguidos: 0 });

  const respondida = elegida !== null;
  const acerto = elegida === pregunta.respuesta;

  const responder = (opcion) => {
    if (respondida) return;
    const correcta = opcion === pregunta.respuesta;
    setElegida(opcion);
    setMarcador((m) => ({
      aciertos: m.aciertos + (correcta ? 1 : 0),
      total: m.total + 1,
      seguidos: correcta ? m.seguidos + 1 : 0,
    }));
  };

  const siguiente = () => {
    setPregunta(nuevaPregunta(conAcordes, acordes, pregunta));
    setElegida(null);
  };

  const consigna = conAcordes
    ? 'Mirá la forma de la mano en el mástil'
    : `Cuerda ${pregunta.cuerda}  •  ${pregunta.traste === 0 ? 'Al aire' : `Traste ${pregunta.traste}  •  Dedo ${dedoSugerido(pregunta.traste)}`}`;

  return (
    <View style={styles.fila}>
      <View style={styles.columnaMastil}>
        <Text style={styles.consigna}>{consigna}</Text>
        {conAcordes ? (
          <GuitarNeck posiciones={pregunta.acorde.objetivo.posiciones} correcto={respondida && acerto} />
        ) : (
          <GuitarNeck targetNumber={pregunta.traste} cuerda={pregunta.cuerda} correcto={respondida && acerto} />
        )}
      </View>

      <ScrollView style={styles.columnaLateral} contentContainerStyle={styles.lateralContenido}>
        <Text style={styles.pregunta}>{conAcordes ? '¿Qué acorde es?' : '¿Qué nota es?'}</Text>
        <View style={styles.opciones}>
          {pregunta.opciones.map((opcion) => {
            const esCorrecta = respondida && opcion === pregunta.respuesta;
            const esError = respondida && opcion === elegida && !acerto;
            return (
              <TouchableOpacity
                key={opcion}
                style={[styles.opcion, esCorrecta && styles.opcionCorrecta, esError && styles.opcionError]}
                onPress={() => responder(opcion)}
                disabled={respondida}
                activeOpacity={0.8}
              >
                <Text style={styles.opcionTexto}>{opcion}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {respondida && (
          <Text style={[styles.resultado, acerto ? styles.resultadoOk : styles.resultadoMal]}>
            {acerto ? '¡Correcto!' : `Era ${pregunta.respuesta}`}
          </Text>
        )}
        {respondida && <Button title="Siguiente" iconoDerecha="adelante" onPress={siguiente} />}

        <View style={styles.marcadorFila}>
          <TextoConIcono nombre="completado" tamano={16} acento={COLORES_ICONO.verde} style={styles.marcador}>{marcador.aciertos} de {marcador.total}</TextoConIcono>
          <TextoConIcono nombre="llama" tamano={16} acento={COLORES_ICONO.llama} style={styles.marcador}>{marcador.seguidos} seguidas</TextoConIcono>
        </View>
      </ScrollView>
    </View>
  );
}
