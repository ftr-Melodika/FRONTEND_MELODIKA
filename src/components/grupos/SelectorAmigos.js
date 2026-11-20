// Archivo: src/components/grupos/SelectorAmigos.js
// Lista de amigos (A-Z) con buscador en vivo y selección múltiple.
// El buscador solo filtra lo que se ve: las selecciones viven en el padre y no se pierden.
import { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { InputField } from '../InputField';
import { AvatarUsuario } from '../AvatarUsuario';
import { Checkbox } from '../form/Checkbox';
import { filtrarAmigos, ordenarAmigos } from '../../utils/amigos';

export function SelectorAmigos({ amigos, seleccionados, onAlternar }) {
  const [texto, setTexto] = useState('');

  const ordenados = useMemo(() => ordenarAmigos(amigos), [amigos]);
  const visibles = useMemo(() => filtrarAmigos(ordenados, texto), [ordenados, texto]);

  return (
    <View style={styles.contenedor}>
      <InputField
        placeholder="Buscar entre tus amigos"
        value={texto}
        onChangeText={setTexto}
        returnKeyType="search"
      />
      <Text style={styles.contador}>
        {seleccionados.size} {seleccionados.size === 1 ? 'seleccionado' : 'seleccionados'}
      </Text>

      {ordenados.length === 0 ? (
        <Text style={styles.vacio}>Todavía no tenés amigos para agregar. Podés crear el grupo igual y sumar gente después.</Text>
      ) : visibles.length === 0 ? (
        <Text style={styles.vacio}>Ningún amigo coincide con “{texto.trim()}”.</Text>
      ) : (
        <FlatList
          data={visibles}
          keyExtractor={(item) => String(item.perfil.id)}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const { id, nombre, username, avatarUrl } = item.perfil;
            const marcado = seleccionados.has(id);
            return (
              <TouchableOpacity
                style={[styles.fila, marcado && styles.filaMarcada]}
                onPress={() => onAlternar(id)}
                activeOpacity={0.7}
              >
                <AvatarUsuario nombre={nombre} foto={avatarUrl} />
                <View style={styles.textos}>
                  <Text style={styles.nombre} numberOfLines={1}>{nombre}</Text>
                  <Text style={styles.username} numberOfLines={1}>@{username}</Text>
                </View>
                {/* pointerEvents none: el toque lo resuelve la fila entera */}
                <View pointerEvents="none">
                  <Checkbox checked={marcado} onChange={() => {}} style={styles.checkbox} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  contador: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 6 },
  vacio: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center', marginTop: 16 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingVertical: 6, paddingHorizontal: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  filaMarcada: { backgroundColor: 'rgba(178,140,255,0.2)', borderColor: '#b28cff' },
  textos: { flex: 1, minWidth: 0 },
  nombre: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  username: { color: 'rgba(255,255,255,0.65)', fontSize: 13 },
  checkbox: { marginBottom: 0, marginRight: 0 },
});
