import { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Icono } from './icono/Icono';

// Si es de contraseña (secureTextEntry) trae el ojito para verla u ocultarla
export function InputField({ placeholder, secureTextEntry, value, onChangeText, ...rest }) {
  const [visible, setVisible] = useState(false);
  const input = (
    <TextInput
      style={[styles.input, secureTextEntry && styles.inputConOjo]}
      placeholder={placeholder}
      placeholderTextColor="rgba(255, 255, 255, 0.7)"
      secureTextEntry={secureTextEntry && !visible}
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="none"
      autoCorrect={false}
      {...rest}
    />
  );
  if (!secureTextEntry) return input;

  return (
    <View style={styles.contenedor}>
      {input}
      <TouchableOpacity
        style={styles.ojo}
        onPress={() => setVisible((v) => !v)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        <Icono nombre={visible ? 'ojoCerrado' : 'ojo'} tamano={22} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { width: '100%', justifyContent: 'center' },
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
  inputConOjo: { paddingRight: 46 },
  ojo: { position: 'absolute', right: 12, top: 0, height: 44, justifyContent: 'center' },
});
