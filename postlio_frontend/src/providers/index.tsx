// src/providers/index.tsx
'use client';

/**
 * Providers
 *
 * Główny wrapper łączący wszystkie providery.
 * Kolejność ma znaczenie!
 */

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/auth-store';
import { Toaster } from 'sonner';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { OfflineIndicator } from '@/components/pwa/offline-indicator';
import { UpdateNotification } from '@/components/pwa/update-notification';
import { initReminders } from '@/lib/reminders'; // ← NOWE

interface ProvidersProps {
    children: ReactNode;
}

// Ścieżki publiczne (nie wymagają logowania)
const PUBLIC_PATHS = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/offline',
    '/features',
];

// Ścieżki tylko dla niezalogowanych
const AUTH_ONLY_PATHS = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
];

/**
 * Reminder Initializer - inicjalizuje system przypomnień
 */
function ReminderInitializer() {
    useEffect(() => {
        // Inicjalizuj przypomnienia po załadowaniu aplikacji
        initReminders();
    }, []);

    return null;
}

/**
 * Auth Initializer - sprawdza stan autoryzacji przy starcie
 */
function AuthInitializer({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const checkAuth = useAuthStore((state) => state.checkAuth);
    const isInitialized = useAuthStore((state) => state.isInitialized);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    // Sprawdź czy ścieżka jest publiczna
    const isPublicPath = PUBLIC_PATHS.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    // Sprawdź czy ścieżka jest tylko dla niezalogowanych
    const isAuthOnlyPath = AUTH_ONLY_PATHS.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Ochrona routów po inicjalizacji
    useEffect(() => {
        if (!isInitialized) return;

        if (!isAuthenticated && !isPublicPath) {
            router.replace('/login');
        } else if (isAuthenticated && isAuthOnlyPath) {
            router.replace('/dashboard');
        }
    }, [isInitialized, isAuthenticated, isPublicPath, isAuthOnlyPath, router]);

    // Loading screen podczas inicjalizacji
    if (!isInitialized) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 animate-pulse" />
                        <div className="absolute inset-0 h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 animate-ping opacity-20" />
                    </div>
                    <p className="text-sm text-muted-foreground animate-pulse">
                        Ładowanie...
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

/**
 * Główny Provider
 */
export function Providers({ children }: ProvidersProps) {
    return (
        <QueryProvider>
            <ThemeProvider>
                <TooltipProvider delayDuration={300}>
                    <AuthInitializer>
                        {children}

                        {/* Toast notifications */}
                        <Toaster
                            position="bottom-right"
                            toastOptions={{
                                style: {
                                    background: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    color: 'hsl(var(--card-foreground))',
                                },
                                className: 'shadow-lg',
                            }}
                            closeButton
                            richColors
                        />

                        {/* PWA Components */}
                        <InstallPrompt />
                        <OfflineIndicator />
                        <UpdateNotification />

                        {/* Reminder System - NOWE */}
                        <ReminderInitializer />
                    </AuthInitializer>
                </TooltipProvider>
            </ThemeProvider>
        </QueryProvider>
    );
}

export default Providers;