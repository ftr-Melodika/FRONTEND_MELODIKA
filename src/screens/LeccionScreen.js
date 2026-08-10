// Archivo: src/screens/LeccionScreen.js
import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Background } from '../components/Background';

import { LeccionSidebar } from '../components/leccion/LeccionSideBar';
import { VideoStep } from '../components/leccion/VideoStep';
import { TheoryStep } from '../components/leccion/TheoryStep';
import { PracticeStep } from '../components/leccion/PracticeStep';
import { AuthContext } from '../context/AuthContext';
// NUEVO
import { useStreak } from '../hooks/useStreak';

export function LeccionScreen({ route, navigation }) {
    const leccion = route.params?.leccion || {};
    const [paso, setPaso] = useState(1);
    // Obtenemos el perfil activo
    const { perfil } = useContext(AuthContext);
    // El perfilId es el id del perfil activo
    const perfilId = perfil?.id;
    // Sistema global de racha
    const { showStreak } = useStreak();


    const handleTerminar = async () => {

        try {

            // ==========================================
            // VALIDAR PERFIL
            // ==========================================

            if (!perfilId) {

                // HACER: revisar cómo maneja Melodika los errores
                // cuando no existe un perfil activo.

                console.error(
                    'No se encontró perfilId para actualizar la racha.'
                );

            } else {

                // ==========================================
                // ACTUALIZAR RACHA
                // ==========================================

                // HACER:
                // Crear/importar el service del frontend que llame:
                //
                // POST /:id/racha
                //
                // Debe enviar este perfilId:
                //
                // perfilId
                //
                // La respuesta esperada es:
                //
                // {
                //     exito: true,
                //     mostrarAnimacion: true,
                //     rachaAnterior: 5,
                //     rachaActual: 6,
                //     mensaje: "..."
                // }


                // HACER:
                // Reemplazar la siguiente línea por la llamada
                // real al service.
                //
                // Ejemplo:
                //
                // const resultado = await rachaService.chequearRacha(perfilId);


                // HACER:
                // Cuando tengas `resultado`, utilizar:
                //
                // if (resultado.mostrarAnimacion) {
                //
                //     showStreak(
                //         resultado.rachaAnterior,
                //         resultado.rachaActual
                //     );
                //
                // }


                /*
                EJEMPLO COMPLETO:

                const resultado =
                    await rachaService.chequearRacha(perfilId);

                if (resultado.mostrarAnimacion) {

                    showStreak(
                        resultado.rachaAnterior,
                        resultado.rachaActual
                    );

                }
                */

            }


            // ==========================================
            // FINALIZAR LECCIÓN
            // ==========================================

            Alert.alert(
                '¡Lección Completada! 🏆',
                `Ganaste ${leccion.xp || 100} XP.`
            );

            navigation.goBack();


        } catch (error) {

            console.error(
                'Error al actualizar la racha:',
                error
            );

            Alert.alert(
                'Error',
                'No se pudo actualizar la racha.'
            );

        }

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