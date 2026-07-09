// Archivo: src/components/form/DatePickerField.js
import { useState } from 'react';
import { View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SelectField } from '../SelectField';

export function DatePickerField({ onDateChange }) {
  const [date, setDate] = useState(new Date(2008, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthdayLabel, setBirthdayLabel] = useState('Seleccionar fecha de nacimiento');

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false); // Cerramos el calendario siempre
    if (selectedDate) {
      setDate(selectedDate);
      
      // Formateamos para mostrar en pantalla (DD/MM/YYYY)
      const dia = String(selectedDate.getDate()).padStart(2, '0');
      const mes = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const anio = selectedDate.getFullYear();
      setBirthdayLabel(`${dia}/${mes}/${anio}`);
      
      // Le mandamos al padre el formato para la base de datos (YYYY-MM-DD)
      onDateChange(`${anio}-${mes}-${dia}`); 
    }
  };

  return (
    <View style={{ width: '100%', marginBottom: 12 }}>
      <SelectField 
        label={birthdayLabel !== 'Seleccionar fecha de nacimiento' ? birthdayLabel : 'Fecha de nacimiento'} 
        value={birthdayLabel !== 'Seleccionar fecha de nacimiento' ? birthdayLabel : ''}
        onPress={() => setShowDatePicker(true)} 
        isOpen={showDatePicker} 
      />

      {showDatePicker && (
        <DateTimePicker 
          value={date} 
          mode="date" 
          display="default" 
          maximumDate={new Date()} 
          onChange={onChangeDate} 
        />
      )}
    </View>
  );
}