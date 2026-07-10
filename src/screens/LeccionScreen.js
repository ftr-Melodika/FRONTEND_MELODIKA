// Archivo: src/screens/LeccionScreen.js
import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Background } from '../components/Background';

// Importamos a los 4 especialistas
import { LeccionSidebar } from '../components/leccion/LeccionSidebar';
import { VideoStep } from '../components/leccion/VideoStep';
import { TheoryStep } from '../components/leccion/TheoryStep';
import { PracticeStep } from '../components/leccion/PracticeStep';

export function LeccionScreen({ route, navigation }) {
  // Manejo de seguridad en caso de que leccion venga undefined
  const leccion = route.params?.leccion || {};
  const [paso, setPaso] = useState(1);

  const handleTerminar = () => {
    Alert.alert('¡Lección Completada! 🏆', `Ganaste ${leccion.xp || 100} XP.`);
    navigation.goBack();
  };

  return (
    <Background>
      <View style={styles.horizontalContainer}>
        
        <LeccionSidebar 
          leccion={leccion} 
          paso={paso} 
          onBack={() => navigation.goBack()} 
          // 👇 CAMBIO 1: Le inyectamos las instrucciones dinámicas de la lección
          instrucciones={leccion.instrucciones}
        />

        <View style={styles.mainContent}>
          {paso === 1 && (
            <VideoStep 
              videoId={leccion.videoId} 
              onNext={() => setPaso(2)} 
            />
          )}

          {paso === 2 && (
            <TheoryStep 
              textoPrincipal={leccion.textoTeoria || "La guitarra tiene 6 cuerdas. Se cuentan de abajo hacia arriba."}
              textoDestacado={leccion.textoDestacado || "Hoy vamos a tocar la 1ra cuerda al aire y luego en el 3er traste."}
              onBack={() => setPaso(1)} 
              onNext={() => setPaso(3)} 
            />
          )}

          {paso === 3 && (
            <PracticeStep 
              // 👇 CAMBIO 2: Dejamos de hardcodear el traste 3 y le pasamos los datos del Mock
              trasteObjetivo={leccion.trasteObjetivo || "3"}
              dotLeft={leccion.dotLeft || "46%"}
              dotBottom={leccion.dotBottom || "76%"}
              onBack={() => setPaso(2)} 
              onFinish={handleTerminar} 
            />
          )}
        </View>

      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  horizontalContainer: { flex: 1, flexDirection: 'row', padding: 15, gap: 15 },
  mainContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});