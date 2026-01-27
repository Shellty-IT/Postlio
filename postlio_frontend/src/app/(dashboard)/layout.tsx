// src/app/(dashboard)/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { FloatingNav } from '@/components/layout/floating-nav';
import { TopBar } from '@/components/layout/top-bar';
import { useSidebar } from '@/store/ui-store';
import { Sparkles } from 'lucide-react';

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isInitialized, isLoading } = useAuth();
    const { user, capabilities } = useAuthStore();
    const { isCollapsed } = useSidebar();
    const [isMobile, setIsMobile] = useState(false);

    // Sprawdź rozmiar ekranu
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Przekieruj niezalogowanych do logowania
    useEffect(() => {
        if (isInitialized && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isInitialized, router]);

    // Przekieruj na onboarding jeśli potrzebny
    useEffect(() => {
        if (isInitialized && isAuthenticated && user?.needs_onboarding) {
            router.push('/onboarding');
        }
    }, [isInitialized, isAuthenticated, user, router]);

    // Blokuj dostęp do Autopilot bez konta firmowego
    useEffect(() => {
        if (
            isInitialized &&
            isAuthenticated &&
            pathname === '/autopilot' &&
            !capabilities.can_use_autopilot
        ) {
            // Nie przekierowuj - zamiast tego pokaż blokadę w komponencie
            // Można też przekierować: router.push('/dashboard');
        }
    }, [isInitialized, isAuthenticated, pathname, capabilities, router]);

    // Loading state
    if (!isInitialized || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-white animate-pulse" />
                        </div>
                        <div className="absolute inset-0 h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-primary animate-ping opacity-20" />
                    </div>
                    <p className="text-sm text-muted-foreground">Ładowanie...</p>
                </div>
            </div>
        );
    }

    // Nie renderuj jeśli niezalogowany
    if (!isAuthenticated) {
        return null;
    }

    // Nie renderuj jeśli potrzebny onboarding
    if (user?.needs_onboarding) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar - tylko desktop */}
            {!isMobile && <Sidebar />}

            {/* Main Content */}
            <div
                className={`
          min-h-screen transition-all duration-300
          ${!isMobile ? (isCollapsed ? 'lg:pl-20' : 'lg:pl-64') : ''}
          pb-24 lg:pb-6
        `}
            >
                {/* Top Bar */}
                <TopBar />

                {/* Page Content */}
                <main className="p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>

            {/* Floating Navigation - tylko mobile */}
            {isMobile && <FloatingNav />}
        </div>
    );
}