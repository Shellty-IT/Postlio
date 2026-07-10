// src/providers/index.tsx
/**
 * Providers - główny wrapper aplikacji
 *
 * ✅ ZAKTUALIZOWANE: AuthInitializer weryfikuje sesję z backendem
 */

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/auth-store';
import { Toaster } from 'sonner';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { OfflineIndicator } from '@/components/pwa/offline-indicator';
import { UpdateNotification } from '@/components/pwa/update-notification';
import { initReminders } from '@/lib/reminders';
import { AppLogo } from '@/components/common/app-logo';

interface ProvidersProps {
    children: ReactNode;
}

const PUBLIC_PATHS = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/offline',
    '/features',
    '/onboarding',
];

const AUTH_ONLY_PATHS = ['/login', '/register'];

/**
 * Reminder Initializer - inicjalizuje system przypomnień
 */
function ReminderInitializer() {
    useEffect(() => {
        initReminders();
    }, []);

    return null;
}

/**
 * Auth Initializer - sprawdza stan autoryzacji przy starcie
 * ✅ ZAKTUALIZOWANE: Weryfikuje sesję z backendem
 */
function AuthInitializer({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isVerifying, setIsVerifying] = useState(true);

    const checkAuth = useAuthStore((state) => state.checkAuth);
    const isInitialized = useAuthStore((state) => state.isInitialized);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isLoading = useAuthStore((state) => state.isLoading);
    const user = useAuthStore((state) => state.user);

    const isPublicPath = PUBLIC_PATHS.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    const isAuthOnlyPath = AUTH_ONLY_PATHS.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    // Weryfikacja sesji przy starcie
    useEffect(() => {
        const verifyAuth = async () => {
            setIsVerifying(true);
            await checkAuth();
            setIsVerifying(false);
        };

        verifyAuth();
    }, [checkAuth]);

    // Przekierowania po weryfikacji
    useEffect(() => {
        // Czekaj na zakończenie weryfikacji
        if (isVerifying || !isInitialized || isLoading) return;

        // Jeśli nie zalogowany i próbuje wejść na chronioną stronę
        if (!isAuthenticated && !isPublicPath) {
            router.replace('/login');
            return;
        }

        // Jeśli zalogowany i próbuje wejść na stronę logowania/rejestracji
        if (isAuthenticated && isAuthOnlyPath && user) {
            if (user.needs_onboarding) {
                router.replace('/onboarding');
            } else {
                router.replace('/dashboard');
            }
            return;
        }
    }, [isVerifying, isInitialized, isLoading, isAuthenticated, user, isPublicPath, isAuthOnlyPath, pathname, router]);

    // Loading screen podczas weryfikacji
    if (isVerifying || !isInitialized) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <AppLogo className="h-12 w-12 animate-pulse" />
                        <div className="absolute inset-0 h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 animate-ping opacity-20" />
                    </div>
                    <p className="text-sm text-muted-foreground animate-pulse">
                        Weryfikacja sesji...
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

                        {/* Reminder System */}
                        <ReminderInitializer />
                    </AuthInitializer>
                </TooltipProvider>
            </ThemeProvider>
        </QueryProvider>
    );
}

export default Providers;
