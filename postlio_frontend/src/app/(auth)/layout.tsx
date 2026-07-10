// src/app/(auth)/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { ServerStatus } from '@/components/common';
import { AppLogo } from '@/components/common/app-logo';

export default function AuthLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isInitialized, user } = useAuthStore();

    // Sprawdź czy to strona onboardingu
    const isOnboardingPage = pathname === '/onboarding';

    // Przekieruj zalogowanych do dashboard (ALE nie z onboardingu!)
    useEffect(() => {
        if (isInitialized && isAuthenticated && !isOnboardingPage) {
            // Zalogowany na login/register - przekieruj
            if (user?.needs_onboarding) {
                router.push('/onboarding');
            } else {
                router.push('/dashboard');
            }
        }
    }, [isAuthenticated, isInitialized, isOnboardingPage, user, router]);

    // Pokaż loading podczas sprawdzania auth
    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <AppLogo className="h-8 w-8 animate-pulse" />
                    <p className="text-muted-foreground">Ładowanie...</p>
                </div>
            </div>
        );
    }

    // Dla onboardingu - zawsze renderuj (strona sama sprawdzi auth)
    if (isOnboardingPage) {
        return <>{children}</>;
    }

    // Dla login/register - nie pokazuj jeśli zalogowany (przekierowanie w toku)
    if (isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <AppLogo className="h-8 w-8 animate-pulse" />
            </div>
        );
    }

    return (
        <>
            <ServerStatus />
            {children}
        </>
    );
}
