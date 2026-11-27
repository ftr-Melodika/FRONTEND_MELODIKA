// Archivo: src/screens/LogrosScreen.js
// Los logros se calculan con los datos que ya da el backend (progreso de cursos, xp, racha y
// estrellas de canciones): la lista se arma en utils/logros.js. Tocar un logro abre su detalle.
import { Icono, COLORES_ICONO } from '../components/icono/Icono';
import { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { LoadingModal } from '../components/LoadingModal';
import { ScreenHeader } from '../components/ScreenHeader';
import { DetalleLogroModal } from '../components/DetalleLogroModal';
import { AuthContext } from '../context/AuthContext';
import { useResumen, useCanciones, useEstrellasCanciones, useActualizarAlEnfocar } from '../hooks/useConsultas';
import { armarLogros } from '../utils/logros';

const ACENTO_BLOQUEADO = 'rgba(255,255,255,0.25)';

export function LogrosScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { perfil } = useContext(AuthContext);
  const consulta = useResumen(perfil?.id);
  const consultaCanciones = useCanciones();
  const consultaEstrellas = useEstrellasCanciones(perfil?.id);
  useActualizarAlEnfocar(consulta);
  useActualizarAlEnfocar(consultaEstrellas);
  const [elegido, setElegido] = useState(null);

  const logros = useMemo(
    () => armarLogros({
      resumen: consulta.data ?? null,
      perfil,
      canciones: consultaCanciones.data ?? [],
      estrellas: consultaEstrellas.data ?? {},
    }),
    [consulta.data, perfil, consultaCanciones.data, consultaEstrellas.data]
  );
  const desbloqueados = logros.filter((l) => l.conseguido).length;
  const loading = consulta.isPending;

  const irA = (pantalla) => {
    setElegido(null);
    navigation.navigate(pantalla);
  };

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20) }]}>
        <ScreenHeader title="Logros y recompensas" />
        <Text style={styles.subtitulo}>{desbloqueados} de {logros.length} logros desbloqueados · Tocá uno para ver cómo conseguirlo</Text>

        <ScrollView contentContainerStyle={styles.grid}>
          {logros.map((logro) => (
            <TouchableOpacity
              key={logro.id}
              style={[styles.card, !logro.conseguido && styles.cardBloqueada]}
              onPress={() => setElegido(logro)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${logro.titulo}, ${logro.conseguido ? 'desbloqueado' : 'bloqueado'}. Ver cómo conseguirlo`}
            >
              <Icono nombre={logro.conseguido ? logro.icono : 'candado'} tamano={40} acento={logro.conseguido ? COLORES_ICONO[logro.color] : ACENTO_BLOQUEADO} style={styles.icono} />
              <Text style={styles.titulo} numberOfLines={2}>{logro.titulo}</Text>
              <Text style={styles.descripcion}>{logro.descripcion}</Text>
              <View style={styles.barraBg}>
                <View style={[styles.barraFill, { width: `${logro.porcentaje}%` }]} />
              </View>
              <Text style={styles.contador}>{logro.actual} / {logro.meta}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <DetalleLogroModal logro={elegido} onCerrar={() => setElegido(null)} onIr={irA} />
      <LoadingModal visible={loading} text="Buscando tus logros..." />
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, width: '100%' },
  subtitulo: { color: '#fff', fontSize: 14, marginBottom: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 20 },
  card: { flexGrow: 1, flexBasis: 170, backgroundColor: 'rgba(178,140,255,0.15)', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#b28cff' },
  cardBloqueada: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)' },
  icono: { marginBottom: 6 },
  titulo: { color: '#fff', fontSize: 15, fontWeight: 'bold', textAlign: 'center' },
  descripcion: { color: 'rgba(255,255,255,0.65)', fontSize: 12, textAlign: 'center', marginTop: 4, minHeight: 32 },
  barraBg: { width: '100%', height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.35)', marginTop: 8, overflow: 'hidden' },
  barraFill: { height: '100%', backgroundColor: '#a3fba3' },
  contador: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 },
});
