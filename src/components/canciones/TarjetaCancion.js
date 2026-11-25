// Archivo: src/components/canciones/TarjetaCancion.js
// Una canción del catálogo: la portada a la izquierda (casi todo el alto de la tarjeta); al lado, alineados
// al medio, el título, el artista y la dificultad; a la derecha y a todo el alto, el corazón (favorita) arriba
// y las estrellas abajo.
import { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PortadaCancion } from './PortadaCancion';
import { Estrellas } from './Estrellas';
import { acordesDeCancion, nivelDeCancion } from '../../utils/canciones';

const PADDING = 6;
const TAMANO_ESTRELLAS = 18;

// `estrellas`: 0 si nunca se tocó, o 1 a 3. `onPress(cancion)` y `onFavorita(cancion)`. `favorita`: true / false. `enFavoritas`: true si está en la sección Favoritas (el borde toma el color del corazón; si no, el de la dificultad). Con `onFavorita` indefinido el corazón no se muestra (los favoritos no están disponibles).
export const TarjetaCancion = memo(function TarjetaCancion({ cancion, ancho, alto, favorita, enFavoritas = false, estrellas = 0, onPress, onFavorita }) {
  const nivel = nivelDeCancion(cancion);
  const acordes = acordesDeCancion(cancion);
  const estiloNivel = nivel === 'Fácil' ? styles.nivelFacil : nivel === 'Difícil' ? styles.nivelDificil : styles.nivelIntermedio;

  return (
    <TouchableOpacity
      style={[styles.tarjeta, { width: ancho, height: alto, borderColor: enFavoritas ? styles.corazonActivo.color : estiloNivel.backgroundColor }]}
      onPress={() => onPress(cancion)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${cancion.titulo}, de ${cancion.artista}. ${nivel}. Acordes: ${acordes.join(', ')}`}
    >
      <PortadaCancion lado={alto - 2 * PADDING - 2} portada={cancion.portada} />
      {/* Al medio: título, artista y, debajo, la dificultad */}
      <View style={styles.izquierda}>
        <Text style={styles.titulo} numberOfLines={1}>{cancion.titulo}</Text>
        <Text style={styles.artista} numberOfLines={1}>{cancion.artista}</Text>
        <Text style={[styles.nivel, estiloNivel]}>{nivel}</Text>
      </View>
      {/* A la derecha, en todo el alto: el corazón arriba y las estrellas abajo */}
      <View style={styles.derecha}>
        {onFavorita ? (
          <TouchableOpacity
            onPress={() => onFavorita(cancion)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={favorita ? 'Quitar de favoritas' : 'Marcar como favorita'}
            accessibilityState={{ selected: !!favorita }}
          >
            <Text style={[styles.corazon, favorita && styles.corazonActivo]}>{favorita ? '♥' : '♡'}</Text>
          </TouchableOpacity>
        ) : <View />}
        <Estrellas cantidad={estrellas} tamano={TAMANO_ESTRELLAS} />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  tarjeta: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: PADDING, borderRadius: 16, backgroundColor: 'rgba(30,26,92,0.88)', borderWidth: 1.5 },
  izquierda: { flex: 1, alignSelf: 'stretch', justifyContent: 'center', alignItems: 'flex-start', gap: 2 },
  derecha: { alignSelf: 'stretch', alignItems: 'flex-end', justifyContent: 'space-between' },
  titulo: { color: '#fff', fontSize: 18, lineHeight: 22, fontWeight: 'bold', alignSelf: 'stretch' },
  corazon: { color: 'rgba(255,255,255,0.8)', fontSize: 28, lineHeight: 30 },
  corazonActivo: { color: '#ffb3bd' },
  artista: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 17, alignSelf: 'stretch' },
  nivel: { fontSize: 12, lineHeight: 15, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 1, borderRadius: 9, overflow: 'hidden' },
  nivelFacil: { color: '#0d3a17', backgroundColor: '#a3fba3' },
  nivelIntermedio: { color: '#3d2a00', backgroundColor: '#ffd35c' },
  nivelDificil: { color: '#4a0f1a', backgroundColor: '#ffb3bd' },
});
