// Archivo: src/screens/LeccionScreen.js
import { useState, useContext } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Background } from '../components/Background';

import { LeccionSidebar } from '../components/leccion/LeccionSideBar';
import { VideoStep } from '../components/leccion/VideoStep';
import { TheoryStep } from '../components/leccion/TheoryStep';
import { PracticeStep } from '../components/leccion/PracticeStep';

// AGREGADO (animación de racha):
// - AuthContext: para leer el perfil activo y sacar perfilId.
// - useStreak: hook del StreakContext, para poder llamar a showStreak().
// - rachaService: hace el POST /:id/racha contra el backend.
import { AuthContext } from '../context/AuthContext';
import { useStreak } from '../hooks/useStreak';
import { rachaService } from '../services/rachaService';

export function LeccionScreen({ route, navigation }) {
  const leccion = route.params?.leccion || {};
  const [paso, setPaso] = useState(1);

  // AGREGADO: sacamos el perfil activo del AuthContext (mismo patrón que usa HomeScreen)
  // para poder mandarle el perfilId al backend cuando se chequea la racha.
  const { perfil } = useContext(AuthContext);
  const perfilId = perfil?.id;
  const { showStreak } = useStreak();

  // MODIFICADO: handleTerminar pasó de ser sincrónica a async.
  // Antes solo mostraba el Alert de XP y volvía atrás.
  // Ahora, antes de eso, le pregunta al backend si la racha subió
  // (POST /:id/racha) y, si el backend responde mostrarAnimacion: true,
  // dispara el popup de racha (showStreak) con rachaAnterior y rachaActual.
  // El frontend NO decide si la racha sube: solo obedece lo que devuelve el backend.
  const handleTerminar = async () => {
    if (perfilId) {
      const resultado = await rachaService.chequearRacha(perfilId);

      if (resultado?.mostrarAnimacion) {
        showStreak(resultado.rachaAnterior, resultado.rachaActual);
      }
    }

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
  // Eliminamos alignItems: 'center' para evitar que los steps colapsen
  mainContent: { flex: 1, justifyContent: 'center' },
});