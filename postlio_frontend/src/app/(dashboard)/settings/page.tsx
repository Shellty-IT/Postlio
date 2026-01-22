// src/app/(dashboard)/settings/page.tsx
'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
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
import { useOAuthCallback } from '@/hooks/useSocial';
import type { SocialPlatform } from '@/lib/api/social';

function SettingsContent() {
    const { activeSection, setActiveSection } = useSettingsStore();
    const searchParams = useSearchParams();
    const router = useRouter();
    const oauthCallback = useOAuthCallback();

    // Handle OAuth callback
    useEffect(() => {
        const oauthSuccess = searchParams.get('oauth_success');
        const oauthError = searchParams.get('oauth_error');
        const platform = searchParams.get('platform') as SocialPlatform | null;

        if (oauthError && platform) {
            const errorDescription = searchParams.get('oauth_error_description');
            toast.error(`Błąd połączenia ${platform}`, {
                description: errorDescription || oauthError,
            });

            // Switch to accounts section
            setActiveSection('accounts');

            // Clean URL
            router.replace('/settings', { scroll: false });
            return;
        }

        if (oauthSuccess === 'true' && platform) {
            const code = searchParams.get('oauth_code');
            const state = searchParams.get('oauth_state');
            const savedState = sessionStorage.getItem('oauth_state');

            // Verify state
            if (state !== savedState) {
                toast.error('Błąd bezpieczeństwa', {
                    description: 'Nieprawidłowy token state. Spróbuj ponownie.',
                });
                sessionStorage.removeItem('oauth_state');
                router.replace('/settings', { scroll: false });
                return;
            }

            if (code && state) {
                // Exchange code for token
                oauthCallback.mutate({ platform, code, state });

                // Switch to accounts section
                setActiveSection('accounts');
            }

            // Clean URL
            router.replace('/settings', { scroll: false });
        }
    }, [searchParams, router, oauthCallback, setActiveSection]);

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