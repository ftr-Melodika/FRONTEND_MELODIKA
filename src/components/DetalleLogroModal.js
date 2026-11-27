// Archivo: src/components/DetalleLogroModal.js
// La ventanita que se abre al tocar un logro: qué hay que hacer para desbloquearlo, cuánto falta
// y un botón que lleva a la pantalla donde se consigue. No sabe nada del backend: recibe el logro armado.
import { Modal, Pressable, View, Text, StyleSheet } from 'react-native';
import { Icono, COLORES_ICONO } from './icono/Icono';
import { Button } from './Button';
import { FUENTE_TITULO } from '../theme/fuentes';

const ACENTO_BLOQUEADO = 'rgba(255,255,255,0.35)';

export function DetalleLogroModal({ logro, onCerrar, onIr }) {
  if (!logro) return null;
  const { conseguido } = logro;

  return (
    <Modal visible transparent animationType="fade" supportedOrientations={['landscape']} onRequestClose={onCerrar}>
      <Pressable style={styles.fondo} onPress={onCerrar} accessibilityLabel="Cerrar">
        {/* El Pressable de adentro evita que un toque en la tarjeta la cierre */}
        <Pressable style={styles.tarjeta} onPress={() => {}} accessibilityViewIsModal>
          <Icono
            nombre={conseguido ? logro.icono : 'candado'}
            tamano={56}
            acento={conseguido ? COLORES_ICONO[logro.color] : ACENTO_BLOQUEADO}
          />
          <View style={styles.textos}>
            <Text style={[styles.estado, conseguido && styles.estadoConseguido]}>{conseguido ? '¡Logro desbloqueado!' : 'Logro bloqueado'}</Text>
            <Text style={styles.titulo}>{logro.titulo}</Text>
            <Text style={styles.descripcion}>{logro.descripcion}</Text>

            <Text style={styles.subtitulo}>{conseguido ? 'Lo conseguiste así' : 'Cómo desbloquearlo'}</Text>
            <Text style={styles.como}>{logro.comoDesbloquear}</Text>

            <View style={styles.barraBg}>
              <View style={[styles.barraFill, { width: `${logro.porcentaje}%` }]} />
            </View>
            <Text style={styles.contador}>{logro.actual} / {logro.meta}</Text>

            <View style={styles.botones}>
              <Button title="Cerrar" variant="secondary" onPress={onCerrar} style={styles.boton} />
              {!conseguido && logro.destino && (
                <Button title={logro.destino.texto} iconoDerecha="adelante" onPress={() => onIr(logro.destino.pantalla)} style={styles.boton} />
              )}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: 'rgba(8,8,12,0.7)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  tarjeta: { flexDirection: 'row', alignItems: 'center', gap: 20, width: '100%', maxWidth: 560, backgroundColor: '#111122', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#b28cff' },
  textos: { flex: 1 },
  estadoConseguido: { color: '#a3fba3' },
  estado: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  titulo: { color: '#fff', fontSize: 22, fontFamily: FUENTE_TITULO, marginTop: 2 },
  descripcion: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
  subtitulo: { color: '#ffd35c', fontSize: 13, fontWeight: 'bold', marginTop: 12 },
  como: { color: '#fff', fontSize: 14, lineHeight: 20, marginTop: 4 },
  barraBg: { width: '100%', height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.35)', marginTop: 12, overflow: 'hidden' },
  barraFill: { height: '100%', backgroundColor: '#a3fba3' },
  contador: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 },
  botones: { flexDirection: 'row', gap: 10, marginTop: 14 },
  boton: { flex: 1, width: 'auto' },
});
