'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeContextProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>('light');

    useEffect(() => {
        // Check local storage for user preference on load
        const savedMode = localStorage.getItem('cortex_theme_mode') as ThemeMode;
        if (savedMode) {
            setMode(savedMode);
        } else {
            // Opt-in for system preference if no previously saved mode
            const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            setMode(systemPreference);
        }
    }, []);

    const toggleTheme = () => {
        setMode((prevMode) => {
            const newMode = prevMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('cortex_theme_mode', newMode);
            return newMode;
        });
    };

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useThemeContext() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useThemeContext must be used within a ThemeContextProvider');
    }
    return context;
}
