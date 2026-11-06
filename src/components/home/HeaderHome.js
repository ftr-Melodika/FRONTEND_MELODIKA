import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MenuButton } from '../MenuButton';

export function HeaderHome({ perfil, cuenta, curso, puedeCambiarCurso, solicitudesPendientes = 0, onCambiarCurso, onOpenMenu, onOpenNotificaciones }) {
  // Determinamos el nombre a mostrar directamente acá
  const nombreMostrar = perfil ? perfil.nombre : cuenta?.email?.split('@')[0];
  const racha = perfil?.racha ?? 0;

  return (
    <View style={styles.topBar}>
      {/* Izquierda: menú + saludo (el saludo se recorta si no entra) */}
      <View style={styles.left}>
        <MenuButton onPress={onOpenMenu} />
        <Text style={styles.welcomeText} numberOfLines={1}>
          Hola, {nombreMostrar} 👋
        </Text>
      </View>

      {/* Centro: curso actual (se achica la letra antes de cortarse) */}
      <TouchableOpacity
        style={styles.center}
        onPress={onCambiarCurso}
        disabled={!puedeCambiarCurso}
        activeOpacity={0.7}
      >
        <Text style={styles.courseTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          🎸 {curso?.nombre || 'Guitarra'}
        </Text>
        {puedeCambiarCurso && <Text style={styles.cambiar}>Cambiar curso ▾</Text>}
      </TouchableOpacity>

      {/* Derecha: estadísticas (nunca se achican) */}
      <View style={styles.right}>
        <TouchableOpacity
          style={styles.campana}
          onPress={onOpenNotificaciones}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={solicitudesPendientes > 0 ? `Notificaciones: ${solicitudesPendientes} solicitudes pendientes` : 'Notificaciones'}
        >
          <Text style={styles.statEmoji}>🔔</Text>
          {solicitudesPendientes > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeTexto}>{solicitudesPendientes > 9 ? '9+' : solicitudesPendientes}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.statChip}>
          <Text style={styles.statEmoji}>⚡</Text>
          <Text style={styles.statText}>{perfil?.xp ?? 0} XP</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={styles.statText}>{racha} {racha === 1 ? 'día' : 'días'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', minHeight: 50, marginBottom: 10, gap: 12 },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 },
  welcomeText: { color: '#fff', fontSize: 16, fontFamily: 'serif', fontWeight: 'bold', flexShrink: 1 },
  center: { flex: 1.3, alignItems: 'center', minWidth: 0 },
  courseTitle: { color: '#b28cff', fontSize: 20, fontWeight: 'bold', fontFamily: 'serif', textAlign: 'center' },
  cambiar: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 1 },
  right: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexShrink: 0 },
  statChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, gap: 5 },
  campana: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  badge: { position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff4d67', borderWidth: 1, borderColor: '#fff' },
  badgeTexto: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  statEmoji: { fontSize: 14 },
  statText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});
