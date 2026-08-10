import React, {
    createContext,
    useCallback,
    useContext,
    useState,
} from 'react';

import { StreakPopup } from '../components/StreakPopup';

const StreakContext = createContext(null);

export function StreakProvider({ children }) {

    const [streakData, setStreakData] = useState({
        visible: false,
        rachaAnterior: 0,
        rachaActual: 0,
    });

    const showStreak = useCallback((rachaAnterior, rachaActual) => {

        setStreakData({
            visible: true,
            rachaAnterior,
            rachaActual,
        });

    }, []);

    const hideStreak = useCallback(() => {

        setStreakData({
            visible: false,
            rachaAnterior: 0,
            rachaActual: 0,
        });

    }, []);

    return (
        <StreakContext.Provider
            value={{
                showStreak,
                hideStreak,
            }}
        >

            {children}

            <StreakPopup
                visible={streakData.visible}
                rachaAnterior={streakData.rachaAnterior}
                rachaActual={streakData.rachaActual}
                onAnimationFinished={hideStreak}
            />

        </StreakContext.Provider>
    );
}

export function useStreakContext() {

    const context = useContext(StreakContext);

    if (!context) {
        throw new Error(
            'useStreakContext debe utilizarse dentro de StreakProvider'
        );
    }

    return context;
}