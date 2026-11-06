// Archivo: src/screens/GruposScreen.js
// Catálogo fijo de grupos. Todavía no hay backend de grupos, así que los grupos elegidos
// se guardan en el dispositivo, por perfil, y no se comparten con otros usuarios.
import { useContext, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from '../components/Background';
import { Button } from '../components/Button';
import { ScreenHeader } from '../components/ScreenHeader';
import { AuthContext } from '../context/AuthContext';

const GRUPOS = [
  { id: 'principiantes', icono: '🌱', nombre: 'Primeros acordes', descripcion: 'Para quienes recién empiezan con la guitarra.' },
  { id: 'fogon', icono: '🔥', nombre: 'Ritmo de fogón', descripcion: 'Rasgueos y canciones para tocar con amigos.' },
  { id: 'rock', icono: '🎸', nombre: 'Rock y riffs', descripcion: 'Riffs clásicos, power chords y mucha distorsión.' },
  { id: 'folklore', icono: '🪕', nombre: 'Folklore', descripcion: 'Zambas, chacareras y ritmos de nuestra tierra.' },
  { id: 'teoria', icono: '🎼', nombre: 'Teoría musical', descripcion: 'Escalas, armonía y cómo funciona la música.' },
  { id: 'constancia', icono: '📅', nombre: 'Práctica diaria', descripcion: 'Para sostener la racha y practicar todos los días.' },
];

export function GruposScreen() {
  const insets = useSafeAreaInsets();
  const { perfil } = useContext(AuthContext);
  const [unidos, setUnidos] = useState([]);
  const clave = `gruposUnidos:${perfil?.id}`;

  useEffect(() => {
    let cancelado = false;
    AsyncStorage.getItem(clave)
      .then((guardado) => {
        if (!cancelado && guardado) setUnidos(JSON.parse(guardado));
      })
      .catch((error) => console.log('Error leyendo grupos:', error));
    return () => { cancelado = true; };
  }, [clave]);

  const alternarGrupo = (id) => {
    const nuevos = unidos.includes(id) ? unidos.filter((g) => g !== id) : [...unidos, id];
    setUnidos(nuevos);
    AsyncStorage.setItem(clave, JSON.stringify(nuevos)).catch((error) => console.log('Error guardando grupos:', error));
  };

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
        <ScreenHeader title="Grupos" />
        <Text style={styles.subtitulo}>Elegí los grupos que te interesan. El chat con otros músicos llegará próximamente.</Text>

        <ScrollView contentContainerStyle={styles.grid}>
          {GRUPOS.map((grupo) => {
            const unido = unidos.includes(grupo.id);
            return (
              <View key={grupo.id} style={[styles.card, unido && styles.cardUnido]}>
                <Text style={styles.icono}>{grupo.icono}</Text>
                <Text style={styles.nombre}>{grupo.nombre}</Text>
                <Text style={styles.descripcion}>{grupo.descripcion}</Text>
                <Button
                  title={unido ? 'Salir' : 'Unirme'}
                  variant={unido ? 'secondary' : 'primary'}
                  onPress={() => alternarGrupo(grupo.id)}
                />
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  subtitulo: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 20 },
  card: { flexGrow: 1, flexBasis: 220, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  cardUnido: { backgroundColor: 'rgba(178,140,255,0.15)', borderColor: '#b28cff' },
  icono: { fontSize: 32, marginBottom: 6 },
  nombre: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  descripcion: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 6, minHeight: 36 },
});
