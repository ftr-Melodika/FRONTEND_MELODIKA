import { Icono, TextoConIcono, COLORES_ICONO } from '../components/icono/Icono';
import { useCallback, useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { LoadingModal } from '../components/LoadingModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { Button } from '../components/Button';
import { AuthContext } from '../context/AuthContext';
import { leccionesService } from '../services/leccionesService';
import { FUENTE_TITULO } from '../theme/fuentes';

export function ProgresoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { perfil } = useContext(AuthContext);

  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      async function cargar() {
        if (!perfil?.id) return;
        setLoading(true);
        setError(null);
        try {
          const datos = await leccionesService.obtenerResumen(perfil.id);
          if (!cancelado) setResumen(datos);
        } catch (e) {
          if (!cancelado) setError(e.message);
        } finally {
          if (!cancelado) setLoading(false);
        }
      }
      cargar();
      return () => { cancelado = true; };
    }, [perfil?.id])
  );

  const stats = {
    xp: resumen?.xp ?? perfil?.xp ?? 0,
    racha: resumen?.racha ?? perfil?.racha ?? 0,
    leccionesCompletadas: resumen?.leccionesCompletadas ?? 0,
    totalLecciones: resumen?.totalLecciones ?? 0,
  };
  const cursoActual = resumen?.cursoActual;

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20) }]}>

        {/* HEADER */}
        <ScreenHeader title="Tu Progreso" />

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {/* CONTENIDO A DOS COLUMNAS (Ideal para formato horizontal) */}
        <View style={styles.contentRow}>

          {/* COLUMNA IZQUIERDA: Estadísticas Globales */}
          <View style={styles.statsColumn}>

            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(178, 140, 255, 0.15)' }]}>
                <Icono nombre="rayo" tamano={28} acento={COLORES_ICONO.rayo} />
              </View>
              <View style={styles.statTextWrapper}>
                <Text style={styles.statLabel}>Experiencia Total</Text>
                <Text style={styles.statValue}>{stats.xp} XP</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 165, 0, 0.15)' }]}>
                <Icono nombre="llama" tamano={28} acento={COLORES_ICONO.llama} />
              </View>
              <View style={styles.statTextWrapper}>
                <Text style={styles.statLabel}>Racha Actual</Text>
                <Text style={styles.statValue}>{stats.racha} {stats.racha === 1 ? 'Día' : 'Días'}</Text>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(50, 205, 50, 0.15)' }]}>
                <Icono nombre="completado" tamano={28} acento={COLORES_ICONO.verde} />
              </View>
              <View style={styles.statTextWrapper}>
                <Text style={styles.statLabel}>Lecciones Completadas</Text>
                <Text style={styles.statValue}>{stats.leccionesCompletadas} / {stats.totalLecciones}</Text>
              </View>
            </View>

          </View>

          {/* COLUMNA DERECHA: Curso Actual y Barra de Progreso */}
          <View style={styles.courseColumn}>
            <ScrollView style={styles.courseCard} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
              <Text style={styles.courseOverline}>CURSO ACTIVO</Text>
              <TextoConIcono nombre="guitarra" tamano={28} style={styles.courseTitle} contenedorStyle={styles.courseTitleFila}>{cursoActual?.nombre || 'Sin cursos todavía'}</TextoConIcono>

              {/* Barra de progreso */}
              <View style={styles.progressContainer}>
                <View style={styles.progressHeaderRow}>
                  <Text style={styles.progressLabel}>Progreso del curso</Text>
                  <Text style={styles.progressPercentage}>{cursoActual?.porcentaje ?? 0}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  {/* El ancho se llena dinámicamente según el porcentaje */}
                  <View style={[styles.progressBarFill, { width: `${cursoActual?.porcentaje ?? 0}%` }]} />
                </View>
              </View>

              {cursoActual?.proximaLeccion ? (
                <Text style={styles.nextLessonInfo}>
                  Próxima lección: <Text style={{ fontWeight: 'bold', color: '#fff' }}>{cursoActual.proximaLeccion}</Text>
                </Text>
              ) : cursoActual?.completado ? (
                <TextoConIcono nombre="trofeo" tamano={18} acento={COLORES_ICONO.oro} style={styles.nextLessonInfo}>¡Terminaste este curso!</TextoConIcono>
              ) : null}

              {/* Resto de los cursos */}
              {(resumen?.cursos || []).filter((c) => c.id !== cursoActual?.id).map((c) => (
                <View key={c.id} style={styles.otroCurso}>
                  <TextoConIcono
                    nombre={c.completado ? 'completado' : c.desbloqueado ? 'guitarra' : 'candado'}
                    tamano={18}
                    acento={c.completado ? COLORES_ICONO.verde : undefined}
                    contenedorStyle={styles.otroCursoFila}
                    style={styles.otroCursoNombre}
                    numberOfLines={1}
                  >
                    {c.nombre}
                  </TextoConIcono>
                  <Text style={styles.otroCursoPct}>{c.porcentaje ?? 0}%</Text>
                </View>
              ))}

              <Button title="Continuar aprendiendo" iconoDerecha="adelante" onPress={() => navigation.navigate('Home')} style={styles.continueBtn} />
            </ScrollView>
          </View>

        </View>

      </View>
      <LoadingModal visible={loading} text="Calculando tu progreso..." />
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, width: '100%' },

  errorText: { color: '#ffb3bd', marginBottom: 10 },

  // Layout principal
  contentRow: { flex: 1, flexDirection: 'row', gap: 20 },
  statsColumn: { flex: 1, justifyContent: 'space-between', paddingBottom: 10 },
  courseColumn: { flex: 1.2 },

  // Tarjetas de Estadísticas (Izquierda)
  statCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  statTextWrapper: { flex: 1 },
  statLabel: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  // Tarjeta de Curso (Derecha)
  courseCard: { flex: 1, backgroundColor: '#111122', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(178, 140, 255, 0.2)' },
  courseOverline: { color: '#fff', fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 8 },
  courseTitleFila: { marginBottom: 20 },
  courseTitle: { fontSize: 24, color: '#fff', fontFamily: FUENTE_TITULO, fontWeight: 'bold' },

  progressContainer: { marginBottom: 25 },
  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, fontWeight: '600' },
  progressPercentage: { color: '#a3fba3', fontSize: 16, fontWeight: 'bold' },
  progressBarBg: { height: 12, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#b28cff', borderRadius: 6 },

  nextLessonInfo: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, marginBottom: 20 },
  otroCurso: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  otroCursoFila: { flex: 1 },
  otroCursoNombre: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  otroCursoPct: { color: '#a3fba3', fontSize: 14, fontWeight: 'bold', marginLeft: 10 },
  continueBtn: { marginTop: 16 },
});
