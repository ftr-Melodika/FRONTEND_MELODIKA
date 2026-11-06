import { TextoConIcono, COLORES_ICONO } from '../icono/Icono';
import { View, Text, StyleSheet, Image } from 'react-native';

export function SideMenuHeader({ perfil }) {
  const nombreMostrar = perfil?.nombre || 'Usuario';
  const usernameMostrar = perfil?.username ? `@${perfil.username}` : '@usuario_melodika';
  const inicial = nombreMostrar.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      {perfil?.avatarUrl ? (
        <Image source={{ uri: perfil.avatarUrl }} style={styles.avatarImage} />
      ) : (
        <View style={[styles.avatarImage, styles.avatarInicial]}>
          <Text style={styles.inicial}>{inicial}</Text>
        </View>
      )}
      <View style={styles.textWrapper}>
        <Text style={styles.name} numberOfLines={1}>{nombreMostrar}</Text>
        <Text style={styles.username} numberOfLines={1}>{usernameMostrar}</Text>
        <View style={styles.statsFila}>
          <TextoConIcono nombre="rayo" tamano={14} acento={COLORES_ICONO.rayo} style={styles.stats}>{perfil?.xp ?? 0} XP</TextoConIcono>
          <TextoConIcono nombre="llama" tamano={14} acento={COLORES_ICONO.llama} style={styles.stats}>{perfil?.racha ?? 0}</TextoConIcono>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingTop: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#3E3876'
  },
  avatarImage: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#b28cff', backgroundColor: '#333' },
  avatarInicial: { backgroundColor: '#b28cff', justifyContent: 'center', alignItems: 'center' },
  inicial: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  textWrapper: { marginLeft: 15, flex: 1 },
  name: { fontSize: 18, color: '#fff', fontWeight: 'bold', fontFamily: 'serif' },
  username: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  statsFila: { flexDirection: 'row', gap: 12, marginTop: 4 },
  stats: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
});
