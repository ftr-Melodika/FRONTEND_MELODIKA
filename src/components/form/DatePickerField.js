// Archivo: src/components/form/DatePickerField.js
import { useState } from 'react';
import { View, Platform, TouchableOpacity, Text, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SelectField } from '../SelectField';

export function DatePickerField({ onDateChange }) {
  const [date, setDate] = useState(new Date(2008, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthdayLabel, setBirthdayLabel] = useState('Seleccionar fecha de nacimiento');
  
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
        const dia = String(selectedDate.getDate()).padStart(2, '0');
        const mes = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const anio = selectedDate.getFullYear();
        setBirthdayLabel(`${dia}/${mes}/${anio}`);
        onDateChange(`${anio}-${mes}-${dia}`);
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
    <View style={{ width: '100%', marginBottom: 12, position: 'relative' }}>
      <SelectField
        label={birthdayLabel !== 'Seleccionar fecha de nacimiento' ? birthdayLabel : 'Fecha de nacimiento'}
        value={birthdayLabel !== 'Seleccionar fecha de nacimiento' ? birthdayLabel : ''}
        onPress={() => setShowDatePicker(true)}
        isOpen={showDatePicker}
      />
      {showDatePicker && (
        <View>
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'} // Mejor renderizado
            maximumDate={new Date()}
            onChange={onChangeDate}
            style={{ alignSelf: 'center', backgroundColor: 'transparent' }}
          />
          {Platform.OS === 'ios' && (
            <View style={styles.iosActions}>
              <TouchableOpacity onPress={() => { setShowDatePicker(false); }} style={styles.iosButton}>
                <Text style={styles.iosButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { 
                // Confirmar selección iOS
                const selectedDate = date || new Date();
                const dia = String(selectedDate.getDate()).padStart(2, '0');
                const mes = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const anio = selectedDate.getFullYear();
                setBirthdayLabel(`${dia}/${mes}/${anio}`);
                onDateChange(`${anio}-${mes}-${dia}`);
                setShowDatePicker(false);
               }} style={[styles.iosButton, styles.iosConfirm]}>
                <Text style={[styles.iosButtonText, styles.iosConfirmText]}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  iosActions: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 8 },
  iosButton: { paddingHorizontal: 12, paddingVertical: 6 },
  iosButtonText: { color: '#fff', opacity: 0.9 },
  iosConfirm: { backgroundColor: 'transparent' },
  iosConfirmText: { color: '#b28cff', fontWeight: '600' }
});