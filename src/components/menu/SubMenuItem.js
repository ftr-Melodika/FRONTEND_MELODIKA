import { Text, TouchableOpacity, StyleSheet } from 'react-native';

export function SubMenuItem({ title, onPress }) {
  return (
    <TouchableOpacity style={styles.subMenuItem} onPress={onPress}>
      <Text style={styles.subMenuItemText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  subMenuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15 },
  subMenuItemText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
});