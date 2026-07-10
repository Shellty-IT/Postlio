// src/providers/auth-provider.tsx
/**
 * Auth Provider - JEDYNE MIEJSCE OBSŁUGUJĄCE PRZEKIEROWANIA
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/hooks';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { AppLogo } from '@/components/common/app-logo';

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
    '/onboarding',
    '/features',
    '/offline',
];

// Ścieżki tylko dla niezalogowanych
const AUTH_ONLY_PATHS = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
];

function AuthLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <AppLogo className="h-12 w-12" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-violet-500 animate-ping opacity-20" />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                </div>
            </div>
        </div>
    );
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [isInitialized, setIsInitialized] = useState(false);
    const isRedirecting = useRef(false);
    const pathname = usePathname();
    const router = useRouter();
    const { isLoading, user } = useAuthStore();
    const { isLoading: isLoadingUser, isError } = useUser();

    const isPublicPath = PUBLIC_PATHS.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    const isAuthOnlyPath = AUTH_ONLY_PATHS.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    useEffect(() => {
        // Zapobiegaj wielokrotnym przekierowaniom
        if (isRedirecting.current) return;

        const hasTokens = authApi.isAuthenticated();

        // Niezalogowany
        if (!hasTokens) {
            if (!isPublicPath) {
                isRedirecting.current = true;
                router.replace('/login');
            }
            setIsInitialized(true);
            return;
        }

        // Czekaj na załadowanie usera
        if (isLoadingUser) return;

        // Błąd ładowania użytkownika
        if (isError) {
            if (!isPublicPath) {
                isRedirecting.current = true;
                router.replace('/login');
            }
            setIsInitialized(true);
            return;
        }

        // Zalogowany użytkownik
        if (user) {
            if (isAuthOnlyPath) {
                // Na stronie logowania/rejestracji - przekieruj
                isRedirecting.current = true;
                if (user.needs_onboarding) {
                    router.replace('/onboarding');
                } else {
                    router.replace('/dashboard');
                }
            }
        }

        setIsInitialized(true);
    }, [pathname, isLoadingUser, isError, isPublicPath, isAuthOnlyPath, router, user]);

    // Reset flagi po zmianie ścieżki
    useEffect(() => {
        isRedirecting.current = false;
    }, [pathname]);

    if (!isInitialized || isLoading || (authApi.isAuthenticated() && isLoadingUser)) {
        return <AuthLoading />;
    }

    return <>{children}</>;
}

export default AuthProvider;
