// src/app/(dashboard)/settings/page.tsx
'use client';

import { useEffect, Suspense, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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

    // ✅ Ref do śledzenia czy już przetworzono - NIE powoduje re-renderów
    const processedRef = useRef(false);

    // Pobierz parametry raz
    const oauthSuccess = searchParams.get('oauth_success');
    const oauthError = searchParams.get('oauth_error');
    const platform = searchParams.get('platform') as SocialPlatform | null;
    const code = searchParams.get('oauth_code');
    const state = searchParams.get('oauth_state');

    useEffect(() => {
        // ✅ KLUCZOWE: Sprawdź ref, nie state
        if (processedRef.current) {
            return;
        }

        const hasOAuthParams = oauthSuccess === 'true' && platform && code && state;
        const hasOAuthError = oauthError && platform;

        // Brak parametrów - nic nie rób
        if (!hasOAuthParams && !hasOAuthError) {
            return;
        }

        // ✅ Oznacz jako przetworzone NATYCHMIAST
        processedRef.current = true;

        // Obsłuż błąd OAuth
        if (hasOAuthError) {
            const errorDescription = searchParams.get('oauth_error_description');
            toast.error(`Błąd połączenia ${platform}`, {
                description: errorDescription || oauthError,
            });
            setActiveSection('accounts');
            window.history.replaceState({}, '', '/settings');
            return;
        }

        // Obsłuż sukces OAuth
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
    // ✅ USUNIĘTO showOverlay z dependencies!

    // Render active section
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

    return (
        <div className="p-6 h-[calc(100vh-4rem)]">
            {/* OAuth Processing Overlay */}
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

            {/* Header */}
            <SettingsHeader />

            {/* Main Content */}
            <div className="flex gap-8 mt-6 h-[calc(100%-5rem)]">
                {/* Sidebar Navigation */}
                <aside className="w-72 flex-shrink-0">
                    <div className="sticky top-6">
                        <SettingsNav />
                    </div>
                </aside>

                {/* Content Area */}
                <main className="flex-1 min-w-0">
                    <ScrollArea className="h-full pr-4">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="pb-8"
                        >
                            {renderSection()}
                        </motion.div>
                    </ScrollArea>
                </main>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className="p-6 h-[calc(100vh-4rem)] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Ładowanie...</div>
            </div>
        }>
            <SettingsContent />
        </Suspense>
    );
}