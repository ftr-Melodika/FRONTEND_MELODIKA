import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

// 1. Agregamos 'style' a los parámetros que recibe la función
export function Button({ title, onPress, variant = 'primary', style }) {
  
  const isSecondary = variant === 'secondary';

  return (
    <TouchableOpacity
      // 2. Ahora sí, puede usar la variable 'style' sin crashear
      style={[styles.button, isSecondary && styles.buttonSecondary, style]}
      onPress={onPress}
      activeOpacity={0.8} // Un buen toque Senior para mejorar la UX al presionar
    >
      <Text style={[styles.text, isSecondary && styles.textSecondary]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#b28cff',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderColor: '#fff',
    borderWidth: 1,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textSecondary: {
    color: '#fff',
  },
});