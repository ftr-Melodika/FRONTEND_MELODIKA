import { View, Text, Image, StyleSheet } from 'react-native';

export function SideMenuHeader({ perfil }) {
  // 👤 OBTENCIÓN DE DATOS REALES DEL PERFIL
  const nombreMostrar = perfil?.nombre || 'Usuario';
  const usernameMostrar = perfil?.username ? `@${perfil.username}` : '@usuario_melodika';
  const fotoPerfilUri = perfil?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

  return (
    <View style={styles.profileHeader}>
      <Image source={{ uri: fotoPerfilUri }} style={styles.avatarImage} />
      <View style={styles.profileTextWrapper}>
        <Text style={styles.profileName} numberOfLines={1}>{nombreMostrar}</Text>
        <Text style={styles.usernameText} numberOfLines={1}>{usernameMostrar}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', marginBottom: 15 },
  avatarImage: { width: 52, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#fff', backgroundColor: '#333' },
  profileTextWrapper: { marginLeft: 12, flex: 1 },
  profileName: { fontSize: 16, color: '#fff', fontWeight: 'bold', fontFamily: 'serif' },
  usernameText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
});