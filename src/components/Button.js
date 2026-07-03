import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export function Button({ title, onPress, variant = 'primary' }) {
  // Si es un botón secundario (redes sociales), lo hacemos un poco más transparente
  const isSecondary = variant === 'secondary';

  return (
    <TouchableOpacity
      style={[styles.button, isSecondary && styles.buttonSecondary, style]}
      onPress={onPress}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 44,
    backgroundColor: '#b28cff', // Color lila del botón principal
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonSecondary: {
    backgroundColor: 'rgba(178, 140, 255, 0.6)', // Más transparente para los de abajo
  },
  text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});