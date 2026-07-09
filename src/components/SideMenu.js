import { useEffect, useRef, useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TouchableWithoutFeedback, ScrollView, Alert, Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';
const DRAWER_WIDTH = 300; 

export function SideMenu({ visible, onClose, perfil, navigation }) {
  // Extraemos la función de logout directamente del contexto global
  const { logout } = useContext(AuthContext);
  
  // Animación nativa de React
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const [isRendering, setIsRendering] = useState(false);

  // 📂 ESTADOS PARA EXPANDIR/COLAPSAR SECCIONES
  const [perfilOpen, setPerfilOpen] = useState(false);
  const [seguimientoOpen, setSeguimientoOpen] = useState(false);
  const [comunidadOpen, setComunidadOpen] = useState(false);
  const [soporteOpen, setSoporteOpen] = useState(false);

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

  if (!isRendering) return null;

  // 👤 OBTENCIÓN DE DATOS REALES DEL PERFIL (DE LA BASE DE DATOS)
  const nombreMostrar = perfil?.nombre || 'Usuario';
  const usernameMostrar = perfil?.username ? `@${perfil.username}` : '@usuario_melodika';
  
  // Si el perfil tiene avatar_url en la DB lo usa, sino carga un lindo avatar genérico por defecto
  const fotoPerfilUri = perfil?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

  const handleProximamente = (nombreItem) => {
    Alert.alert('Melodika', `${nombreItem} estará disponible próximamente.`);
  };

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
      {/* Fondo oscuro para cerrar al tocar afuera */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Panel Lateral del Menú */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        
        {/* ENCABEZADO DE USUARIO (Con foto a la izquierda y username real de la DB) */}
        <View style={styles.profileHeader}>
          <Image 
            source={{ uri: fotoPerfilUri }} 
            style={styles.avatarImage} 
          />
          <View style={styles.profileTextWrapper}>
            <Text style={styles.profileName} numberOfLines={1}>{nombreMostrar}</Text>
            <Text style={styles.usernameText} numberOfLines={1}>{usernameMostrar}</Text>
          </View>
        </View>

        {/* LISTADO DE ITEMS CON SUBMENÚS DESPLEGABLES */}
        <ScrollView showsVerticalScrollIndicator={false} style={styles.menuScroll}>
          
          {/* 👤 SECCIÓN: PERFIL */}
          <TouchableOpacity style={styles.menuItem} onPress={() => setPerfilOpen(!perfilOpen)}>
            <Text style={styles.menuItemText}>👤 Perfil</Text>
            <Text style={styles.arrowIcon}>{perfilOpen ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          
          {perfilOpen && (
            <View style={styles.subItemsContainer}>
              <TouchableOpacity style={styles.subMenuItem} onPress={() => handleProximamente('Configuración')}>
                <Text style={styles.subMenuItemText}>⚙️ Configuración</Text>
              </TouchableOpacity>

              {/* 📈 SUB-SECCIÓN: SEGUIMIENTO DE USUARIO */}
              <TouchableOpacity style={styles.subMenuItem} onPress={() => setSeguimientoOpen(!seguimientoOpen)}>
                <Text style={styles.subMenuItemText}>📈 Seguimiento de usuario</Text>
                <Text style={styles.arrowIconSub}>{seguimientoOpen ? '▼' : '▶'}</Text>
              </TouchableOpacity>

              {seguimientoOpen && (
                <View style={styles.subSubItemsContainer}>
                  <TouchableOpacity style={styles.subMenuItem} onPress={() => handleProximamente('Logros y recompensas')}>
                    <Text style={styles.subMenuItemText}>🏅 Logros y recompensas</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.subMenuItem} onPress={() => handleProximamente('Progreso')}>
                    <Text style={styles.subMenuItemText}>📊 Progreso</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.subMenuItem} onPress={() => handleProximamente('Ranking')}>
                    <Text style={styles.subMenuItemText}>🏆 Ranking</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* 🎸 ITEM: CURSOS */}
          <TouchableOpacity 
            style={[styles.menuItem, styles.activeItem]} 
            onPress={() => { onClose(); navigation.navigate('Home'); }}
          >
            <Text style={[styles.menuItemText, styles.activeItemText]}>🎸 Cursos</Text>
          </TouchableOpacity>

          {/* 🎹 ITEM: PRÁCTICA */}
          <TouchableOpacity style={styles.menuItem} onPress={() => handleProximamente('Práctica')}>
            <Text style={styles.menuItemText}>🎹 Práctica</Text>
          </TouchableOpacity>

          {/* 👥 SECCIÓN: COMUNIDAD */}
          <TouchableOpacity style={styles.menuItem} onPress={() => setComunidadOpen(!comunidadOpen)}>
            <Text style={styles.menuItemText}>👥 Comunidad</Text>
            <Text style={styles.arrowIcon}>{comunidadOpen ? '▼' : '▶'}</Text>
          </TouchableOpacity>

          {comunidadOpen && (
            <View style={styles.subItemsContainer}>
              <TouchableOpacity style={styles.subMenuItem} onPress={() => handleProximamente('Dar feedback')}>
                <Text style={styles.subMenuItemText}>💬 Dar feedback</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subMenuItem} onPress={() => handleProximamente('Grupos')}>
                <Text style={styles.subMenuItemText}>🤝 Grupos</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 🛠️ SECCIÓN: SOPORTE */}
          <TouchableOpacity style={styles.menuItem} onPress={() => setSoporteOpen(!soporteOpen)}>
            <Text style={styles.menuItemText}>🛠️ Soporte</Text>
            <Text style={styles.arrowIcon}>{soporteOpen ? '▼' : '▶'}</Text>
          </TouchableOpacity>

          {soporteOpen && (
            <View style={styles.subItemsContainer}>
              <TouchableOpacity style={styles.subMenuItem} onPress={() => handleProximamente('Preguntas frecuentes')}>
                <Text style={styles.subMenuItemText}>❓ Preguntas frecuentes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subMenuItem} onPress={() => handleProximamente('Reportar errores')}>
                <Text style={styles.subMenuItemText}>🪲 Reportar errores</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subMenuItem} onPress={() => handleProximamente('Contacto')}>
                <Text style={styles.subMenuItemText}>📞 Contacto</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>

        {/* PIE DE PÁGINA (Acciones) */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerBtn} onPress={handleCambiarPerfil}>
            <Text style={styles.footerBtnText}>🔄 Cambiar Perfil</Text>
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
  
  // MODIFICADO: Estilos del Header para incluir el componente de Imagen real
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', marginBottom: 15 },
  avatarImage: { width: 52, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#fff', backgroundColor: '#333' },
  profileTextWrapper: { marginLeft: 12, flex: 1 },
  profileName: { fontSize: 16, color: '#fff', fontWeight: 'bold', fontFamily: 'serif' },
  usernameText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  
  menuScroll: { flex: 1 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  menuItemText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '700' },
  arrowIcon: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  
  activeItem: { backgroundColor: 'rgba(178, 140, 255, 0.12)' },
  activeItemText: { color: '#b28cff' },

  subItemsContainer: { backgroundColor: 'rgba(0, 0, 0, 0.2)', paddingLeft: 15 },
  subMenuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15 },
  subMenuItemText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  arrowIconSub: { color: 'rgba(255,255,255,0.3)', fontSize: 10 },
  
  subSubItemsContainer: { backgroundColor: 'rgba(0, 0, 0, 0.15)', paddingLeft: 15 },

  footer: { padding: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', gap: 8, backgroundColor: '#131324' },
  footerBtn: { width: '100%', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)' },
  logoutBtn: { backgroundColor: 'rgba(226, 85, 106, 0.15)' },
  footerBtnText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
});