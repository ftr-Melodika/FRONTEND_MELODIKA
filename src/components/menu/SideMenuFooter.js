import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export function SideMenuFooter({ onCambiarPerfil, onLogout }) {
  return (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.footerBtn} onPress={onCambiarPerfil}>
        <Text style={styles.footerBtnText}>🔄 Cambiar Perfil</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.footerBtn, styles.logoutBtn]} onPress={onLogout}>
        <Text style={styles.footerBtnText}>🚪 Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { padding: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', gap: 8, backgroundColor: '#131324' },
  footerBtn: { width: '100%', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)' },
  logoutBtn: { backgroundColor: 'rgba(226, 85, 106, 0.15)' },
  footerBtnText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
});