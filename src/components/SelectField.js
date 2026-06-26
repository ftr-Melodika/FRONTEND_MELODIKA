import { Pressable, Text, StyleSheet } from 'react-native';

export function SelectField({ label, value, onPress, isOpen }) {
  return (
    <Pressable style={styles.select} onPress={onPress}>
      <Text style={[styles.label, !value && styles.placeholder]}>
        {value || label}
      </Text>
      <Text style={styles.icon}>{isOpen ? '▲' : '▼'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  select: {
    width: '100%',
    minHeight: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: '#fff',
    fontSize: 15,
  },
  placeholder: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  icon: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.87,
  },
});
