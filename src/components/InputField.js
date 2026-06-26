import { TextInput, StyleSheet } from 'react-native';

export function InputField({ placeholder, secureTextEntry, value, onChangeText }) {
  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="rgba(255, 255, 255, 0.7)"
      secureTextEntry={secureTextEntry}
      value={value}
      onChangeText={onChangeText}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Fondo semitransparente
    borderColor: 'rgba(255, 255, 255, 0.3)', // Borde sutil
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    color: '#fff',
    fontSize: 15,
  },
});