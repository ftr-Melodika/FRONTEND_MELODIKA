// Archivo: src/components/home/CourseMap.js
import { useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const ANCHO_NODO = 200;
const TAMANO_CIRCULO = 80;

export function CourseMap({ lecciones, onLeccionPress }) {
  const scrollRef = useRef(null);
  // La lección "actual" es la primera disponible: la resaltamos y hacemos scroll hasta ella
  const indiceActual = lecciones.findIndex((l) => l.estado === 'disponible');

  const scrollAActual = (anchoVisible) => {
    if (indiceActual <= 0 || !scrollRef.current) return;
    const x = 40 + indiceActual * ANCHO_NODO + ANCHO_NODO / 2 - anchoVisible / 2;
    scrollRef.current.scrollTo({ x: Math.max(0, x), animated: false });
  };

  return (
    <View style={styles.mapSection} onLayout={(e) => scrollAActual(e.nativeEvent.layout.width)}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollMapContent}
      >
        {lecciones.map((leccion, index) => {
          const esActual = index === indiceActual;
          const siguienteCompletada = lecciones[index + 1] && leccion.estado === 'completada';
          return (
            <View key={leccion.id} style={styles.nodeContainer}>
              {/* Línea hacia el siguiente nodo (violeta si ya avanzaste por ahí) */}
              {index < lecciones.length - 1 && (
                <View style={[styles.horizontalConnector, siguienteCompletada && styles.connectorHecho]} />
              )}

              <TouchableOpacity
                style={[
                  styles.circleNode,
                  leccion.estado === 'completada' && styles.nodeCompletado,
                  leccion.estado === 'disponible' && styles.nodeDisponible,
                  leccion.estado === 'bloqueada' && styles.nodeBloqueado,
                  esActual && styles.nodeActual,
                ]}
                onPress={() => onLeccionPress(leccion)}
                activeOpacity={0.8}
              >
                <Text style={styles.nodeIcon}>
                  {leccion.estado === 'completada' ? '✔️' : leccion.estado === 'disponible' ? '🎸' : '🔒'}
                </Text>
              </TouchableOpacity>

              <View style={[styles.nodeCard, esActual && styles.nodeCardActual]}>
                <Text style={styles.nodeTitle} numberOfLines={2}>{leccion.titulo}</Text>
                <Text style={styles.nodeSubtitle} numberOfLines={1}>{leccion.tipo} • {leccion.xp} XP</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapSection: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', overflow: 'hidden' },
  scrollMapContent: { alignItems: 'center', paddingHorizontal: 40, flexGrow: 1 },
  nodeContainer: { alignItems: 'center', width: ANCHO_NODO, paddingVertical: 10 },
  // Arranca en el centro de este círculo y llega al centro del siguiente
  horizontalConnector: { position: 'absolute', top: 10 + TAMANO_CIRCULO / 2 - 3, left: ANCHO_NODO / 2, width: ANCHO_NODO, height: 6, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  connectorHecho: { backgroundColor: '#a884ff' },
  circleNode: { width: TAMANO_CIRCULO, height: TAMANO_CIRCULO, borderRadius: TAMANO_CIRCULO / 2, justifyContent: 'center', alignItems: 'center', borderWidth: 3 },
  nodeCompletado: { backgroundColor: '#a884ff', borderColor: '#fff' },
  nodeDisponible: { backgroundColor: '#4c52d9', borderColor: '#b28cff' },
  nodeBloqueado: { backgroundColor: '#5b5294', borderColor: 'rgba(255, 255, 255, 0.3)' },
  nodeActual: { borderColor: '#fff', borderWidth: 4, shadowColor: '#b28cff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 12, elevation: 10 },
  nodeIcon: { fontSize: 26, color: '#fff' },
  nodeCard: { marginTop: 12, width: 160, minHeight: 58, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  nodeCardActual: { borderColor: '#b28cff', backgroundColor: 'rgba(178, 140, 255, 0.18)' },
  nodeTitle: { color: '#fff', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  nodeSubtitle: { color: 'rgba(255, 255, 255, 0.65)', fontSize: 11, marginTop: 4 },
});
