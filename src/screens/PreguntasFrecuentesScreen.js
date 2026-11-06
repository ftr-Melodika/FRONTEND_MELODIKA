// Archivo: src/screens/PreguntasFrecuentesScreen.js
import { Icono } from '../components/icono/Icono';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { ScreenHeader } from '../components/ScreenHeader';

const PREGUNTAS = [
  {
    pregunta: '¿Qué es Melodika?',
    respuesta: 'Melodika es una app para aprender a tocar la guitarra paso a paso: cada lección tiene un video, una explicación teórica y una práctica sobre el mástil.',
  },
  {
    pregunta: '¿Cómo desbloqueo nuevas lecciones?',
    respuesta: 'Las lecciones se desbloquean en orden. Al terminar una, se habilita la siguiente. Cuando completás todas las lecciones de un curso, se desbloquea el próximo curso.',
  },
  {
    pregunta: '¿Cómo funciona la racha?',
    respuesta: 'Cada día que completás al menos una lección, tu racha suma un día. Si pasan más de 3 días sin practicar, la racha vuelve a empezar.',
  },
  {
    pregunta: '¿Qué es la XP?',
    respuesta: 'Son puntos de experiencia que ganás al completar lecciones. Se usan para el ranking global y para desbloquear logros. Repetir una lección ya completada no suma XP de nuevo.',
  },
  {
    pregunta: '¿Puedo tener varios perfiles?',
    respuesta: 'Sí. Una cuenta puede tener varios perfiles (por ejemplo, para distintos miembros de la familia) y cada uno guarda su propio progreso. Podés administrarlos desde "Cambiar perfil".',
  },
  {
    pregunta: '¿Cómo edito o borro mi perfil?',
    respuesta: 'Desde el menú, entrá a Perfil → Configuración para editar tus datos. Para borrar un perfil, andá a "Cambiar perfil" → "Administrar perfiles" y tocá el perfil.',
  },
];

export function PreguntasFrecuentesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [abierta, setAbierta] = useState(null);

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20) }]}>
        <ScreenHeader title="Preguntas frecuentes" />
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {PREGUNTAS.map((item, i) => {
            const estaAbierta = abierta === i;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.item, estaAbierta && styles.itemAbierto]}
                onPress={() => setAbierta(estaAbierta ? null : i)}
                activeOpacity={0.8}
              >
                <View style={styles.preguntaRow}>
                  <Text style={styles.pregunta}>{item.pregunta}</Text>
                  <Icono nombre={estaAbierta ? 'arriba' : 'abajo'} tamano={16} color="rgba(255,255,255,0.6)" style={styles.flecha} />
                </View>
                {estaAbierta && <Text style={styles.respuesta}>{item.respuesta}</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, width: '100%' },
  item: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  itemAbierto: { borderColor: '#b28cff' },
  preguntaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pregunta: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1 },
  flecha: { marginLeft: 10 },
  respuesta: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 21, marginTop: 10 },
});
