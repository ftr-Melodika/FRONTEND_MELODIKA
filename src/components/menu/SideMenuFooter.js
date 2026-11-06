import { TextoConIcono, COLORES_ICONO } from '../icono/Icono';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

export function SideMenuFooter({ onCambiarPerfil, onLogout }) {
  return (
    <View style={styles.footerContainer}>
      <TouchableOpacity style={styles.footerBtn} onPress={onCambiarPerfil}>
        <TextoConIcono nombre="cambiar" tamano={17} centrado style={styles.footerBtnText}>Cambiar Perfil</TextoConIcono>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.footerBtn, styles.footerLogoutBtn]} onPress={onLogout}>
        <TextoConIcono nombre="salir" tamano={17} color="#E2556A" acento={COLORES_ICONO.rojo} centrado style={styles.footerLogoutText}>Cerrar Sesión</TextoConIcono>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  footerBtn: { 
    width: '90%', 
    marginLeft: '5%', 
    paddingVertical: 12, 
    borderRadius: 10, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    marginBottom: 10 
  },
  footerLogoutBtn: { 
    backgroundColor: 'rgba(226, 85, 106, 0.1)', 
    marginBottom: 0 
  },
  footerBtnText: { 
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 14, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  footerLogoutText: { 
    color: '#E2556A', 
    fontSize: 14, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  }
});