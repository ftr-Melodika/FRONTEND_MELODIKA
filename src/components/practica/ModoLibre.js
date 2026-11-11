// Archivo: src/components/practica/ModoLibre.js
// Se elige una nota (tocando el mástil o por su nombre) o un acorde, y el micrófono corrige si suena bien.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { TextoConIcono, COLORES_ICONO } from '../icono/Icono';
import { Button } from '../Button';
import { GuitarNeck, dedoSugerido } from '../leccion/GuitarNeck';
import { EstadoDeteccion } from '../leccion/EstadoDeteccion';
import { useDeteccionPractica } from '../../hooks/useDeteccionPractica';
import { obtenerObjetivo } from '../../utils/deteccionSonido';
import { NOTAS, notaDe, posicionesDeNota } from '../../utils/practica';
import { estilosPractica, VERDE } from './estilos';

function describirPosicion({ cuerda, traste }) {
  return traste === 0 ? `Cuerda ${cuerda}  •  Al aire` : `Cuerda ${cuerda}  •  Traste ${traste}  •  Dedo ${dedoSugerido(traste)}`;
}

function Chips({ opciones, elegida, onElegir }) {
  return (
    <View style={styles.chips}>
      {opciones.map((opcion) => (
        <TouchableOpacity
          key={opcion}
          style={[styles.chip, opcion === elegida && styles.chipElegido]}
          onPress={() => onElegir(opcion)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Elegir ${opcion}`}
        >
          <Text style={styles.chipTexto}>{opcion}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function ModoLibre({ material, acordes }) {
  const conAcordes = material === 'acordes';
  // { cuerda, traste } con notas, { acorde } con acordes. Cada elección es un objeto nuevo:
  // elegir lo mismo otra vez reinicia la corrección.
  const [seleccion, setSeleccion] = useState(null);
  const [logradas, setLogradas] = useState(0);

  const objetivo = useMemo(() => {
    if (!seleccion) return null;
    if (seleccion.acorde) return { ...seleccion.acorde.objetivo };
    return obtenerObjetivo({ cuerda: seleccion.cuerda, trasteObjetivo: seleccion.traste });
  }, [seleccion]);
  // El micrófono queda abierto mientras haya algo elegido, así cambiar es inmediato
  const { estado, lectura, aprobado } = useDeteccionPractica(objetivo, true, { seguirAlAprobar: true });

  useEffect(() => {
    if (aprobado) setLogradas((n) => n + 1);
  }, [aprobado]);

  // Estable: el mástil no se vuelve a dibujar con cada lectura del micrófono
  const elegirPosicion = useCallback((cuerda, traste) => setSeleccion({ cuerda, traste }), []);

  // Tocar otra vez la misma nota muestra el siguiente lugar donde se puede tocar
  const elegirNota = (nota) => {
    const lugares = posicionesDeNota(nota);
    const actual = seleccion?.cuerda ? lugares.findIndex((p) => p.cuerda === seleccion.cuerda && p.traste === seleccion.traste) : -1;
    setSeleccion({ ...lugares[(actual + 1) % lugares.length] });
  };

  const elegirAcorde = (nombre) => setSeleccion({ acorde: acordes.find((a) => a.nombre === nombre) });

  const notaElegida = seleccion?.cuerda ? notaDe(seleccion.cuerda, seleccion.traste) : null;
  const lugaresDeLaNota = notaElegida ? posicionesDeNota(notaElegida) : [];

  let consigna = conAcordes ? 'Elegí un acorde para practicar' : 'Tocá el mástil para elegir una nota';
  if (seleccion?.acorde) consigna = `Armá ${seleccion.acorde.nombre} y rasgueá`;
  if (seleccion?.cuerda) consigna = describirPosicion(seleccion);

  const unidad = conAcordes ? (logradas === 1 ? 'acorde logrado' : 'acordes logrados') : (logradas === 1 ? 'nota lograda' : 'notas logradas');

  return (
    <View style={estilosPractica.fila}>
      <View style={estilosPractica.columnaMastil}>
        <Text style={estilosPractica.consigna} numberOfLines={1}>{consigna}</Text>
        {conAcordes ? (
          <GuitarNeck posiciones={seleccion?.acorde?.objetivo.posiciones} correcto={aprobado} />
        ) : (
          <GuitarNeck
            targetNumber={seleccion ? seleccion.traste : null}
            cuerda={seleccion ? seleccion.cuerda : null}
            correcto={aprobado}
            onElegir={elegirPosicion}
          />
        )}
        <Text style={estilosPractica.ayuda}>Practicá libremente: esto no suma XP ni racha.</Text>
      </View>

      <ScrollView style={estilosPractica.columnaLateral} contentContainerStyle={estilosPractica.lateralContenido}>
        {objetivo ? (
          <>
            <Text style={[estilosPractica.notaGrande, aprobado && styles.notaLograda]}>{objetivo.nombre}</Text>
            {seleccion.acorde && <Text style={estilosPractica.detalleNota}>{seleccion.acorde.titulo}</Text>}
            {lugaresDeLaNota.length > 1 && (
              <Text style={estilosPractica.detalleNota}>
                Se puede tocar en {lugaresDeLaNota.length} lugares: tocá {objetivo.nombre} abajo para ver otro
              </Text>
            )}
            <EstadoDeteccion objetivo={objetivo} estado={estado} lectura={lectura} aprobado={aprobado} />
            {aprobado && <Button title="Otra vez" iconoDerecha="cambiar" variant="secondary" onPress={() => setSeleccion({ ...seleccion })} />}
          </>
        ) : (
          <Text style={estilosPractica.pregunta}>{conAcordes ? '¿Qué acorde querés tocar?' : '¿Qué nota querés tocar?'}</Text>
        )}

        {conAcordes ? (
          <Chips opciones={acordes.map((a) => a.nombre)} elegida={seleccion?.acorde?.nombre} onElegir={elegirAcorde} />
        ) : (
          <>
            <Text style={styles.subtitulo}>O elegila por su nombre</Text>
            <Chips opciones={NOTAS} elegida={notaElegida} onElegir={elegirNota} />
          </>
        )}

        <View style={estilosPractica.marcadorFila}>
          <TextoConIcono nombre="completado" acento={COLORES_ICONO.verde} style={estilosPractica.marcador}>
            {logradas} {unidad}
          </TextoConIcono>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  notaLograda: { color: '#f5b82e' },
  subtitulo: { color: '#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginTop: 10, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 6 },
  chip: { minWidth: 48, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  chipElegido: { backgroundColor: 'rgba(50,205,50,0.35)', borderColor: VERDE },
  chipTexto: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
