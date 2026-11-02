import { TouchableOpacity, Text, StyleSheet } from 'react-native';


export function SubMenuItem({ title, icon, isActive, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.activeContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.text, isActive && styles.activeText]} numberOfLines={2}>{title}</Text>
    </TouchableOpacity>
  );
}


const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 12, borderRadius: 8, marginRight: 10 },
  activeContainer: { backgroundColor: 'rgba(178, 140, 255, 0.12)' },
  icon: { fontSize: 15, width: 24 },
  text: { color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '500', flexShrink: 1 },
  activeText: { color: '#b28cff', fontWeight: 'bold' }
});
