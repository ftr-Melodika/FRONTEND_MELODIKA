// Archivo: src/components/StreakPopup.js
// Animación de racha a pantalla completa: aparece una llama apagada con la racha anterior,
// se prende fuego y el número sube a la racha actual (ej: 5 -> 6). El resto de la app queda desenfocado.
// Este componente NO sabe nada del backend ni del perfil: solo recibe los números y anima.
// Toda la decisión de "cuándo mostrarse" viene de afuera (StreakContext).
//
// Las imágenes de la llama viven en la carpeta assets/ de la RAÍZ del proyecto
// (no en src/assets), por eso subimos dos niveles: src/components -> src -> raíz.
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, BackHandler, Easing, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';

const flameOff = require('../../assets/flame_off_grande.png');
const flameOn = require('../../assets/flame_on_grande.png');

const PROPORCION_LLAMA = 768 / 512; // alto / ancho de las imágenes
const TIEMPO_VISIBLE_MS = 2600; // Desde que se prende hasta que se cierra sola
const CHISPAS = [
  { x: -0.28, demora: 0, alto: 0.55 },
  { x: 0.22, demora: 120, alto: 0.7 },
  { x: -0.06, demora: 220, alto: 0.85 },
  { x: 0.34, demora: 320, alto: 0.5 },
  { x: -0.36, demora: 420, alto: 0.65 },
  { x: 0.08, demora: 500, alto: 0.75 },
];

const tiempo = (valor, toValue, duration, easing = Easing.out(Easing.cubic)) =>
  Animated.timing(valor, { toValue, duration, easing, useNativeDriver: true });

