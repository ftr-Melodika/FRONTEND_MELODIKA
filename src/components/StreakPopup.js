import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Image,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export function StreakPopup({
    visible,
    rachaAnterior,
    rachaActual,
    onAnimationFinished,
}) {
    const [numeroVisible, setNumeroVisible] = useState(rachaAnterior);
    const [llamaPrendida, setLlamaPrendida] = useState(false);

    // Animación del popup
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-25)).current;

    // Animación de la llama
    const flameScale = useRef(new Animated.Value(0.85)).current;

    // Animación del número
    const numberTranslate = useRef(new Animated.Value(0)).current;
    const numberOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (visible) {
            iniciarAnimacion();
        }
    }, [visible]);

    const iniciarAnimacion = () => {
        setNumeroVisible(rachaAnterior);
        setLlamaPrendida(false);

        opacity.setValue(0);
        translateY.setValue(-25);

        flameScale.setValue(0.85);

        numberTranslate.setValue(0);
        numberOpacity.setValue(1);

        // ==========================================
        // 1. ENTRADA DEL POPUP
        // ==========================================

        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 180,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),

            Animated.timing(translateY, {
                toValue: 0,
                duration: 220,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start(() => {

            // ==========================================
            // 2. LA LLAMA SE PRENDE
            // ==========================================

            setTimeout(() => {
                setLlamaPrendida(true);
            }, 80);

            Animated.sequence([
                Animated.timing(flameScale, {
                    toValue: 1.18,
                    duration: 130,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),

                Animated.timing(flameScale, {
                    toValue: 1,
                    duration: 100,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start();

            // ==========================================
            // 3. CAMBIO DEL NÚMERO
            // ==========================================

            setTimeout(() => {

                Animated.parallel([
                    Animated.timing(numberTranslate, {
                        toValue: -15,
                        duration: 140,
                        easing: Easing.in(Easing.ease),
                        useNativeDriver: true,
                    }),

                    Animated.timing(numberOpacity, {
                        toValue: 0,
                        duration: 120,
                        useNativeDriver: true,
                    }),
                ]).start(() => {

                    setNumeroVisible(rachaActual);

                    numberTranslate.setValue(15);
                    numberOpacity.setValue(0);

                    Animated.parallel([
                        Animated.timing(numberTranslate, {
                            toValue: 0,
                            duration: 180,
                            easing: Easing.out(Easing.cubic),
                            useNativeDriver: true,
                        }),

                        Animated.timing(numberOpacity, {
                            toValue: 1,
                            duration: 150,
                            useNativeDriver: true,
                        }),
                    ]).start();
                });

            }, 180);

            // ==========================================
            // 4. DESAPARICIÓN
            // ==========================================

            setTimeout(() => {

                Animated.parallel([
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 220,
                        easing: Easing.in(Easing.ease),
                        useNativeDriver: true,
                    }),

                    Animated.timing(translateY, {
                        toValue: -10,
                        duration: 220,
                        easing: Easing.in(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]).start(() => {

                    if (onAnimationFinished) {
                        onAnimationFinished();
                    }

                });

            }, 900);
        });
    };

    if (!visible) {
        return null;
    }

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.container,
                {
                    opacity,
                    transform: [
                        {
                            translateY,
                        },
                    ],
                },
            ]}
        >

            <Animated.View
                style={[
                    styles.flameContainer,
                    {
                        transform: [
                            {
                                scale: flameScale,
                            },
                        ],
                    },
                ]}
            >

                {llamaPrendida ? (

                    // HACER: colocar acá el PNG de la llama prendida.
                    // Ejemplo:
                    // source={require('../assets/flame_on.png')}

                    <Image
                        // HACER: reemplazar null por la ruta real de flame_on.png
                        source={null}
                        style={styles.flame}
                        resizeMode="contain"
                    />

                ) : (

                    // HACER: colocar acá el PNG de la llama apagada.
                    // Ejemplo:
                    // source={require('../assets/flame_off.png')}

                    <Image
                        // HACER: reemplazar null por la ruta real de flame_off.png
                        source={null}
                        style={styles.flame}
                        resizeMode="contain"
                    />

                )}

            </Animated.View>

            <Animated.View
                style={[
                    styles.numberContainer,
                    {
                        opacity: numberOpacity,
                        transform: [
                            {
                                translateY: numberTranslate,
                            },
                        ],
                    },
                ]}
            >
                <Text style={styles.number}>
                    {numeroVisible}
                </Text>
            </Animated.View>

        </Animated.View>
    );
}

const styles = StyleSheet.create({

    container: {
        position: 'absolute',

        top: 55,
        right: 15,

        width: 130,
        height: 50,

        backgroundColor: 'rgba(40, 40, 40, 0.92)',

        borderRadius: 14,

        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'center',

        zIndex: 9999,

        elevation: 10,

        shadowColor: '#000',

        shadowOffset: {
            width: 0,
            height: 4,
        },

        shadowOpacity: 0.25,

        shadowRadius: 8,
    },

    flameContainer: {
        width: 32,
        height: 36,

        alignItems: 'center',
        justifyContent: 'center',

        marginRight: 10,
    },

    flame: {
        width: 32,
        height: 32,
    },

    numberContainer: {
        minWidth: 35,

        alignItems: 'center',
        justifyContent: 'center',
    },

    number: {
        color: '#FFFFFF',

        fontSize: 24,

        fontWeight: '700',

        textAlign: 'center',
    },

});