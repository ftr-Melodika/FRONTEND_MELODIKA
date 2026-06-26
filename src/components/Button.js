import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export function Button({ title, onPress, variant = 'primary' }) {
  // Si es un botón secundario (redes sociales), lo hacemos un poco más transparente
  const isSecondary = variant === 'secondary';

  return (
    <TouchableOpacity 
      style={[styles.button, isSecondary && styles.buttonSecondary]} 
      onPress={onPress}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#b28cff', // Color lila del botón principal
    borderRadius: 25, // Bordes redondeados tipo píldora
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonSecondary: {
    backgroundColor: 'rgba(178, 140, 255, 0.6)', // Más transparente para los de abajo
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});