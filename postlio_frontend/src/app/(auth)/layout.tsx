// src/app/(auth)/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

export default function AuthLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated, isInitialized } = useAuthStore();

    // Przekieruj zalogowanych do dashboard
    useEffect(() => {
        if (isInitialized && isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, isInitialized, router]);

    // Pokaż loading podczas sprawdzania auth
    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Sparkles className="h-8 w-8 animate-pulse text-primary" />
                    <p className="text-muted-foreground">Ładowanie...</p>
                </div>
            </div>
        );
    }

    // Nie pokazuj formularza jeśli zalogowany
    if (isAuthenticated) {
        return null;
    }

    // Po prostu renderuj children - strony mają własny layout
    return <>{children}</>;
}