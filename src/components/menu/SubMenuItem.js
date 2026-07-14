import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export function SubMenuItem({ title, icon, isActive, onPress }) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, isActive && styles.activeText]} numberOfLines={2}>{icon}   {title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 12, paddingHorizontal: 15, borderRadius: 8 },
  text: { color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '500', flexShrink: 1, flexWrap: 'wrap' },
  activeText: { color: '#b28cff', fontWeight: 'bold' }
});