// src/app/(dashboard)/settings/page.tsx
'use client';

import { useEffect, Suspense, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, Menu } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
    SettingsHeader,
    SettingsNav,
    ProfileSection,
    AIPreferencesSection,
    NotificationsSection,
    AppearanceSection,
    ConnectedAccountsSection,
    DangerZoneSection,
} from '@/components/settings';
import { useSettingsStore } from '@/store/settings-store';
import { handleOAuthCallback } from '@/lib/api/social';
import { useQueryClient } from '@tanstack/react-query';
import { socialKeys } from '@/hooks/useSocial';
import type { SocialPlatform } from '@/lib/api/social';

function SettingsContent() {
    const { activeSection, setActiveSection } = useSettingsStore();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    const [showOverlay, setShowOverlay] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false);

    const processedRef = useRef(false);

    const oauthSuccess = searchParams.get('oauth_success');
    const oauthError = searchParams.get('oauth_error');
    const platform = searchParams.get('platform') as SocialPlatform | null;
    const code = searchParams.get('oauth_code');
    const state = searchParams.get('oauth_state');

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (processedRef.current) {
            return;
        }

        const hasOAuthParams = oauthSuccess === 'true' && platform && code && state;
        const hasOAuthError = oauthError && platform;

        if (!hasOAuthParams && !hasOAuthError) {
            return;
        }

        processedRef.current = true;

        if (hasOAuthError) {
            const errorDescription = searchParams.get('oauth_error_description');
            toast.error(`Błąd połączenia ${platform}`, {
                description: errorDescription || oauthError,
            });
            setActiveSection('accounts');
            window.history.replaceState({}, '', '/settings');
            return;
        }

        if (hasOAuthParams) {
            setShowOverlay(true);

            handleOAuthCallback(platform, code, state)
                .then(async (result) => {
                    if (result.success) {
                        toast.success('Konto połączone!', {
                            description: `Połączono: ${result.account_name || platform}`,
                        });
                        await queryClient.invalidateQueries({ queryKey: socialKeys.accounts() });
                    } else {
                        toast.error('Błąd połączenia', {
                            description: result.error_description || result.error || 'Nieznany błąd',
                        });
                    }
                })
                .catch((error) => {
                    toast.error('Błąd połączenia', {
                        description: error instanceof Error ? error.message : 'Wystąpił błąd',
                    });
                })
                .finally(() => {
                    setShowOverlay(false);
                    setActiveSection('accounts');
                    window.history.replaceState({}, '', '/settings');
                });
        }
    }, [oauthSuccess, oauthError, platform, code, state, setActiveSection, queryClient, searchParams]);

    const renderSection = () => {
        switch (activeSection) {
            case 'profile':
                return <ProfileSection />;
            case 'ai':
                return <AIPreferencesSection />;
            case 'notifications':
                return <NotificationsSection />;
            case 'appearance':
                return <AppearanceSection />;
            case 'accounts':
                return <ConnectedAccountsSection />;
            case 'danger':
                return <DangerZoneSection />;
            default:
                return <ProfileSection />;
        }
    };

    const sectionTitles: Record<string, string> = {
        profile: 'Profil',
        ai: 'Preferencje AI',
        notifications: 'Powiadomienia',
        appearance: 'Wygląd',
        accounts: 'Połączone konta',
        danger: 'Strefa niebezpieczna',
    };

    return (
        <div className="h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] -mx-3 xs:-mx-4 sm:-mx-6 lg:-mx-8 -mb-4 overflow-hidden">
            {showOverlay && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-card border rounded-lg p-6 shadow-lg flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <div className="text-center">
                            <p className="font-medium">Łączenie konta...</p>
                            <p className="text-sm text-muted-foreground">Proszę czekać</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex h-full">
                {isMobile ? (
                    <>
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex items-center gap-3 p-4 border-b">
                                <Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9">
                                            <Menu className="h-5 w-5" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="w-72 p-0">
                                        <div className="p-4 border-b">
                                            <h2 className="font-semibold">Ustawienia</h2>
                                        </div>
                                        <div onClick={() => setIsNavOpen(false)}>
                                            <SettingsNav />
                                        </div>
                                    </SheetContent>
                                </Sheet>
                                <h1 className="text-lg font-semibold">
                                    {sectionTitles[activeSection]}
                                </h1>
                            </div>
                            <ScrollArea className="flex-1">
                                <div className="p-4">
                                    <motion.div
                                        key={activeSection}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {renderSection()}
                                    </motion.div>
                                </div>
                            </ScrollArea>
                        </div>
                    </>
                ) : (
                    <>
                        <aside className="w-64 lg:w-72 flex-shrink-0 border-r bg-card/50">
                            <div className="p-6">
                                <SettingsHeader />
                            </div>
                            <SettingsNav />
                        </aside>

                        <main className="flex-1 overflow-hidden">
                            <ScrollArea className="h-full">
                                <div className="p-6 lg:p-8">
                                    <motion.div
                                        key={activeSection}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="max-w-3xl"
                                    >
                                        {renderSection()}
                                    </motion.div>
                                </div>
                            </ScrollArea>
                        </main>
                    </>
                )}
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Ładowanie...</div>
            </div>
        }>
            <SettingsContent />
        </Suspense>
    );
}