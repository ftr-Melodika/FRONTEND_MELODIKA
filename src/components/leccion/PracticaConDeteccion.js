// Archivo: src/components/leccion/PracticaConDeteccion.js
// La práctica de siempre: consignas (notas o acordes) una por una, escuchando el micrófono.
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../Button';
import { GuitarNeck, dedoSugerido } from './GuitarNeck';
import { EstadoDeteccion, microfonoCaido } from './EstadoDeteccion';
import { useDeteccionPractica } from '../../hooks/useDeteccionPractica';
import { useVistaLeccion } from '../../context/VistaLeccionContext';
import { cejillasDeSecuencia } from '../../utils/cejilla';
import { acordesDeContexto, agruparConsignas } from '../../utils/acordes';

const SEGUNDOS_PARA_SALTEAR = 20;
const MS_AUTO_TERMINAR = 1200;
const MS_FESTEJO = 300; // Lo que se ve el acierto antes de pasar a la consigna siguiente

// Texto de una consigna: en una nota indica dónde pisar; en un acorde lo muestra el mástil
function describir(objetivo) {
  if (objetivo.tipo === 'acorde') return `Acorde: ${objetivo.nombre}`;
  const { cuerda, traste } = objetivo.posiciones[0];
  const donde = traste === 0 ? 'Al aire' : `Traste ${traste}  •  Dedo ${objetivo.posiciones[0].dedo ?? dedoSugerido(traste)}`;
  return `Cuerda ${cuerda}  •  ${donde}  •  Nota: ${objetivo.nombre}`;
}

