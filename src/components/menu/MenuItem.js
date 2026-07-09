import { Text, TouchableOpacity, StyleSheet } from 'react-native';

export function MenuItem({ title, onPress, isActive }) {
  return (
    <TouchableOpacity 
      style={[styles.menuItem, isActive && styles.activeItem]} 
      onPress={onPress}
    >
      <Text style={[styles.menuItemText, isActive && styles.activeItemText]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  menuItemText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '700' },
  activeItem: { backgroundColor: 'rgba(178, 140, 255, 0.12)' },
  activeItemText: { color: '#b28cff' },
});