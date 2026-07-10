// src/providers/theme-provider.tsx

/**
 * Theme Provider
 *
 * Postlio 2.0 jest aplikacją wyłącznie w ciemnym motywie — nie ma przełącznika.
 */

import type { ReactNode } from 'react';

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    return <>{children}</>;
}

export default ThemeProvider;
