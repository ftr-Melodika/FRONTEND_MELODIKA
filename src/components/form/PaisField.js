// Archivo: src/components/form/PaisField.js
// País del perfil: se elige de la lista de todos los países, con un buscador que filtra a medida
// que se escribe. Se abre en una ventana encima del formulario: con el teclado abierto (y la app en
// horizontal) una lista desplegada dentro del formulario quedaría tapada.
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAlturaTeclado } from '../../hooks/useAlturaTeclado';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icono } from '../icono/Icono';
import { SelectField } from '../SelectField';
import { filtrarPaises } from '../../utils/paises';

const ALTO_OPCION = 44;

// value: el nombre del país ('' si no eligió). Un país viejo escrito a mano se muestra igual.
export function PaisField({ value, onSelect, label = 'País (opcional)' }) {
  const insets = useSafeAreaInsets();
  const alturaTeclado = useAlturaTeclado();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const resultados = useMemo(() => filtrarPaises(busqueda), [busqueda]);

  const abrir = () => {
    setBusqueda('');
    setAbierto(true);
  };
  const cerrar = () => setAbierto(false);
  const elegir = (pais) => {
    onSelect(pais);
    setAbierto(false);
  };

  return (
    <View style={styles.contenedor}>
      <SelectField label={label} value={value} onPress={abrir} isOpen={abierto} />

      <Modal
        visible={abierto}
        transparent
        animationType="fade"
        onRequestClose={cerrar}
        supportedOrientations={['landscape', 'landscape-left', 'landscape-right', 'portrait']}
      >
        <View
          style={[styles.fondo, { paddingTop: Math.max(insets.top, 12), paddingBottom: Math.max(insets.bottom, 12) + alturaTeclado }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={cerrar} accessibilityLabel="Cerrar" />
          <View style={styles.tarjeta}>
            <View style={styles.buscador}>
              <Icono nombre="buscar" tamano={16} color="#7d5bd6" />
              <TextInput
                style={styles.input}
                placeholder="Buscar país"
                placeholderTextColor="#999"
                value={busqueda}
                onChangeText={setBusqueda}
                autoFocus
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={() => resultados.length === 1 && elegir(resultados[0])}
                accessibilityLabel="Buscar país"
              />
              <TouchableOpacity onPress={cerrar} style={styles.cerrar} accessibilityRole="button" accessibilityLabel="Cerrar">
                <Text style={styles.cerrarTexto}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={resultados}
              keyExtractor={(pais) => pais}
              keyboardShouldPersistTaps="handled"
              getItemLayout={(_, index) => ({ length: ALTO_OPCION, offset: ALTO_OPCION * index, index })}
              initialNumToRender={20}
              ListHeaderComponent={value ? (
                <TouchableOpacity style={styles.opcion} onPress={() => elegir('')} accessibilityRole="button">
                  <Text style={styles.quitar}>Sin país</Text>
                </TouchableOpacity>
              ) : null}
              ListEmptyComponent={<Text style={styles.vacio}>No encontramos ese país.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.opcion} onPress={() => elegir(item)} accessibilityRole="button">
                  <Text style={[styles.texto, item === value && styles.textoElegido]}>{item}</Text>
                  {item === value && <Icono nombre="check" tamano={16} color="#7d5bd6" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { width: '100%' },
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  tarjeta: { width: '100%', maxWidth: 480, flexShrink: 1, maxHeight: 420, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden' },
  buscador: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  input: { flex: 1, height: 46, fontSize: 15, color: '#333' },
  cerrar: { width: 44, height: 46, justifyContent: 'center', alignItems: 'center' },
  cerrarTexto: { fontSize: 18, color: '#666' },
  opcion: { height: ALTO_OPCION, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  texto: { fontSize: 15, color: '#333' },
  textoElegido: { color: '#7d5bd6', fontWeight: 'bold' },
  quitar: { fontSize: 15, color: '#888', fontStyle: 'italic' },
  vacio: { padding: 16, color: '#666', textAlign: 'center' },
});
