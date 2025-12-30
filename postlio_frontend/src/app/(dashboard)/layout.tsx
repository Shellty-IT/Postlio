// src/app/(dashboard)/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/layout/sidebar';
import { FloatingNav } from '@/components/layout/floating-nav';
import { TopBar } from '@/components/layout/top-bar';
import { useSidebar } from '@/store/ui-store';

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated, isInitialized, isLoading } = useAuth();
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

    // Loading state
    if (!isInitialized || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent animate-pulse" />
                        <div className="absolute inset-0 h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent animate-ping opacity-20" />
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