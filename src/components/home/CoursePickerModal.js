// Archivo: src/components/home/CoursePickerModal.js
import { Icono, COLORES_ICONO } from '../icono/Icono';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { capitalizar } from '../../services/leccionesService';

export function CoursePickerModal({ visible, cursos, cursoActualId, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} supportedOrientations={['landscape', 'portrait']}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.box}>
              <Text style={styles.title}>Elegí un curso</Text>
              <ScrollView>
                {cursos.map((curso) => {
                  const bloqueado = !curso.desbloqueado;
                  const activo = curso.id === cursoActualId;
                  return (
                    <TouchableOpacity
                      key={curso.id}
                      style={[styles.item, activo && styles.itemActivo, bloqueado && styles.itemBloqueado]}
                      onPress={() => onSelect(curso)}
                      activeOpacity={0.7}
                    >
                      <Icono nombre={curso.completado ? 'completado' : bloqueado ? 'candado' : 'guitarra'} tamano={26} acento={curso.completado ? COLORES_ICONO.verde : undefined} style={styles.itemIcon} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle}>{curso.nombre}</Text>
                        {!!curso.nivel && <Text style={styles.itemSub}>{capitalizar(curso.nivel)}</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  box: { width: '50%', maxHeight: '80%', backgroundColor: '#3E3876', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold', fontFamily: 'serif', marginBottom: 12, textAlign: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.06)' },
  itemActivo: { borderWidth: 1, borderColor: '#b28cff', backgroundColor: 'rgba(178,140,255,0.15)' },
  itemBloqueado: { opacity: 0.5 },
  itemIcon: { marginRight: 12 },
  itemTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  itemSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
});