// `blurTarget` (solo Android): ref del BlurTargetView que envuelve la app, que es lo que se desenfoca
export function StreakPopup({ visible, rachaAnterior, rachaActual, onAnimationFinished, blurTarget }) {
  const { width, height } = useWindowDimensions();
  const anchoLlama = Math.min(width * 0.62, (height * 0.5) / PROPORCION_LLAMA, 320);
  const altoLlama = anchoLlama * PROPORCION_LLAMA;

  const [numeroVisible, setNumeroVisible] = useState(rachaAnterior);

  const fondo = useRef(new Animated.Value(0)).current; // Opacidad del desenfoque
  const entrada = useRef(new Animated.Value(0)).current; // Llama apagada: aparece y crece
  const fuego = useRef(new Animated.Value(0)).current; // 0 apagada, 1 prendida
  const brillo = useRef(new Animated.Value(0)).current; // Resplandor detrás de la llama
  const titileo = useRef(new Animated.Value(0)).current; // Movimiento de la llama ya prendida
  const numeroSale = useRef(new Animated.Value(0)).current;
  const numeroEntra = useRef(new Animated.Value(1)).current;
  const texto = useRef(new Animated.Value(0)).current;
  const chispas = useRef(CHISPAS.map(() => new Animated.Value(0))).current;

  const cerrando = useRef(false);
  const cerrarRef = useRef(() => {});

  useEffect(() => {
    if (!visible) return undefined;

    cerrando.current = false;
    setNumeroVisible(rachaAnterior);
    [fondo, entrada, fuego, brillo, titileo, numeroSale, texto, ...chispas].forEach((v) => v.setValue(0));
    numeroEntra.setValue(1);

    const timers = [];
    let animacion = null;
    let loopTitileo = null;
    let cancelado = false;

    const cerrar = () => {
      if (cerrando.current) return;
      cerrando.current = true;
      timers.forEach(clearTimeout);
      animacion?.stop();
      Animated.parallel([tiempo(fondo, 0, 260, Easing.in(Easing.cubic)), tiempo(entrada, 0, 260, Easing.in(Easing.cubic))]).start(() => {
        loopTitileo?.stop();
        onAnimationFinished && onAnimationFinished();
      });
    };
    cerrarRef.current = cerrar;

    const cambiarNumero = () => {
      setNumeroVisible(rachaActual);
      numeroSale.setValue(0);
      numeroEntra.setValue(0);
      Animated.spring(numeroEntra, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
    };

    const prender = () => {
      animacion = Animated.parallel([
        tiempo(fuego, 1, 520, Easing.out(Easing.back(1.6))),
        Animated.sequence([tiempo(brillo, 1, 380), tiempo(brillo, 0.65, 600, Easing.inOut(Easing.sin))]),
        Animated.stagger(
          70,
          chispas.map((c, i) => Animated.sequence([Animated.delay(CHISPAS[i].demora / 3), tiempo(c, 1, 1100, Easing.out(Easing.quad))])),
        ),
        Animated.sequence([
          Animated.delay(160),
          tiempo(numeroSale, 1, 180, Easing.in(Easing.cubic)),
        ]),
        Animated.sequence([Animated.delay(450), tiempo(texto, 1, 300)]),
      ]);
      timers.push(setTimeout(cambiarNumero, 340));
      animacion.start(() => {
        if (cancelado) return;
        loopTitileo = Animated.loop(
          Animated.sequence([
            tiempo(titileo, 1, 700, Easing.inOut(Easing.sin)),
            tiempo(titileo, 0, 700, Easing.inOut(Easing.sin)),
          ]),
        );
        loopTitileo.start();
      });
      timers.push(setTimeout(cerrar, TIEMPO_VISIBLE_MS));
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reducir) => {
        if (cancelado) return;
        if (reducir) {
          // Sin movimiento: se muestra directo el resultado
          fondo.setValue(1);
          entrada.setValue(1);
          fuego.setValue(1);
          brillo.setValue(0.65);
          texto.setValue(1);
          setNumeroVisible(rachaActual);
          timers.push(setTimeout(cerrar, TIEMPO_VISIBLE_MS));
          return;
        }
        // 1. Entra el fondo y la llama apagada con la racha anterior. 2. Pausa. 3. Se prende.
        animacion = Animated.sequence([
          Animated.parallel([tiempo(fondo, 1, 300), Animated.spring(entrada, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true })]),
          Animated.delay(450),
        ]);
        animacion.start(({ finished }) => {
          if (finished && !cancelado) prender();
        });
      });

    const atras = BackHandler.addEventListener('hardwareBackPress', () => {
      cerrar();
      return true;
    });

    return () => {
      cancelado = true;
      timers.forEach(clearTimeout);
      animacion?.stop();
      loopTitileo?.stop();
      atras.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, rachaAnterior, rachaActual]);

  if (!visible) return null;

  const escalaEntrada = entrada.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  // La llama prendida nace desde abajo, se pasa un poco y se acomoda (lo hace el easing "back")
  const escalaFuego = fuego.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const titileoY = titileo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const titileoX = titileo.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98] });
  const escalaBrillo = brillo.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.15] });
  const dias = rachaActual === 1 ? 'día' : 'días';

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.contenedor, { opacity: fondo }]}
      accessibilityViewIsModal
      importantForAccessibility="yes"
    >
      <BlurView
        style={StyleSheet.absoluteFill}
        intensity={Platform.OS === 'android' ? 45 : 35}
        tint="dark"
        blurMethod="dimezisBlurView"
        blurTarget={blurTarget}
      />
      <View style={[StyleSheet.absoluteFill, styles.oscurecer]} />

      <Pressable
        style={styles.centro}
        onPress={() => cerrarRef.current()}
        accessibilityRole="button"
        accessibilityLabel={`¡Racha de ${rachaActual} ${dias}! Tocá para cerrar`}
      >
        <Animated.View style={{ width: anchoLlama, height: altoLlama, transform: [{ scale: escalaEntrada }] }}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.brillo,
              {
                width: anchoLlama * 1.6,
                height: anchoLlama * 1.6,
                borderRadius: anchoLlama * 0.8,
                left: -anchoLlama * 0.3,
                top: altoLlama * 0.62 - anchoLlama * 0.8,
                opacity: brillo,
                transform: [{ scale: escalaBrillo }],
              },
            ]}
          />

          <Animated.Image source={flameOff} style={[styles.llama, { opacity: fuego.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.4, 0] }) }]} resizeMode="contain" />
          <Animated.Image
            source={flameOn}
            resizeMode="contain"
            style={[
              styles.llama,
              {
                opacity: fuego.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 1] }),
                transformOrigin: 'bottom',
                transform: [{ scaleX: titileoX }, { scaleY: titileoY }, { scale: escalaFuego }],
              },
            ]}
          />

          {chispas.map((c, i) => (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={[
                styles.chispa,
                {
                  left: anchoLlama * (0.5 + CHISPAS[i].x),
                  top: altoLlama * 0.55,
                  opacity: c.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 0.8, 0] }),
                  transform: [
                    { translateY: c.interpolate({ inputRange: [0, 1], outputRange: [0, -altoLlama * CHISPAS[i].alto] }) },
                    { scale: c.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) },
                  ],
                },
              ]}
            />
          ))}

          {/* El número va sobre el centro claro de la llama */}
          <View style={[styles.numeroCaja, { top: altoLlama * 0.6, height: altoLlama * 0.3 }]} pointerEvents="none">
            <Animated.Text
              style={[
                styles.numero,
                { fontSize: anchoLlama * 0.3 },
                {
                  // Sale el anterior (numeroSale) y entra el nuevo con un rebote (numeroEntra)
                  opacity: Animated.multiply(numeroEntra, numeroSale.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })),
                  transform: [
                    { translateY: numeroSale.interpolate({ inputRange: [0, 1], outputRange: [0, -anchoLlama * 0.12] }) },
                    { scale: numeroEntra.interpolate({ inputRange: [0, 1], outputRange: [1.8, 1] }) },
                  ],
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {numeroVisible}
            </Animated.Text>
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: texto,
            transform: [{ translateY: texto.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          }}
        >
          <Text style={styles.titulo} accessibilityLiveRegion="polite">
            ¡Racha de {rachaActual} {dias}!
          </Text>
          <Text style={styles.subtitulo}>Volvé mañana para mantenerla encendida</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    zIndex: 999,
    elevation: 20,
  },
  oscurecer: {
    backgroundColor: 'rgba(8, 8, 12, 0.35)',
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brillo: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 140, 30, 0.28)',
  },
  llama: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  chispa: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD25A',
  },
  numeroCaja: {
    position: 'absolute',
    left: '22%',
    right: '22%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numero: {
    color: '#3A1A00',
    fontWeight: '900',
    textAlign: 'center',
  },
  titulo: {
    marginTop: 28,
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitulo: {
    marginTop: 8,
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 15,
    textAlign: 'center',
  },
});
