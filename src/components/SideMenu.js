import { useEffect, useRef, useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = 280;

export function SideMenu({ visible, onClose, perfil, navigation }) {
  // Extraemos la función de logout y la cuenta directamente del contexto global
  const { logout, userData: cuenta } = useContext(AuthContext);
  
  // Animación nativa de React
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsRendering(true);
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 250, useNativeDriver: true }).start(() => {
        setIsRendering(false);
      });
    }
  }, [visible]);

  // Si no está visible y ya terminó la animación, no lo renderizamos para no tapar la pantalla
  if (!isRendering) return null;

  const nombreMostrar = perfil ? perfil.nombre : cuenta?.email?.split('@')[0] || 'Usuario';
  const inicial = nombreMostrar.charAt(0).toUpperCase();

  const handleLogout = async () => {
    onClose();
    await logout(); // El contexto limpia el storage y AppNavigator reacciona solo
  };

  const handleCambiarPerfil = () => {
    onClose();
    navigation.replace('SelectUser'); // Ya no pasamos la cuenta ni el token por parámetro
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Fondo oscuro semi-transparente que cierra el menú si tocás afuera */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* El Panel del Menú que se desliza */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        
        {/* ENCABEZADO */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}><Text style={styles.avatarText}>{inicial}</Text></View>
          <View style={styles.profileTextWrapper}>
            <Text style={styles.profileName} numberOfLines={1}>{nombreMostrar}</Text>
            {perfil && <Text style={styles.usernameText}>@{perfil.username}</Text>}
          </View>
        </View>

        {/* LISTA DE OPCIONES */}
        <View style={styles.menuItems}>
          <TouchableOpacity style={styles.activeMenuItem} onPress={onClose}>
            <Text style={styles.activeMenuText}>🎸 Mis Cursos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => alert('Próximamente')}>
            <Text style={styles.menuItemText}>🏆 Ranking</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => alert('Próximamente')}>
            <Text style={styles.menuItemText}>⚙️ Mi Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* BOTONES DE ABAJO */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerBtn} onPress={handleCambiarPerfil}>
            <Text style={styles.footerBtnText}>👥 Cambiar Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.footerBtn, styles.logoutBtn]} onPress={handleLogout}>
            <Text style={styles.footerBtnText}>🚪 Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  drawer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: DRAWER_WIDTH, backgroundColor: '#151528', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.1)' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', marginBottom: 15 },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#b28cff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarText: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
  profileTextWrapper: { marginLeft: 15, flex: 1 },
  profileName: { fontSize: 18, color: '#fff', fontWeight: 'bold', fontFamily: 'serif' },
  usernameText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  menuItems: { flex: 1, paddingHorizontal: 15 },
  menuItem: { paddingVertical: 15, paddingHorizontal: 10, marginBottom: 5 },
  activeMenuItem: { paddingVertical: 15, paddingHorizontal: 10, marginBottom: 5, backgroundColor: 'rgba(178, 140, 255, 0.1)', borderRadius: 10 },
  menuItemText: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 'bold' },
  activeMenuText: { color: '#b28cff', fontSize: 16, fontWeight: 'bold' },
  footer: { padding: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', gap: 10 },
  footerBtn: { width: '100%', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  logoutBtn: { backgroundColor: 'rgba(226, 85, 106, 0.2)' },
  footerBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});