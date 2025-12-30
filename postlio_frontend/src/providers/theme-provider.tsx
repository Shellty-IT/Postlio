// src/providers/theme-provider.tsx
'use client';

/**
 * Theme Provider
 *
 * Zarządzanie dark/light mode z synchronizacją z systemem.
 * Integracja z UI Store.
 */

import { useEffect, type ReactNode } from 'react';
import { useUIStore } from '@/store/ui-store';

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const theme = useUIStore((state) => state.theme);

    useEffect(() => {
        const root = window.document.documentElement;

        // Usuń poprzednie klasy
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            // Sprawdź preferencje systemowe
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
                .matches
                ? 'dark'
                : 'light';
            root.classList.add(systemTheme);

            // Nasłuchuj zmian w preferencjach systemowych
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => {
                root.classList.remove('light', 'dark');
                root.classList.add(e.matches ? 'dark' : 'light');
            };

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            root.classList.add(theme);
        }
    }, [theme]);

    return <>{children}</>;
}

export default ThemeProvider;