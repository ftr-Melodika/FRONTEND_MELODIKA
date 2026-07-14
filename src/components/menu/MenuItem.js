import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export function MenuItem({ title, icon, isActive, onPress }) {
  return (
    <TouchableOpacity 
      style={[styles.container, isActive && styles.activeContainer]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.icon, isActive && styles.activeText]}>{icon}</Text>
      <Text style={[styles.text, isActive && styles.activeText]} numberOfLines={2}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 25, borderLeftWidth: 4, borderLeftColor: 'transparent' },
  activeContainer: { backgroundColor: 'rgba(178, 140, 255, 0.1)', borderLeftColor: '#b28cff' },
  icon: { fontSize: 20, marginRight: 15, color: 'rgba(255,255,255,0.7)' },
  text: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '600', flexShrink: 1, flexWrap: 'wrap' },
  activeText: { color: '#b28cff', fontWeight: 'bold' }
});