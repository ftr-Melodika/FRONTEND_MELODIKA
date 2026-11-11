// Archivo: src/components/leccion/EstadoDeteccion.js
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { Button } from '../Button';

// La detección se actualiza cada 150 ms: cada mensaje debe quedar lo suficiente para poder leerlo
const MS_MINIMO_MENSAJE = 1500;

const AVISOS = {
  pausado: 'Micrófono en pausa',
  iniciando: 'Preparando el micrófono…',
  'sin-permiso': 'Melodika necesita el micrófono para escucharte.',
  'no-disponible': 'La detección de sonido solo funciona en la app del celular.',
  error: 'No se pudo usar el micrófono. Puede estar ocupado por otra app.',
};

function dondeTocar({ cuerda, traste }) {
  return traste === 0 ? `la cuerda ${cuerda} al aire` : `la cuerda ${cuerda} en el traste ${traste}`;
}

function textoDeLectura(objetivo, lectura) {
  const esAcorde = objetivo.tipo === 'acorde';
  if (lectura?.calibrando) return 'Midiendo el ruido del lugar, esperá un momento…';
  if (!lectura?.hayNota) return esAcorde ? `Rasgueá ${objetivo.nombre}` : `Tocá ${objetivo.nombre}`;
  if (lectura.correcta) return '¡Eso es, dejalo sonar!';
  if (!esAcorde) {
    // Es la nota correcta, pero de otra cuerda: decir "Suena Mi, buscá Mi" no se entendería
    if (lectura.registro) {
      return `Es ${lectura.notaDetectada}, pero más ${lectura.registro}. Tocá ${dondeTocar(objetivo.posiciones[0])}`;
    }
    // Es la nota, pero corrida: está a mitad de camino de la de al lado y no cuenta
    if (lectura.afinacion) {
      return `Casi: es ${lectura.notaDetectada}, pero suena ${lectura.afinacion}. Revisá la afinación`;
    }
    return `Suena ${lectura.notaDetectada}, buscá ${objetivo.nombre}`;
  }

  const partes = [];
  if (lectura.faltantes.length) partes.push(`Falta ${lectura.faltantes.join(', ')}`);
  if (lectura.desafinadas?.length) partes.push(`Desafinada: ${lectura.desafinadas.join(', ')}`);
  if (lectura.sobrantes.length) partes.push(`Sobra ${lectura.sobrantes.join(', ')}`);
  return partes.join('  •  ');
}

// Muestra el último mensaje recibido, pero sin cambiar antes de que pase el tiempo mínimo.
// Con `inmediato` no espera: avisar que va bien no puede llegar tarde.
function useMensajeLegible(texto, inmediato) {
  const [mostrado, setMostrado] = useState(texto);
  const mostradoDesde = useRef(Date.now());

  useEffect(() => {
    if (texto === mostrado) return undefined;
    const mostrar = () => {
      mostradoDesde.current = Date.now();
      setMostrado(texto);
    };
    const restante = MS_MINIMO_MENSAJE - (Date.now() - mostradoDesde.current);
    if (inmediato || restante <= 0) {
      mostrar();
      return undefined;
    }
    const espera = setTimeout(mostrar, restante);
    return () => clearTimeout(espera);
  }, [texto, mostrado, inmediato]);

  return mostrado;
}

export function EstadoDeteccion({ objetivo, estado, lectura, aprobado }) {
  const texto = textoDeLectura(objetivo, lectura);
  const mensaje = useMensajeLegible(texto, !lectura || lectura.calibrando || lectura.correcta);

  if (aprobado) {
    return (
      <View style={[styles.caja, styles.cajaBien]} accessibilityLiveRegion="polite">
        <Text style={styles.textoBien}>¡Correcto! Sonó {objetivo.nombre} 🎸</Text>
      </View>
    );
  }

  if (estado === 'escuchando') {
    return (
      <View style={styles.caja}>
        <Text style={styles.texto} numberOfLines={2}>🎤 {mensaje}</Text>
      </View>
    );
  }

  return <AvisoMicrofono estado={estado} />;
}

// Lo que se muestra cuando el micrófono no está escuchando
export function AvisoMicrofono({ estado }) {
  return (
    <View style={[styles.caja, styles.fila]} accessibilityLiveRegion="polite">
      <Text style={styles.textoSuave} numberOfLines={2}>{AVISOS[estado]}</Text>
      {estado === 'sin-permiso' && (
        <Button title="Abrir ajustes" variant="secondary" onPress={() => Linking.openSettings()} style={styles.boton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { width: '100%', minHeight: 36, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 6, marginBottom: 6, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.3)' },
  cajaBien: { backgroundColor: '#a3fba3' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  texto: { color: '#fff', fontSize: 15, fontWeight: 'bold', textAlign: 'center' },
  textoBien: { color: '#10300f', fontSize: 15, fontWeight: 'bold', textAlign: 'center' },
  textoSuave: { flex: 1, color: '#fff', fontSize: 14 },
  boton: { width: 140, marginVertical: 0, paddingVertical: 6 },
});
