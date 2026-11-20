// Archivo: src/components/grupos/EntradaCodigo.js
// Caja para escribir el código de un grupo privado y entrar. No cambia mayúsculas: el código las distingue.
import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../Button';
import { InputField } from '../InputField';
import { LARGO_CODIGO_GRUPO, esCodigoGrupoValido, limpiarCodigoGrupo } from '../../utils/codigoGrupo';

// onEntrar(codigo) debe devolver una promesa; si falla, su mensaje se muestra debajo
export function EntradaCodigo({ onEntrar, textoBoton = 'Entrar', autoFocus = false, style }) {
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const entrar = async () => {
    if (!esCodigoGrupoValido(codigo)) {
      setError(`El código tiene ${LARGO_CODIGO_GRUPO} letras o números.`);
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await onEntrar(codigo);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={style}>
      <View style={styles.fila}>
        <View style={styles.flex}>
          <InputField
            placeholder="Código del grupo"
            value={codigo}
            onChangeText={(t) => { setCodigo(limpiarCodigoGrupo(t)); setError(null); }}
            onSubmitEditing={entrar}
            maxLength={LARGO_CODIGO_GRUPO}
            autoFocus={autoFocus}
            returnKeyType="go"
            style={[styles.entrada]}
          />
        </View>
        <Button title={textoBoton} onPress={entrar} loading={enviando} disabled={codigo.length === 0} style={styles.boton} />
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fila: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  entrada: { width: '100%', height: 44, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.3)', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, marginBottom: 0, color: '#fff', fontSize: 16, letterSpacing: 2, fontWeight: 'bold' },
  boton: { width: 110, minHeight: 44, paddingVertical: 8, marginVertical: 0 },
  error: { color: '#ffb3bd', fontSize: 13, marginTop: 6 },
});