function Progreso({ total, actual, completo, etiqueta = 'Consigna' }) {
  return (
    <View style={styles.progreso} accessibilityLabel={`${etiqueta} ${Math.min(actual + 1, total)} de ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.punto, (completo || i < actual) && styles.puntoHecho, !completo && i === actual && styles.puntoActual]} />
      ))}
    </View>
  );
}

// Recorre las consignas una por una. El micrófono queda abierto entre consigna y consigna.
// Fuera de una lección (en Canciones) no hay XP: se cambia el texto final y no se ofrece saltear.
// `onCompletar` avisa apenas se hacen todas las consignas (sin esperar el botón final).
// En la vista inmersiva de una clase (ver VistaLeccionContext) no hay botones: el mástil ocupa casi toda
// la pantalla, un cartel con el nombre dice qué tocar y, con el menú de pausa abierto, el micrófono descansa.
export function PracticaConDeteccion({
  onBack, onFinish, finishing, secuencia, textoFinal = 'Terminar Lección', permitirSaltear = true, onCompletar, textoAtras = 'Atrás', autoTerminar = false,
}) {
  const [indice, setIndice] = useState(0);
  const [festejo, setFestejo] = useState(false);
  const [completo, setCompleto] = useState(false);
  const [puedeSaltear, setPuedeSaltear] = useState(false);
  const { inmersivo, pausado } = useVistaLeccion();

  const posicion = Math.min(indice, secuencia.length - 1);
  const objetivo = secuencia[posicion];
  // En una lección de cejilla, las notas sueltas que aprieta la cejilla también la muestran
  const cejillas = useMemo(() => cejillasDeSecuencia(secuencia), [secuencia]);
  // Al tocar un acorde cuerda por cuerda, cada nota muestra el acorde entero (remarcando su cuerda)
  const contextos = useMemo(() => acordesDeContexto(secuencia), [secuencia]);
  const acordeDeLaNota = contextos[posicion];
  // Un acorde cuerda por cuerda cuenta como una sola consigna: sus cuerdas son pasos de adentro
  const consignas = useMemo(() => agruparConsignas(secuencia, contextos), [secuencia, contextos]);
  const numeroConsigna = Math.max(0, consignas.findIndex((g) => posicion >= g.desde && posicion <= g.hasta));
  const grupo = consignas[numeroConsigna];
  const pasosDelGrupo = grupo.hasta - grupo.desde + 1;
  const { estado, lectura, aprobado } = useDeteccionPractica(objetivo, !completo && !pausado, { seguirAlAprobar: true });

  // Sin micrófono no hay forma de aprobar: el alumno no puede quedar trabado en la lección
  const sinMicrofono = microfonoCaido(estado);
  const varias = consignas.length > 1;

  useEffect(() => {
    const espera = setTimeout(() => setPuedeSaltear(true), SEGUNDOS_PARA_SALTEAR * 1000);
    return () => clearTimeout(espera);
  }, []);

  // Cada acierto se festeja un momento y pasa a la siguiente consigna
  useEffect(() => {
    if (!aprobado || completo) return undefined;
    setFestejo(true);
    const espera = setTimeout(() => {
      setFestejo(false);
      if (indice + 1 >= secuencia.length) setCompleto(true);
      else setIndice(indice + 1);
    }, MS_FESTEJO);
    return () => clearTimeout(espera);
  }, [aprobado]);

  useEffect(() => {
    if (completo) onCompletar?.();
  }, [completo]);

  // En una lección, al lograrlo se termina sola (un instante después, para que se vea el acierto)
  useEffect(() => {
    // En la vista inmersiva no hay botón "Siguiente": al completar siempre sigue solo
    if (!(autoTerminar || inmersivo) || !completo) return undefined;
    const espera = setTimeout(() => onFinish(), MS_AUTO_TERMINAR);
    return () => clearTimeout(espera);
  }, [autoTerminar, inmersivo, completo]);

  // En un acorde cuerda por cuerda, el título es el acorde y el paso se aclara aparte
  // El grupo se cierra con el acorde entero, o solo con notas sueltas si el acorde viene en otra consigna
  const cierraConAcorde = secuencia[grupo.hasta].tipo === 'acorde';
  const cuerdasDelGrupo = pasosDelGrupo - (cierraConAcorde ? 1 : 0);
  const nombreDelGrupo = secuencia[grupo.hasta].nombreAcorde ?? secuencia[grupo.hasta].nombre;
  const enAcordePorCuerdas = pasosDelGrupo > 1;
  const titulo = completo
    ? (varias ? `¡Hiciste las ${consignas.length} consignas!` : `¡Sonó ${secuencia[secuencia.length - 1].nombre}!`)
    : enAcordePorCuerdas
      ? `${varias ? `Consigna ${numeroConsigna + 1} de ${consignas.length}:  ` : ''}Acorde: ${nombreDelGrupo}  •  ${posicion === grupo.hasta && cierraConAcorde ? 'ahora el acorde completo' : `cuerda ${posicion - grupo.desde + 1} de ${cuerdasDelGrupo}`}`
      : `${varias ? `Consigna ${numeroConsigna + 1} de ${consignas.length}:  ` : ''}${describir(objetivo)}`;

  const acierto = festejo || completo;
  const mastil = objetivo.tipo === 'acorde' ? (
    <GuitarNeck posiciones={objetivo.posiciones} correcto={acierto} grande={inmersivo} />
  ) : acordeDeLaNota ? (
    <GuitarNeck posiciones={acordeDeLaNota} resaltar={Number(objetivo.posiciones[0].cuerda)} correcto={acierto} grande={inmersivo} />
  ) : (
    <GuitarNeck targetNumber={objetivo.posiciones[0].traste} cuerda={objetivo.posiciones[0].cuerda} cejillas={cejillas} correcto={acierto} grande={inmersivo} />
  );

  if (inmersivo) {
    return (
      <View style={styles.container}>
        <View style={styles.contenidoInmersivo}>
          <View style={styles.cabecera}>
            {varias && <Progreso total={consignas.length} actual={numeroConsigna} completo={completo} />}
            <View style={[styles.insignia, acierto && styles.insigniaBien]} accessibilityLabel={completo ? 'Listo' : `Tocá ${nombreDelGrupo}`}>
              <Text style={[styles.insigniaTexto, acierto && styles.insigniaTextoBien]} numberOfLines={1}>{completo ? '¡Listo!' : nombreDelGrupo}</Text>
            </View>
            {enAcordePorCuerdas && !completo && <Progreso total={pasosDelGrupo} actual={posicion - grupo.desde} etiqueta="Paso" />}
          </View>
          {mastil}
          <EstadoDeteccion objetivo={objetivo} estado={estado} lectura={lectura} aprobado={acierto} compacto />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {varias && <Progreso total={consignas.length} actual={numeroConsigna} completo={completo} />}
        <Text style={styles.consigna} numberOfLines={1}>{titulo}</Text>
        {mastil}
        <EstadoDeteccion objetivo={objetivo} estado={estado} lectura={lectura} aprobado={acierto} />
      </View>

      <View style={styles.btnRow}>
        {onBack ? <Button title={textoAtras} icono="volver" variant="secondary" onPress={onBack} style={styles.btnHalf} /> : null}
        {/* En una fila no entran tres botones, y "Terminar" no sirve hasta completar todas las consignas */}
        {permitirSaltear && !completo && (puedeSaltear || sinMicrofono) ? (
          <Button
            title="Saltear (sin XP)"
            variant="secondary"
            onPress={() => onFinish({ omitida: true })}
            loading={finishing}
            style={styles.btnHalf}
          />
        ) : (
          <Button
            title={textoFinal}
            onPress={() => onFinish()}
            loading={finishing && completo}
            disabled={!completo}
            style={[styles.btnHalf, styles.btnTerminar]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  consigna: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  progreso: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  contenidoInmersivo: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', gap: 6 },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  insignia: { minWidth: 96, paddingHorizontal: 22, paddingVertical: 6, borderRadius: 22, alignItems: 'center', backgroundColor: '#4c52d9', borderWidth: 2.5, borderColor: '#d9dcff' },
  insigniaBien: { backgroundColor: '#a3fba3', borderColor: '#eafff0' },
  insigniaTexto: { color: '#fff', fontSize: 24, fontWeight: '800' },
  insigniaTextoBien: { color: '#10300f' },
  punto: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.25)' },
  puntoHecho: { backgroundColor: '#2fbf5b' },
  puntoActual: { backgroundColor: '#fff' },
  btnRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', gap: 15, paddingTop: 4 },
  btnHalf: { flex: 1 },
  btnTerminar: { backgroundColor: '#4c52d9' },
});
