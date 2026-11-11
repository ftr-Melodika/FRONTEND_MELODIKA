// Archivo: src/components/home/CourseList.js
// Primera vista del Home: todos los cursos como tarjetas. Al tocar uno se ven sus ejercicios.
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Icono, COLORES_ICONO } from '../icono/Icono';
import { capitalizar } from '../../services/leccionesService';

// La lista de cursos del backend puede traer el avance o no: si no viene, no se muestra la barra
function avanceDe(curso) {
  const total = Number(curso.totalLecciones);
  const hechas = Number(curso.leccionesCompletadas);
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(hechas)) return null;
  return { total, hechas, porcentaje: Math.round((Math.min(hechas, total) / total) * 100) };
}

function TarjetaCurso({ curso, onPress }) {
  const bloqueado = !curso.desbloqueado;
  const avance = avanceDe(curso);
  const estado = curso.completado ? 'Completado' : bloqueado ? 'Bloqueado' : avance?.hechas ? 'En curso' : 'Disponible';

  return (
    <TouchableOpacity
      style={[styles.tarjeta, curso.completado && styles.tarjetaCompletada, bloqueado && styles.tarjetaBloqueada]}
      onPress={() => onPress(curso)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${curso.nombre}, ${estado}`}
    >
      <View style={styles.icono}>
        <Icono
          nombre={curso.completado ? 'completado' : bloqueado ? 'candado' : 'guitarra'}
          tamano={34}
          acento={curso.completado ? COLORES_ICONO.verde : undefined}
        />
      </View>
      <Text style={styles.nombre} numberOfLines={2}>{curso.nombre}</Text>
      {!!curso.nivel && <Text style={styles.nivel}>{capitalizar(curso.nivel)}</Text>}

      {avance && (
        <View style={styles.barra}>
          <View style={[styles.barraLlena, { width: `${avance.porcentaje}%` }]} />
        </View>
      )}
      <Text style={[styles.estado, curso.completado && styles.estadoCompletado]}>
        {avance ? `${avance.hechas} de ${avance.total}  •  ${estado}` : estado}
      </Text>
    </TouchableOpacity>
  );
}

export function CourseList({ cursos, onSelect }) {
  return (
    <View style={styles.seccion}>
      <Text style={styles.titulo}>Elegí un curso para ver sus ejercicios</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lista}>
        {cursos.map((curso) => (
          <TarjetaCurso key={curso.id} curso={curso} onPress={onSelect} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  seccion: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', paddingTop: 14, overflow: 'hidden' },
  titulo: { color: '#fff', fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  lista: { alignItems: 'center', paddingHorizontal: 20, gap: 16, flexGrow: 1, justifyContent: 'center' },
  tarjeta: { width: 200, minHeight: 190, borderRadius: 18, padding: 14, alignItems: 'center', backgroundColor: 'rgba(76, 82, 217, 0.55)', borderWidth: 2, borderColor: '#b28cff' },
  tarjetaCompletada: { backgroundColor: 'rgba(168, 132, 255, 0.45)', borderColor: '#fff' },
  tarjetaBloqueada: { backgroundColor: 'rgba(91, 82, 148, 0.6)', borderColor: 'rgba(255,255,255,0.3)', opacity: 0.75 },
  icono: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 8 },
  nombre: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  nivel: { color: '#fff', fontSize: 12, marginTop: 2 },
  barra: { width: '100%', height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 10, overflow: 'hidden' },
  barraLlena: { height: '100%', backgroundColor: '#a3fba3' },
  estado: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600', marginTop: 8 },
  estadoCompletado: { color: '#a3fba3' },
});
