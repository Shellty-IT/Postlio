// src/app/(dashboard)/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { FloatingNav } from '@/components/layout/floating-nav';
import { TopBar } from '@/components/layout/top-bar';
import { useSidebar, useDock } from '@/store/ui-store';
import { AppLogo } from '@/components/common/app-logo';

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated, isInitialized } = useAuthStore();
    const { isCollapsed } = useSidebar();
    const { mode: dockMode } = useDock();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isInitialized && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isInitialized, isAuthenticated, router]);

    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <div className="flex flex-col items-center gap-4">
                    <AppLogo className="h-12 w-12 animate-pulse" />
                    <p className="text-sm text-muted-foreground text-center">Ładowanie...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">

            {!isMobile && <Sidebar />}


            <div
                className={cn(
                    'min-h-screen transition-all duration-300',
                    'pb-20 xs:pb-24 lg:pb-6',
                    !isMobile && dockMode === 'left' && (isCollapsed ? 'lg:pl-[var(--dock-w-collapsed)]' : 'lg:pl-[var(--dock-w-expanded)]'),
                    !isMobile && dockMode === 'right' && (isCollapsed ? 'lg:pr-[var(--dock-w-collapsed)]' : 'lg:pr-[var(--dock-w-expanded)]'),
                    !isMobile && dockMode === 'bottom' && 'lg:pb-24'
                )}
            >
                <TopBar />

                <main className="px-3 py-4 xs:px-4 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>


            {isMobile && <FloatingNav />}
        </div>
    );
}

import { cn } from '@/lib/utils';
