// Archivo: src/components/Button.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export function Button({ title, onPress, variant = 'primary', style, textStyle }) {
  
  const isSecondary = variant === 'secondary';
  const isLink = variant === 'link'; // 👈 Agregamos la variante link

  return (
    <TouchableOpacity
      style={[
        styles.button, 
        isSecondary && styles.buttonSecondary, 
        isLink && styles.buttonLink, // 👈 Aplicamos estilo si es link
        style
      ]}
      onPress={onPress}
      activeOpacity={isLink ? 0.6 : 0.8}
    >
      <Text style={[
        styles.text, 
        isSecondary && styles.textSecondary, 
        isLink && styles.textLink, // 👈 Aplicamos estilo de texto si es link
        textStyle
      ]}>
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
  buttonLink: {
    backgroundColor: 'transparent', // Sin fondo
    paddingVertical: 5,             // Menos relleno
    marginVertical: 0,
    width: 'auto',                  // Que ocupe solo lo que mide el texto
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textSecondary: {
    color: '#fff',
  },
  textLink: {
    color: '#fff',
    fontSize: 14,
    textDecorationLine: 'underline', // Texto subrayado
  },
});