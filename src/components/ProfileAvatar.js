// Archivo: src/components/ProfileAvatar.js
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export function ProfileAvatar({ nombre, isAddButton, onPress }) {
  // Si no hay nombre (es el botón de agregar) usamos el signo +
  const inicial = nombre ? nombre.charAt(0).toUpperCase() : '+';

  return (
    <TouchableOpacity style={styles.profileWrapper} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.avatarCircle, isAddButton && styles.addCircle]}>
        <Text style={[styles.avatarText, isAddButton && styles.addIconText]}>
          {inicial}
        </Text>
      </View>
      <Text style={styles.profileName} numberOfLines={1}>
        {nombre || 'Nuevo perfil'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  profileWrapper: { alignItems: 'center', width: 100 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#b28cff', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6, marginBottom: 12 },
  addCircle: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.4)', borderStyle: 'dashed' },
  avatarText: { fontSize: 48, color: '#fff', fontWeight: 'bold' },
  addIconText: { fontSize: 54, fontWeight: '300', marginTop: -4 },
  profileName: { fontSize: 18, color: '#fff', fontWeight: '600', textAlign: 'center' },
});