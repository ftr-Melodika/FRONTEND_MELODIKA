// Archivo: src/components/canciones/TarjetaCancion.js
// Una canción del catálogo: la portada a la izquierda (casi todo el alto de la tarjeta) y, alineados
// con ella al medio, el título, el artista y los acordes; a la derecha y a todo el alto, el corazón (favorita),
// la dificultad y las estrellas.
import { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PortadaCancion } from './PortadaCancion';
import { Estrellas } from './Estrellas';
import { acordesDeCancion, nivelDeCancion } from '../../utils/canciones';

const PADDING = 8;
const ACORDES_VISIBLES = 5;

// `estrellas`: 0 si nunca se tocó, o 1 a 3. `onPress(cancion)` y `onFavorita(cancion)`. `favorita`: true / false. Con `onFavorita` indefinido el corazón no se muestra (los favoritos no están disponibles).
export const TarjetaCancion = memo(function TarjetaCancion({ cancion, ancho, alto, favorita, estrellas = 0, onPress, onFavorita }) {
  const nivel = nivelDeCancion(cancion);
  const acordes = acordesDeCancion(cancion);
  const visibles = acordes.slice(0, ACORDES_VISIBLES);
  const ocultos = acordes.length - visibles.length;

  return (
    <TouchableOpacity
      style={[styles.tarjeta, { width: ancho, height: alto }]}
      onPress={() => onPress(cancion)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${cancion.titulo}, de ${cancion.artista}. ${nivel}. Acordes: ${acordes.join(', ')}`}
    >
      <PortadaCancion lado={alto - 2 * PADDING - 2} portada={cancion.portada} />
      {/* A la izquierda: título, artista y acordes, al medio del alto */}
      <View style={styles.izquierda}>
        <Text style={styles.titulo} numberOfLines={1}>{cancion.titulo}</Text>
        <Text style={styles.artista} numberOfLines={1}>{cancion.artista}</Text>
        <View style={styles.acordes}>
          {visibles.map((a) => <Text key={a} style={styles.acorde}>{a}</Text>)}
          {ocultos > 0 ? <Text style={styles.acorde}>+{ocultos}</Text> : null}
        </View>
      </View>
      {/* A la derecha, en todo el alto: el corazón arriba, la dificultad al medio y las estrellas abajo */}
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
        ) : <View style={styles.corazon} />}
        <Text style={[styles.nivel, nivel === 'Fácil' ? styles.nivelFacil : nivel === 'Difícil' ? styles.nivelDificil : styles.nivelIntermedio]}>{nivel}</Text>
        <Estrellas cantidad={estrellas} />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  tarjeta: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: PADDING, borderRadius: 16, backgroundColor: 'rgba(30,26,92,0.88)', borderWidth: 1.5, borderColor: 'rgba(178,140,255,0.75)' },
  izquierda: { flex: 1, alignSelf: 'stretch', justifyContent: 'center', alignItems: 'flex-start', gap: 4 },
  derecha: { alignSelf: 'stretch', alignItems: 'flex-end', justifyContent: 'space-between' },
  titulo: { color: '#fff', fontSize: 16, fontWeight: 'bold', alignSelf: 'stretch' },
  corazon: { color: 'rgba(255,255,255,0.8)', fontSize: 22, lineHeight: 24, minHeight: 24 },
  corazonActivo: { color: '#ffb3bd' },
  artista: { color: 'rgba(255,255,255,0.85)', fontSize: 12, alignSelf: 'stretch' },
  nivel: { fontSize: 11, fontWeight: 'bold', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9, overflow: 'hidden' },
  nivelFacil: { color: '#0d3a17', backgroundColor: '#a3fba3' },
  nivelIntermedio: { color: '#3d2a00', backgroundColor: '#ffd35c' },
  nivelDificil: { color: '#4a0f1a', backgroundColor: '#ffb3bd' },
  acordes: { flexDirection: 'row', gap: 5, overflow: 'hidden' },
  acorde: { color: '#fff', fontSize: 12, fontWeight: 'bold', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.28)' },
});
