import { Icono, COLORES_ICONO } from '../icono/Icono';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MenuButton } from '../MenuButton';
import { COLORES, FUENTES } from '../../theme/tokens';

// Con `curso` muestra su nombre y un botón para volver a la lista (onVolver); sin curso, el saludo es el protagonista.
export function HeaderHome({ perfil, cuenta, curso, solicitudesPendientes = 0, onVolver, onOpenMenu, onOpenNotificaciones }) {
  const nombreMostrar = perfil ? perfil.nombre : cuenta?.email?.split('@')[0];
  const racha = perfil?.racha ?? 0;

  return (
    <View style={styles.topBar}>
      <MenuButton onPress={onOpenMenu} style={styles.menu} />

      <View style={styles.titulos}>
        {onVolver ? (
          <TouchableOpacity onPress={onVolver} activeOpacity={0.7} style={styles.volver} accessibilityRole="button" accessibilityLabel="Volver a todos los cursos">
            <Icono nombre="volver" tamano={14} color="#fff" />
            <Text style={styles.volverTexto}>Todos los cursos</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.saludo} numberOfLines={1}>Hola, {nombreMostrar}</Text>
        )}
        <Text style={styles.titulo} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {curso?.nombre || 'Tus cursos'}
        </Text>
      </View>

      <View style={styles.right}>
        <View style={styles.stat} accessibilityLabel={`${perfil?.xp ?? 0} puntos de experiencia`}>
          <Icono nombre="rayo" tamano={18} acento={COLORES_ICONO.rayo} />
          <Text style={styles.statNumero}>{perfil?.xp ?? 0}</Text>
          <Text style={styles.statUnidad}>XP</Text>
        </View>
        <View style={styles.stat} accessibilityLabel={`Racha de ${racha} ${racha === 1 ? 'día' : 'días'}`}>
          <Icono nombre="llama" tamano={18} acento={COLORES_ICONO.llama} />
          <Text style={styles.statNumero}>{racha}</Text>
          <Text style={styles.statUnidad}>{racha === 1 ? 'día' : 'días'}</Text>
        </View>
        <TouchableOpacity
          style={styles.campana}
          onPress={onOpenNotificaciones}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={solicitudesPendientes > 0 ? `Notificaciones: ${solicitudesPendientes} solicitudes pendientes` : 'Notificaciones'}
        >
          <Icono nombre="campana" tamano={20} />
          {solicitudesPendientes > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeTexto}>{solicitudesPendientes > 9 ? '9+' : solicitudesPendientes}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', minHeight: 56, marginBottom: 6, gap: 14 },
  menu: { backgroundColor: COLORES.profundo, borderColor: COLORES.linea },
  titulos: { flex: 1, minWidth: 0 },
  saludo: { color: COLORES.textoSuave, fontSize: 14, fontFamily: FUENTES.cuerpoMedio },
  titulo: { color: '#fff', fontSize: 30, lineHeight: 36, fontFamily: FUENTES.display },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 2 },
  volverTexto: { color: COLORES.textoSuave, fontSize: 14, fontFamily: FUENTES.cuerpoMedio },
  right: { flexDirection: 'row', alignItems: 'center', gap: 18, flexShrink: 0 },
  stat: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  statNumero: { color: '#fff', fontSize: 20, fontFamily: FUENTES.display },
  statUnidad: { color: COLORES.textoSuave, fontSize: 13, fontFamily: FUENTES.cuerpoMedio },
  campana: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORES.profundo, borderWidth: 1, borderColor: COLORES.linea },
  badge: { position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff4d67', borderWidth: 1.5, borderColor: COLORES.indigo },
  badgeTexto: { color: '#fff', fontSize: 10, fontFamily: FUENTES.cuerpoNegrita },
});
