import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function CustomDrawerContent(props) {
  // Pescamos los datos del perfil que pasaste por navegación
  const cursoRoute = props.state.routes.find(r => r.name === 'Mis Cursos');
  const { perfil, cuenta, token } = cursoRoute?.params || {};

  const nombreMostrar = perfil ? perfil.nombre : cuenta?.email?.split('@')[0] || 'Usuario';
  const inicial = nombreMostrar.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await AsyncStorage.clear();
    props.navigation.replace('Login');
  };

  const handleCambiarPerfil = () => {
    props.navigation.replace('SelectUser', { cuenta, token });
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      
      {/* 1. LA FOTO Y EL NOMBRE ARRIBA */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{inicial}</Text>
        </View>
        <View style={styles.profileTextWrapper}>
          <Text style={styles.profileName} numberOfLines={1}>{nombreMostrar}</Text>
          {perfil && <Text style={styles.usernameText}>@{perfil.username}</Text>}
        </View>
      </View>

      {/* 2. LAS OPCIONES DEL MENÚ (Mis Cursos, Ranking, etc) */}
      <View style={styles.itemsContainer}>
        <DrawerItemList {...props} />
      </View>

      {/* 3. LOS BOTONES DE ABAJO */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={handleCambiarPerfil}>
          <Text style={styles.footerBtnText}>👥 Cambiar Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.footerBtn, styles.logoutBtn]} onPress={handleLogout}>
          <Text style={styles.footerBtnText}>🚪 Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
      
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151528' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', marginBottom: 15 },
  avatarCircle: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: '#b28cff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarText: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  profileTextWrapper: { marginLeft: 15, flex: 1 },
  profileName: { fontSize: 18, color: '#fff', fontWeight: 'bold', fontFamily: 'serif' },
  usernameText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  itemsContainer: { flex: 1, paddingHorizontal: 10 },
  footer: { padding: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', gap: 10 },
  footerBtn: { width: '100%', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  logoutBtn: { backgroundColor: 'rgba(226, 85, 106, 0.2)' },
  footerBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});