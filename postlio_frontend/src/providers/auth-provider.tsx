// src/providers/auth-provider.tsx
/**
 * Auth Provider
 *
 * Inicjalizacja stanu autoryzacji przy starcie aplikacji.
 * Sprawdza czy użytkownik jest zalogowany i pobiera jego dane.
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/hooks';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

// ============================================================
// TYPY
// ============================================================

interface AuthProviderProps {
    children: React.ReactNode;
}

// Ścieżki publiczne (nie wymagają logowania)
const PUBLIC_PATHS = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
];

// Ścieżki tylko dla niezalogowanych
const AUTH_ONLY_PATHS = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
];

// ============================================================
// LOADING COMPONENT
// ============================================================

function AuthLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                {/* Logo */}
                <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                        <span className="text-xl font-bold text-white">P</span>
                    </div>
                    {/* Pulsująca animacja */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-violet-500 animate-ping opacity-20" />
                </div>

                {/* Tekst */}
                <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                </div>
            </div>
        </div>
    );
}

// ============================================================
// AUTH PROVIDER
// ============================================================

export function AuthProvider({ children }: AuthProviderProps) {
    const [isInitialized, setIsInitialized] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { isLoading } = useAuthStore();

    // Pobierz dane użytkownika jeśli jest token
    const { isLoading: isLoadingUser, isError } = useUser();

    // Sprawdź czy ścieżka jest publiczna
    const isPublicPath = PUBLIC_PATHS.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    // Sprawdź czy ścieżka jest tylko dla niezalogowanych
    const isAuthOnlyPath = AUTH_ONLY_PATHS.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    useEffect(() => {
        const checkAuth = async () => {
            const hasTokens = authApi.isAuthenticated();

            if (!hasTokens) {
                // Brak tokenów
                if (!isPublicPath) {
                    // Przekieruj do logowania jeśli próbuje wejść na chronioną stronę
                    router.replace('/login');
                }
                setIsInitialized(true);
                return;
            }

            // Mamy tokeny - poczekaj na załadowanie usera
            if (!isLoadingUser) {
                if (isError) {
                    // Błąd ładowania użytkownika (np. token wygasł)
                    if (!isPublicPath) {
                        router.replace('/login');
                    }
                } else if (isAuthOnlyPath) {
                    // Zalogowany użytkownik na stronie logowania - przekieruj do dashboard
                    router.replace('/dashboard');
                }
                setIsInitialized(true);
            }
        };

        checkAuth();
    }, [pathname, isLoadingUser, isError, isPublicPath, isAuthOnlyPath, router]);

    // Pokaż loading podczas inicjalizacji
    if (!isInitialized || isLoading || (authApi.isAuthenticated() && isLoadingUser)) {
        return <AuthLoading />;
    }

    return <>{children}</>;
}

export default AuthProvider;