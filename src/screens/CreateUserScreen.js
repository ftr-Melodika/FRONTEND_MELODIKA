import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Alert, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker'; // <-- 1. IMPORTAMOS EL PICKER
import { Background } from '../components/Background';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { SelectField } from '../components/SelectField';
import { ENDPOINTS } from '../config/api';

const GENDER_OPTIONS = [
  { label: 'Masculino', value: 'Masculino' },
  { label: 'Femenino', value: 'Femenino' },
  { label: 'No binario', value: 'No binario' },
];

export function CreateUserScreen({ route, navigation }) {
  const cuenta = route.params?.cuenta;
  const token = route.params?.token || cuenta?.token || route.params?.cuenta?.token;

  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [pais, setPais] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [gender, setGender] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ESTADOS PARA LA FECHA
  const [date, setDate] = useState(new Date(2008, 1, 1)); // Fecha inicial por defecto
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthdayLabel, setBirthdayLabel] = useState('Seleccionar fecha de nacimiento'); // Lo que ve el usuario
  const [birthdayISO, setBirthdayLabelISO] = useState(''); // Lo que viaja al backend (YYYY-MM-DD)

  const dropdownAnim = useRef(new Animated.Value(0)).current;

  // 2. FUNCIÓN AL CAMBIAR LA FECHA EN EL CALENDARIO
  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false); // Ocultamos el calendario
    if (selectedDate) {
      setDate(selectedDate);
      
      // Formateamos para mostrarle al usuario (Ej: 15/07/2009)
      const dia = String(selectedDate.getDate()).padStart(2, '0');
      const mes = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const anio = selectedDate.getFullYear();
      setBirthdayLabel(`${dia}/${mes}/${anio}`);

      // Formateamos en el formato estricto que acepta Supabase (YYYY-MM-DD)
      setBirthdayLabelISO(`${anio}-${mes}-${dia}`);
    }
  };

  const handleCreateUser = async () => {
    if (!nombre.trim()) {
      return Alert.alert('Error', 'Por favor, escribí un nombre para mostrar.');
    }
    if (!username.trim()) {
      return Alert.alert('Error', 'Por favor, escribí un nombre de usuario.');
    }
    if (!birthdayISO) {
      return Alert.alert('Error', 'Por favor, seleccioná tu fecha de nacimiento.');
    }
    if (!token) {
      return Alert.alert('Error', 'No se encontró la sesión activa. Iniciá sesión de nuevo.');
    }
    if (!cuenta?.id) {
      return Alert.alert('Error', 'No se encontró el id de la cuenta. Volvé a iniciar sesión para crear el perfil.');
    }

    setLoading(true);

    try {
      const requestBody = {
        cuenta_id: cuenta?.id,
        account_id: cuenta?.id,
        nombre: nombre.trim(),
        name: nombre.trim(),
        username: username.trim(),
        user_name: username.trim(),
        fecha_nacimiento: birthdayISO, // <-- Enviamos el string seguro (YYYY-MM-DD)
        birthdate: birthdayISO,
        birthday: birthdayISO,
      };

      if (pais) {
        requestBody.pais = pais.trim();
        requestBody.country = pais.trim();
      }
      if (fotoUrl) {
        requestBody.foto = fotoUrl.trim();
        requestBody.photo = fotoUrl.trim();
        requestBody.avatar = fotoUrl.trim();
      }
      if (gender) {
        requestBody.genero = gender;
        requestBody.gender = gender;
      }

      console.log('CreateUserScreen route params:', route.params);
      console.log('Crear perfil payload:', requestBody);
      console.log('Crear perfil token:', token ? token.slice(0, 8) + '...' : 'NO_TOKEN');

      const response = await fetch(ENDPOINTS.crearPerfil, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token?.trim()}`,
        },
        body: JSON.stringify(requestBody),
      });

      const textResponse = await response.text(); // Primero leemos como texto crudo
      let data;

      try {
        data = textResponse ? JSON.parse(textResponse) : null; // Intentamos convertirlo a JSON
      } catch (e) {
        console.log('Respuesta cruda que falló:', textResponse); // Esto te dirá qué es ese HTML
        throw new Error(`El servidor respondió con un formato inesperado (${response.status}).`);
      }

      if (!response.ok) {
        const errorMessage = data?.message || data?.error || (data?.data?.message) || (Array.isArray(data?.errors) ? data.errors.map((err) => err.message || JSON.stringify(err)).join(', ') : null) || `Error al crear el perfil (${response.status})`;
        console.log('Error crear perfil detalle:', { status: response.status, data });
        throw new Error(errorMessage);
      }

      const createdProfile = data?.perfil || data?.data?.perfil || data?.data || data;
      const profileToUse = createdProfile?.perfil ? createdProfile.perfil : createdProfile;

      Alert.alert('¡Excelente!', `El perfil de ${profileToUse?.nombre || nombre.trim()} está listo para aprender.`);
      navigation.replace('Home', { cuenta: cuenta, perfil: profileToUse });

    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    const toValue = dropdownOpen ? 0 : 1;
    Animated.timing(dropdownAnim, {
      toValue,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
    setDropdownOpen(!dropdownOpen);
  };

  const selectGender = (value) => {
    setGender(value);
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.ease),
      useNativeDriver: false,
    }).start(() => setDropdownOpen(false));
  };

  return (
    <Background>
      <View style={styles.glassCard}>
        <Text style={styles.title}>Crear usuario</Text>

        <InputField
          placeholder="Nombre completo"
          value={nombre}
          onChangeText={setNombre}
        />

        <InputField
          placeholder="Nombre de usuario"
          value={username}
          onChangeText={setUsername}
        />

        <InputField
          placeholder="País"
          value={pais}
          onChangeText={setPais}
        />

        <InputField
          placeholder="Foto (URL opcional)"
          value={fotoUrl}
          onChangeText={setFotoUrl}
        />

        {/* 3. BOTÓN CRISTALINO QUE ABRE EL CALENDARIO NATIVO */}
        <TouchableOpacity 
          style={styles.datePickerButton} 
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={[styles.datePickerText, birthdayISO !== '' && styles.datePickerTextSelected]}>
            {birthdayLabel}
          </Text>
          <Text style={styles.calendarIcon}>📅</Text>
        </TouchableOpacity>

        {/* COMPONENTE OCULTO QUE SE DISPARA AL TOCAR EL BOTÓN */}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            maximumDate={new Date()} // No deja elegir fechas del futuro
            onChange={onChangeDate}
          />
        )}

        <View style={styles.selectContainer}>
          <SelectField
            label="Género (opcional)"
            value={gender}
            onPress={toggleDropdown}
            isOpen={dropdownOpen}
          />

          <Animated.View
            style={[
              styles.dropdownBox,
              {
                height: dropdownAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, GENDER_OPTIONS.length * 36],
                }),
                opacity: dropdownAnim,
              },
            ]}
          >
            {GENDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => selectGender(option.value)}
                style={styles.dropdownOption}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    option.value === gender && styles.dropdownTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>

        {loading ? (
           <ActivityIndicator size="large" color="#b28cff" style={{ marginVertical: 10 }} />
        ) : (
           <Button title="Crear usuario" onPress={handleCreateUser} />
        )}
        
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    width: '65%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 25,
    marginVertical: 15,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginTop: -8,
    marginBottom: 8,
    fontFamily: 'serif',
    fontWeight: 'bold',
  },
  // ESTILOS NUEVOS PARA COMBINAR CON EL DISEÑO DE TU COMPAÑERO
  datePickerButton: {
    width: '100%',
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  datePickerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)', // Color placeholder grisáceo inicial
  },
  datePickerTextSelected: {
    color: '#fff', // Blanco nítido cuando ya eligió fecha
    fontWeight: '500',
  },
  calendarIcon: {
    fontSize: 16,
    opacity: 0.8,
  },
  selectContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: 6,
  },
  dropdownBox: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 10,
  },
  dropdownOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  dropdownText: {
    fontSize: 13,
    color: '#333',
  },
  dropdownTextSelected: {
    color: '#6b5ce7',
    fontWeight: 'bold',
  },
});