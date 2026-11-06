// Archivo: src/components/MensajeForm.js
// Pantalla de formulario compartida por Dar feedback, Reportar errores y Contacto.
// El resultado se muestra en la propia pantalla para que se vea igual en celular y en web.
import { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Background } from './Background';
import { Button } from './Button';
import { ScreenHeader } from './ScreenHeader';
import { AuthContext } from '../context/AuthContext';
import { mensajesService } from '../services/mensajesService';

const MINIMO_CARACTERES = 10;
const MAXIMO_CARACTERES = 2000;

export function MensajeForm({ titulo, tipo, intro, etiquetaCategoria, categorias, placeholder, textoExito }) {
  const insets = useSafeAreaInsets();
  const { perfil } = useContext(AuthContext);
  const [categoria, setCategoria] = useState(categorias[0]);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const largo = mensaje.trim().length;

  const handleEnviar = async () => {
    if (largo < MINIMO_CARACTERES) {
      setResultado({ ok: false, texto: `Contanos un poco más (mínimo ${MINIMO_CARACTERES} caracteres).` });
      return;
    }
    setEnviando(true);
    setResultado(null);
    try {
      await mensajesService.enviar(perfil.id, { tipo, categoria, mensaje: mensaje.trim() });
      setMensaje('');
      setResultado({ ok: true, texto: textoExito });
    } catch (error) {
      setResultado({ ok: false, texto: error.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Background>
      <View style={[styles.container, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
        <ScreenHeader title={titulo} />
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>{intro}</Text>

          <Text style={styles.etiqueta}>{etiquetaCategoria}</Text>
          <View style={styles.chips}>
            {categorias.map((opcion) => (
              <TouchableOpacity
                key={opcion}
                style={[styles.chip, opcion === categoria && styles.chipActivo]}
                onPress={() => setCategoria(opcion)}
                activeOpacity={0.8}
              >
                <Text style={styles.chipTexto}>{opcion}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.textarea}
            placeholder={placeholder}
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
            value={mensaje}
            onChangeText={(texto) => { setMensaje(texto); setResultado(null); }}
            maxLength={MAXIMO_CARACTERES}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.contador}>{mensaje.length} / {MAXIMO_CARACTERES}</Text>

          {!!resultado && (
            <Text style={[styles.resultado, resultado.ok ? styles.exito : styles.error]}>{resultado.texto}</Text>
          )}

          <Button title="Enviar" onPress={handleEnviar} loading={enviando} />
        </ScrollView>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  scroll: { paddingBottom: 20 },
  intro: { color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 21, marginBottom: 14 },
  etiqueta: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  chipActivo: { backgroundColor: 'rgba(178,140,255,0.3)', borderColor: '#b28cff' },
  chipTexto: { color: '#fff', fontSize: 13, fontWeight: '600' },
  textarea: { minHeight: 120, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.3)', borderWidth: 1, borderRadius: 10, padding: 12, color: '#fff', fontSize: 15 },
  contador: { color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'right', marginTop: 4 },
  resultado: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  exito: { color: '#a3fba3' },
  error: { color: '#ffb3bd' },
});
