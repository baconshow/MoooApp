
"use client";

import { useState, useEffect, useCallback } from 'react';

interface DoryState {
    forgetCount: number;
    punishmentsRevealed: number;
    lastResetDate: string; // YYYY-MM-DD
    punishmentRevealedToday: boolean;
    revealedPunishment: string;
}

const getInitialState = (): DoryState => {
    const today = new Date().toISOString().split('T')[0];
    const defaultState: DoryState = {
        forgetCount: 0,
        punishmentsRevealed: 0,
        lastResetDate: today,
        punishmentRevealedToday: false,
        revealedPunishment: '',
    };
    
    if (typeof window === 'undefined') {
        return defaultState;
    }

    const savedState = localStorage.getItem('doryState');

    if (savedState) {
        try {
            const state: DoryState = JSON.parse(savedState);
            // Check if we need to reset the daily punishment flag
            if (state.lastResetDate !== today) {
                state.punishmentRevealedToday = false;
                state.revealedPunishment = '';
                state.lastResetDate = today;
                state.forgetCount = 0; // Reset daily forget count
            }
            return state;
        } catch (e) {
             // If parsing fails, return default state
             return defaultState;
        }
    }

    // Seed initial data for demo if no state exists
    return {
        ...defaultState,
        forgetCount: 2,
        punishmentsRevealed: 3,
    };
};


export const useDoryState = () => {
    const [state, setState] = useState<DoryState>(getInitialState);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This effect ensures state is loaded correctly on the client
        // and handles the daily reset logic upon first load.
        setState(getInitialState());
        setLoading(false);
    }, []);

    useEffect(() => {
        if(!loading) {
            localStorage.setItem('doryState', JSON.stringify(state));
        }
    }, [state, loading]);

    const incrementForgetCount = useCallback(() => {
        setState(prevState => {
            if (prevState.forgetCount < 5) {
                return { ...prevState, forgetCount: prevState.forgetCount + 1 };
            }
            return prevState;
        });
    }, []);

    const revealPunishment = useCallback((punishment: string) => {
        setState(prevState => {
            if (!prevState.punishmentRevealedToday) {
                return {
                    ...prevState,
                    punishmentRevealedToday: true,
                    revealedPunishment: punishment,
                    punishmentsRevealed: prevState.punishmentsRevealed + 1,
                };
            }
            return prevState;
        });
    }, []);

    const reset = useCallback(() => {
        setState(prevState => ({
            ...prevState,
            forgetCount: 0,
        }));
    }, []);

    return { ...state, incrementForgetCount, revealPunishment, reset, loading };
};
