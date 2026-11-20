// Archivo: src/components/grupos/CrearGrupo.js
// Formulario de nuevo grupo: nombre, descripción e integrantes elegidos entre tus amigos.
// En horizontal (la app es landscape) el formulario va a la izquierda y los amigos a la derecha.
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet } from 'react-native';
import { Button } from '../Button';
import { InputField } from '../InputField';
import { SelectorAmigos } from './SelectorAmigos';
import { amistadesService } from '../../services/amistadesService';
import { gruposService } from '../../services/gruposService';
import { alternarSeleccion } from '../../utils/amigos';

export function CrearGrupo({ miId, onCreado }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [amigos, setAmigos] = useState([]);
  const [seleccionados, setSeleccionados] = useState(() => new Set());
  const [cargandoAmigos, setCargandoAmigos] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const lista = await amistadesService.obtenerAmigos(miId);
        if (!cancelado) setAmigos(lista);
      } catch (e) {
        if (!cancelado) setError(e.message);
      } finally {
        if (!cancelado) setCargandoAmigos(false);
      }
    })();
    return () => { cancelado = true; };
  }, [miId]);

  const crear = async () => {
    const nombreLimpio = nombre.trim();
    if (nombreLimpio.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const grupo = await gruposService.crear(miId, {
        nombre: nombreLimpio,
        descripcion: descripcion.trim(),
        miembroIds: [...seleccionados],
      });
      setNombre('');
      setDescripcion('');
      setSeleccionados(new Set());
      onCreado(grupo);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.fila}>
      <ScrollView style={styles.columnaForm} contentContainerStyle={styles.formContenido} keyboardShouldPersistTaps="handled">
        <InputField placeholder="Nombre del grupo" value={nombre} onChangeText={setNombre} maxLength={50} autoCapitalize="sentences" />
        <TextInput
          style={styles.descripcion}
          placeholder="¿De qué se trata? (opcional)"
          placeholderTextColor="rgba(255, 255, 255, 0.7)"
          value={descripcion}
          onChangeText={setDescripcion}
          maxLength={200}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.contadorTexto}>{descripcion.length} / 200</Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Button
          title={seleccionados.size > 0 ? `Crear grupo (${seleccionados.size + 1})` : 'Crear grupo'}
          onPress={crear}
          loading={enviando}
        />
      </ScrollView>

      <View style={styles.columnaAmigos}>
        <Text style={styles.titulo}>Elegí integrantes</Text>
        {cargandoAmigos ? (
          <Text style={styles.cargando}>Cargando tus amigos...</Text>
        ) : (
          <SelectorAmigos
            amigos={amigos}
            seleccionados={seleccionados}
            onAlternar={(id) => setSeleccionados((actual) => alternarSeleccion(actual, id))}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flex: 1, flexDirection: 'row', gap: 20 },
  columnaForm: { flex: 1 },
  formContenido: { paddingBottom: 20 },
  columnaAmigos: { flex: 1.2 },
  titulo: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  cargando: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center', marginTop: 16 },
  descripcion: { minHeight: 90, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.3)', borderWidth: 1, borderRadius: 10, padding: 12, color: '#fff', fontSize: 15 },
  contadorTexto: { color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'right', marginTop: 4 },
  error: { color: '#ffb3bd', fontSize: 14, textAlign: 'center', marginVertical: 8 },
});
