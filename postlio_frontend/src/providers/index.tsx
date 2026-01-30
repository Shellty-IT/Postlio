// src/providers/index.tsx
'use client';

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
import { initReminders } from '@/lib/reminders';

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
 */
function AuthInitializer({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const checkAuth = useAuthStore((state) => state.checkAuth);
    const isInitialized = useAuthStore((state) => state.isInitialized);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);

    const isPublicPath = PUBLIC_PATHS.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    const isAuthOnlyPath = AUTH_ONLY_PATHS.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!isInitialized) return;
        if (isAuthenticated && !user) return;

        if (!isAuthenticated && !isPublicPath) {
            router.replace('/login');
            return;
        }

        if (isAuthenticated && isAuthOnlyPath && user) {
            if (user.needs_onboarding) {
                router.replace('/onboarding');
            } else {
                router.replace('/dashboard');
            }
            return;
        }
    }, [isInitialized, isAuthenticated, user, isPublicPath, isAuthOnlyPath, pathname, router]);

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

                        {/* Reminder System */}
                        <ReminderInitializer />
                    </AuthInitializer>
                </TooltipProvider>
            </ThemeProvider>
        </QueryProvider>
    );
}

export default Providers;