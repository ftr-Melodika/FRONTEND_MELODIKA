import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Background } from '../components/Background';
import { Button } from '../components/Button';

export function LeccionScreen({ route, navigation }) {
  const { leccion } = route.params;
  const [paso, setPaso] = useState(1);
  const [playing, setPlaying] = useState(false);

  const onStateChange = useCallback((state) => {
    if (state === 'ended') setPlaying(false);
  }, []);

  const handleTerminar = () => {
    Alert.alert('¡Lección Completada! 🏆', `Ganaste ${leccion.xp || 100} XP.`);
    navigation.goBack();
  };

  return (
    <Background>
      <View style={styles.horizontalContainer}>
        
        {/* COLUMNA IZQUIERDA: MENÚ E INSTRUCCIONES */}
        <View style={styles.sidebar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.volver}>← Volver</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>{leccion.titulo}</Text>
          <Text style={styles.pasosText}>Paso {paso} de 3</Text>

          <View style={styles.instructionsContainer}>
            {paso === 1 && <Text style={styles.instructionInfo}>Mirá la técnica que usa el profe en el video antes de agarrar la guitarra.</Text>}
            {paso === 2 && <Text style={styles.instructionInfo}>Leé la teoría. Acordate que la cuerda más fina es la 1ra y está abajo.</Text>}
            {paso === 3 && <Text style={styles.instructionInfo}>¡A tocar! Posicioná tus dedos exactamente como marca el mástil.</Text>}
          </View>
        </View>

        {/* COLUMNA DERECHA: EL CONTENIDO INTERACTIVO */}
        <View style={styles.mainContent}>
          
          {/* PASO 1: VIDEO */}
          {paso === 1 && (
            <View style={styles.stepWrapper}>
              <View style={styles.videoBox}>
                <YoutubePlayer height={240} width={'100%'} play={playing} videoId={"6yKz57b0wG8"} onChangeState={onStateChange} />
              </View>
              <Button title="Siguiente: Conceptos Clave →" onPress={() => setPaso(2)} style={styles.actionBtn} />
            </View>
          )}

          {/* PASO 2: TEORÍA */}
          {paso === 2 && (
            <View style={styles.stepWrapper}>
              <View style={styles.card}>
                <Text style={styles.paragraph}>La guitarra tiene 6 cuerdas. Se cuentan de abajo (la más fina) hacia arriba (la más gruesa).</Text>
                <Text style={styles.paragraphHighlight}>Hoy vamos a tocar la 1ra cuerda al aire (sin pisar nada) y luego en el 3er traste.</Text>
              </View>
              <View style={styles.btnRow}>
                <Button title="← Atrás" variant="secondary" onPress={() => setPaso(1)} style={{width: '40%'}} />
                <Button title="¡A Practicar! 🎸" onPress={() => setPaso(3)} style={{width: '40%'}} />
              </View>
            </View>
          )}

          {/* PASO 3: PRÁCTICA (MÁSTIL HORIZONTAL TIPO SIMPLY GUITAR) */}
          {paso === 3 && (
            <View style={styles.stepWrapper}>
              <View style={styles.mastilContainer}>
                
                {/* Trastes (Verticales) */}
                <View style={styles.fretsOverlay}>
                  {[...Array(6)].map((_, i) => <View key={i} style={styles.fretLine} />)}
                </View>
                
                {/* Cuerdas (Horizontales) */}
                <View style={styles.stringsContainer}>
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <View key={num} style={styles.stringWrapper}>
                      <Text style={styles.stringNumber}>{num}</Text>
                      {/* Las cuerdas más altas (graves) son más gruesas visualmente */}
                      <View style={[styles.stringLine, num > 3 && styles.thickString, num === 6 && {height: 4}]} />
                    </View>
                  ))}
                </View>

                {/* El indicador visual (Cuerda 1, Traste 3) */}
                <View style={[styles.targetDot, { bottom: '76%', left: '46%' }]}>
                  <Text style={styles.targetNumber}>3</Text>
                </View>
              </View>

              <View style={styles.btnRow}>
                <Button title="← Atrás" variant="secondary" onPress={() => setPaso(2)} style={{width: '40%'}} />
                <Button title="Terminar Lección ✔️" onPress={handleTerminar} style={{width: '40%', backgroundColor: '#4c52d9'}} />
              </View>
            </View>
          )}
        </View>

      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  horizontalContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    padding: 15, 
    gap: 15 
},
  
  // COLUMNA IZQUIERDA
  sidebar: { 
    width: '30%', 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    borderRadius: 20, 
    padding: 15, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.15)', 
    justifyContent: 'flex-start' 
},
  backButton: { 
    marginBottom: 20, 
    alignSelf: 'flex-start' 
},
  volver: { 
    color: '#b28cff', 
    fontSize: 16, 
    fontWeight: 'bold' 
},
  title: { 
    fontSize: 24, 
    color: '#fff', 
    fontFamily: 'serif', 
    fontWeight: 'bold', 
    marginBottom: 15 
},
  pasosText: { 
    color: '#a3fba3', 
    fontSize: 14, 
    fontWeight: 'bold', 
    marginBottom: 20 
},
  instructionsContainer: { 
    flex: 1, 
    justifyContent: 'center' 
},
  instructionInfo: { 
    color: 'rgba(255,255,255,0.8)', 
    fontSize: 15, 
    lineHeight: 22 
},

  // COLUMNA DERECHA
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepWrapper: {
    width: '90%',
    alignItems: 'center',
  },

  // CONTENEDORES DE PASOS
  videoBox: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 20,
    backgroundColor: '#000',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 20,
    width: '100%',
  },
  paragraph: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 15,
  },
  paragraphHighlight: {
    color: '#b28cff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 26,
  },
  actionBtn: {
    width: '100%',
    maxWidth: 300,
  },
  btnRow: {
    flexDirection: 'row',
    width: '50%',
    marginTop: 10,
    marginLeft: '0',
    marginRight: '250',
  },

  // ESTILOS DEL MÁSTIL TIPO SIMPLY GUITAR
  mastilContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#4A2E1B',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#2A180E',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  fretsOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    opacity: 0.8,
  },
  fretLine: {
    width: 5,
    height: '100%',
    backgroundColor: '#C0C0C0',
    shadowColor: '#000',
    shadowOffset: { width: -3, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },
  stringsContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingVertical: 10,
  },
  stringWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  stringNumber: {
    color: '#a3fba3',
    width: 20,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: 5,
  },
  stringLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  thickString: {
    height: 3,
    backgroundColor: '#D3D3D3',
  },
  targetDot: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#32CD32',
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#32CD32',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  targetNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
});