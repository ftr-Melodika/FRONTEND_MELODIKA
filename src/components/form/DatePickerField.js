// Archivo: src/components/form/DatePickerField.js
import { useState } from 'react';
import { View, Platform, TouchableOpacity, Text, StyleSheet, Modal, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SelectField } from '../SelectField';

// initialValue (opcional): fecha inicial en formato AAAA-MM-DD, para pantallas de edición
function parsearISO(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function DatePickerField({ onDateChange, initialValue }) {
  const fechaInicial = parsearISO(initialValue);
  const [date, setDate] = useState(fechaInicial || new Date(2008, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthdayLabel, setBirthdayLabel] = useState(
    fechaInicial
      ? `${String(fechaInicial.getDate()).padStart(2, '0')}/${String(fechaInicial.getMonth() + 1).padStart(2, '0')}/${fechaInicial.getFullYear()}`
      : 'Seleccionar fecha de nacimiento'
  );

  // Muestra la fecha elegida (DD/MM/AAAA) y se la avisa al formulario (AAAA-MM-DD)
  const confirmarFecha = (fecha) => {
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    setBirthdayLabel(`${dia}/${mes}/${anio}`);
    onDateChange(`${anio}-${mes}-${dia}`);
  };

  const onChangeDate = (event, selectedDate) => {
    // Android: el diálogo cierra automáticamente, manejamos setShowDatePicker aquí
    if (Platform.OS === 'android') {
      // event.type suele ser 'set' o 'dismissed'
      if (event?.type === 'dismissed') {
        setShowDatePicker(false);
        return;
      }
      if (selectedDate) {
        setDate(selectedDate);
        confirmarFecha(selectedDate);
      }
      setShowDatePicker(false);
      return;
    }

    // iOS: el picker tipo spinner emite cambios continuos. Solo actualizamos la fecha
    // localmente y esperamos a que el usuario confirme (botón "Aceptar").
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <View style={{ width: '100%' }}>
      <SelectField
        label={birthdayLabel !== 'Seleccionar fecha de nacimiento' ? birthdayLabel : 'Fecha de nacimiento'}
        value={birthdayLabel !== 'Seleccionar fecha de nacimiento' ? birthdayLabel : ''}
        onPress={() => setShowDatePicker(true)}
        isOpen={showDatePicker}
      />
      {/* Android: el diálogo del sistema */}
      {showDatePicker && Platform.OS !== 'ios' && (
        <DateTimePicker value={date} mode="date" display="default" maximumDate={new Date()} onChange={onChangeDate} />
      )}
      {/* iOS: la ruedita va en una tarjeta blanca encima del formulario. Dentro del formulario se veía
          transparente (sobre el fondo de la app, con letras oscuras que casi no se leían) */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
          supportedOrientations={['landscape', 'landscape-left', 'landscape-right', 'portrait']}
        >
          <View style={styles.iosFondo}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowDatePicker(false)} accessibilityLabel="Cancelar" />
            <View style={styles.iosTarjeta}>
              <Text style={styles.iosTitulo}>Fecha de nacimiento</Text>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={onChangeDate}
                themeVariant="light"
                textColor="#222"
                locale="es-AR"
                style={styles.iosPicker}
              />
              <View style={styles.iosActions}>
                <TouchableOpacity onPress={() => { setShowDatePicker(false); }} style={styles.iosButton}>
                  <Text style={styles.iosButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  // Confirmar selección iOS
                  confirmarFecha(date || new Date());
                  setShowDatePicker(false);
                 }} style={[styles.iosButton, styles.iosConfirm]}>
                  <Text style={[styles.iosButtonText, styles.iosConfirmText]}>Aceptar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  iosFondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  iosTarjeta: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 16, paddingTop: 12, paddingBottom: 6, paddingHorizontal: 12 },
  iosTitulo: { fontSize: 16, fontWeight: 'bold', color: '#2b2660', textAlign: 'center' },
  iosPicker: { alignSelf: 'stretch', height: 180 },
  iosActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  iosButton: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center' },
  iosButtonText: { color: '#555', fontSize: 16 },
  iosConfirm: { backgroundColor: 'transparent' },
  iosConfirmText: { color: '#7d5bd6', fontWeight: '700' }
});