import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

// Variantes: primary (violeta lleno), secondary (borde blanco), danger (borde rojo), link, back
export function Button({ title, onPress, variant = 'primary', style, textStyle, loading = false, disabled = false }) {
  const isSecondary = variant === 'secondary';
  const isDanger = variant === 'danger';
  const isLink = variant === 'link';
  const isBack = variant === 'back';
  const inactivo = loading || disabled;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isSecondary && styles.buttonSecondary,
        isDanger && styles.buttonDanger,
        isLink && styles.buttonLink,
        isBack && styles.buttonBack,
        disabled && styles.buttonDisabled,
        style
      ]}
      onPress={onPress}
      disabled={inactivo} // 👈 Evita doble tap accidental
      activeOpacity={isLink ? 0.6 : 0.8}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary || isLink ? "#b28cff" : "#fff"} />
      ) : (
        <Text
          style={[
            styles.text,
            isSecondary && styles.textSecondary,
            isDanger && styles.textDanger,
            isLink && styles.textLink,
            isBack && styles.textBack,
            textStyle
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: '#b28cff', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginVertical: 8, width: '100%', minHeight: 48 },
  buttonBack: { backgroundColor: 'transparent', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 12, alignSelf: 'flex-start', marginVertical: 4, width: 'auto', minHeight: 0 },
  buttonSecondary: { backgroundColor: 'transparent', borderColor: '#fff', borderWidth: 1 },
  buttonDanger: { backgroundColor: 'transparent', borderColor: '#ff7e8d', borderWidth: 1 },
  buttonLink: { backgroundColor: 'transparent', paddingVertical: 0, paddingHorizontal: 0, marginVertical: 0, width: 'auto', minHeight: 0 },
  buttonDisabled: { opacity: 0.5 },
  text: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  textBack: { color: '#fff', fontSize: 14, fontWeight: '500' },
  textSecondary: { color: '#fff' },
  textDanger: { color: '#ff9eaa' },
  textLink: { color: '#fff', fontSize: 14, textDecorationLine: 'underline' },
});
