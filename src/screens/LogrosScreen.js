// Archivo: src/screens/LogrosScreen.js
// Los logros se calculan con los datos de progreso que ya da el backend (xp, racha, lecciones, cursos).
import { useCallback, useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { LoadingModal } from '../components/LoadingModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { AuthContext } from '../context/AuthContext';
import { leccionesService } from '../services/leccionesService';

// Cada logro dice qué dato mira y cuánto hace falta para desbloquearlo
const LOGROS = [
  { id: 'primera', icono: '🎸', titulo: 'Primeros acordes', descripcion: 'Completá tu primera lección', dato: 'lecciones', meta: 1 },
  { id: 'cinco', icono: '🎶', titulo: 'Tomando ritmo', descripcion: 'Completá 5 lecciones', dato: 'lecciones', meta: 5 },
  { id: 'diez', icono: '🎼', titulo: 'Músico dedicado', descripcion: 'Completá 10 lecciones', dato: 'lecciones', meta: 10 },
  { id: 'curso', icono: '🏆', titulo: 'Graduado', descripcion: 'Terminá un curso completo', dato: 'cursos', meta: 1 },
  { id: 'racha3', icono: '🔥', titulo: 'En llamas', descripcion: 'Llegá a una racha de 3 días', dato: 'racha', meta: 3 },
  { id: 'racha7', icono: '☄️', titulo: 'Imparable', descripcion: 'Llegá a una racha de 7 días', dato: 'racha', meta: 7 },
  { id: 'xp100', icono: '⚡', titulo: 'Aprendiz', descripcion: 'Juntá 100 XP', dato: 'xp', meta: 100 },
  { id: 'xp500', icono: '💎', titulo: 'Virtuoso', descripcion: 'Juntá 500 XP', dato: 'xp', meta: 500 },
];

export function LogrosScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { perfil } = useContext(AuthContext);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      (async () => {
        if (!perfil?.id) return;
        setLoading(true);
        try {
          const datos = await leccionesService.obtenerResumen(perfil.id);
          if (!cancelado) setResumen(datos);
        } catch (e) {
          console.log('Error cargando logros:', e.message);
        } finally {
          if (!cancelado) setLoading(false);
        }
      })();
      return () => { cancelado = true; };
    }, [perfil?.id])
  );

  const valores = {
    lecciones: resumen?.leccionesCompletadas ?? 0,
    cursos: resumen?.cursosCompletados ?? 0,
    racha: resumen?.racha ?? perfil?.racha ?? 0,
    xp: resumen?.xp ?? perfil?.xp ?? 0,
  };
  const desbloqueados = LOGROS.filter((l) => valores[l.dato] >= l.meta).length;

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20) }]}>
        <ScreenHeader title="Logros y recompensas" />
        <Text style={styles.subtitulo}>{desbloqueados} de {LOGROS.length} logros desbloqueados</Text>

        <ScrollView contentContainerStyle={styles.grid}>
          {LOGROS.map((logro) => {
            const actual = valores[logro.dato];
            const conseguido = actual >= logro.meta;
            const pct = Math.min(100, Math.round((actual / logro.meta) * 100));
            return (
              <View key={logro.id} style={[styles.card, !conseguido && styles.cardBloqueada]}>
                <Text style={styles.icono}>{conseguido ? logro.icono : '🔒'}</Text>
                <Text style={styles.titulo}>{logro.titulo}</Text>
                <Text style={styles.descripcion}>{logro.descripcion}</Text>
                <View style={styles.barraBg}>
                  <View style={[styles.barraFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.contador}>{Math.min(actual, logro.meta)} / {logro.meta}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
      <LoadingModal visible={loading} text="Buscando tus logros..." />
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, width: '100%' },
  subtitulo: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 20 },
  card: { width: 170, backgroundColor: 'rgba(178,140,255,0.15)', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#b28cff' },
  cardBloqueada: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)' },
  icono: { fontSize: 32, marginBottom: 6 },
  titulo: { color: '#fff', fontSize: 15, fontWeight: 'bold', textAlign: 'center' },
  descripcion: { color: 'rgba(255,255,255,0.65)', fontSize: 12, textAlign: 'center', marginTop: 4, minHeight: 32 },
  barraBg: { width: '100%', height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.35)', marginTop: 8, overflow: 'hidden' },
  barraFill: { height: '100%', backgroundColor: '#a3fba3' },
  contador: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 },
});
