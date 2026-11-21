// Archivo: src/components/grupos/CrearGrupo.js
// Formulario de nuevo grupo: nombre, descripción, si es público o privado, e integrantes elegidos
// entre tus amigos. A un grupo privado se entra solo con su código, que se ve dentro del grupo.
// En horizontal (la app es landscape) el formulario va a la izquierda y los amigos a la derecha.
import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Button } from '../Button';
import { InputField } from '../InputField';
import { FormScroll, avisarFoco } from '../FormScroll';
import { SelectorAmigos } from './SelectorAmigos';
import { amistadesService } from '../../services/amistadesService';
import { gruposService } from '../../services/gruposService';
import { alternarSeleccion } from '../../utils/amigos';

const PRIVACIDAD = [
  { id: false, titulo: 'Público', ayuda: 'Cualquiera lo encuentra y entra.' },
  { id: true, titulo: 'Privado', ayuda: 'Se ve en la búsqueda, pero se entra solo con el código.' },
];

export function CrearGrupo({ miId, onCreado }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [esPrivado, setEsPrivado] = useState(false);
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
        esPrivado,
      });
      setNombre('');
      setDescripcion('');
      setEsPrivado(false);
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
      <FormScroll style={styles.columnaForm} contentContainerStyle={styles.formContenido}>
        <InputField placeholder="Nombre del grupo" value={nombre} onChangeText={setNombre} maxLength={50} autoCapitalize="sentences" />
        <TextInput
          onFocus={avisarFoco}
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

        <View style={styles.privacidad} accessibilityRole="radiogroup">
          {PRIVACIDAD.map(({ id, titulo }) => (
            <TouchableOpacity
              key={titulo}
              style={[styles.opcion, esPrivado === id && styles.opcionActiva]}
              onPress={() => setEsPrivado(id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: esPrivado === id }}
              activeOpacity={0.8}
            >
              <Text style={styles.opcionTexto}>{id ? '🔒 ' : '🌐 '}{titulo}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ayuda}>{PRIVACIDAD.find((p) => p.id === esPrivado).ayuda}</Text>

        {!!error && <Text style={styles.error}>{error}</Text>}
        <Button
          title={seleccionados.size > 0 ? `Crear grupo (${seleccionados.size + 1})` : 'Crear grupo'}
          onPress={crear}
          loading={enviando}
        />
      </FormScroll>

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
  privacidad: { flexDirection: 'row', gap: 8, marginTop: 8 },
  opcion: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  opcionActiva: { backgroundColor: 'rgba(178,140,255,0.3)', borderColor: '#b28cff' },
  opcionTexto: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  ayuda: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 6, marginBottom: 4 },
  error: { color: '#ffb3bd', fontSize: 14, textAlign: 'center', marginVertical: 8 },
});
