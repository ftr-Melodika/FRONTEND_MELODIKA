import { View, Text, StyleSheet, Image } from 'react-native';

export function SideMenuHeader({ perfil, cuenta }) {
  const nombreMostrar = perfil?.nombre || 'Usuario';
  const usernameMostrar = perfil?.username ? `@${perfil.username}` : '@usuario_melodika';
  const fotoPerfilUri = perfil?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

  return (
    <View style={styles.container}>
      <Image source={{ uri: fotoPerfilUri }} style={styles.avatarImage} />
      <View style={styles.textWrapper}>
        <Text style={styles.name} numberOfLines={1}>{nombreMostrar}</Text>
        <Text style={styles.username} numberOfLines={1}>{usernameMostrar}</Text>
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
    backgroundColor: '#111122' // Tono sutilmente más claro que el fondo general
  },
  avatarImage: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#b28cff', backgroundColor: '#333' },
  textWrapper: { marginLeft: 15, flex: 1 },
  name: { fontSize: 18, color: '#fff', fontWeight: 'bold', fontFamily: 'serif' },
  username: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
});