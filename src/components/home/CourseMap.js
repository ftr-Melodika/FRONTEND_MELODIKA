// Archivo: src/components/home/CourseMap.js
import { Icono } from '../icono/Icono';
import { useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const ANCHO_NODO = 200;
const TAMANO_CIRCULO = 80;
const PADDING_MAPA = 40;

export function CourseMap({ lecciones, onLeccionPress }) {
  const scrollRef = useRef(null);
  const [anchoVisible, setAnchoVisible] = useState(0);
  // Si hay pocas lecciones, los nodos se agrandan para llenar el ancho; si hay muchas, se hace scroll
  const calcularAnchoNodo = (ancho) => Math.max(ANCHO_NODO, (ancho - PADDING_MAPA * 2) / Math.max(lecciones.length, 1));
  const anchoNodo = calcularAnchoNodo(anchoVisible);
  // La lección "actual" es la primera disponible: la resaltamos y hacemos scroll hasta ella
  const indiceActual = lecciones.findIndex((l) => l.estado === 'disponible');

  const handleLayout = (ancho) => {
    setAnchoVisible(ancho);
    if (indiceActual <= 0 || !scrollRef.current) return;
    const nodo = calcularAnchoNodo(ancho);
    const x = PADDING_MAPA + indiceActual * nodo + nodo / 2 - ancho / 2;
    scrollRef.current.scrollTo({ x: Math.max(0, x), animated: false });
  };

  return (
    <View style={styles.mapSection} onLayout={(e) => handleLayout(e.nativeEvent.layout.width)}>
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
            <View key={leccion.id} style={[styles.nodeContainer, { width: anchoNodo }]}>
              {/* Línea hacia el siguiente nodo (violeta si ya avanzaste por ahí) */}
              {index < lecciones.length - 1 && (
                <View style={[styles.horizontalConnector, { left: anchoNodo / 2, width: anchoNodo }, siguienteCompletada && styles.connectorHecho]} />
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
                <Icono nombre={leccion.estado === 'completada' ? 'check' : leccion.estado === 'disponible' ? 'guitarra' : 'candado'} tamano={36} />
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
  scrollMapContent: { alignItems: 'center', paddingHorizontal: PADDING_MAPA, flexGrow: 1 },
  nodeContainer: { alignItems: 'center', paddingVertical: 10 },
  // Arranca en el centro de este círculo y llega al centro del siguiente
  horizontalConnector: { position: 'absolute', top: 10 + TAMANO_CIRCULO / 2 - 3, height: 6, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  connectorHecho: { backgroundColor: '#a884ff' },
  circleNode: { width: TAMANO_CIRCULO, height: TAMANO_CIRCULO, borderRadius: TAMANO_CIRCULO / 2, justifyContent: 'center', alignItems: 'center', borderWidth: 3 },
  nodeCompletado: { backgroundColor: '#a884ff', borderColor: '#fff' },
  nodeDisponible: { backgroundColor: '#4c52d9', borderColor: '#b28cff' },
  nodeBloqueado: { backgroundColor: '#5b5294', borderColor: 'rgba(255, 255, 255, 0.3)' },
  nodeActual: { borderColor: '#fff', borderWidth: 4, shadowColor: '#b28cff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 12, elevation: 10 },
  nodeCard: { marginTop: 12, width: 160, minHeight: 58, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  nodeCardActual: { borderColor: '#b28cff', backgroundColor: 'rgba(178, 140, 255, 0.18)' },
  nodeTitle: { color: '#fff', fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  nodeSubtitle: { color: 'rgba(255, 255, 255, 0.65)', fontSize: 11, marginTop: 4 },
});
