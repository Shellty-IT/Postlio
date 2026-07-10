// src/app/(dashboard)/settings/page.tsx
'use client';

import { useEffect, Suspense, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, ChevronRight } from 'lucide-react';
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
import { SETTINGS_SECTIONS, type SettingsSection } from '@/types/settings';
import { cn } from '@/lib/utils';
import {
    User,
    Sparkles,
    Bell,
    Palette,
    Link as LinkIcon,
    AlertTriangle,
} from 'lucide-react';

const MOBILE_ICONS: Record<string, React.ReactNode> = {
    User: <User className="w-3.5 h-3.5" />,
    Sparkles: <Sparkles className="w-3.5 h-3.5" />,
    Bell: <Bell className="w-3.5 h-3.5" />,
    Palette: <Palette className="w-3.5 h-3.5" />,
    Link: <LinkIcon className="w-3.5 h-3.5" />,
    AlertTriangle: <AlertTriangle className="w-3.5 h-3.5" />,
};

function SettingsContent() {
    const { activeSection, setActiveSection, settings } = useSettingsStore();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    const [showOverlay, setShowOverlay] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

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

    const getInitials = (name: string) => {
        return (name || '')
            .split(' ')
            .filter(Boolean)
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'T';
    };

    const mobileSections = SETTINGS_SECTIONS.filter((s) => s.id !== 'danger');
    const dangerSection = SETTINGS_SECTIONS.find((s) => s.id === 'danger');

    const sectionCardClass =
        activeSection === 'ai'
            ? 'ai-card'
            : activeSection === 'danger'
                ? 'rounded-[20px] border border-destructive/20 bg-destructive/[0.04]'
                : 'glass-card';

    return (
        <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] -mx-3 xs:-mx-4 sm:-mx-6 lg:-mx-8 -mb-4">
            {showOverlay && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="glass-card-strong p-6 shadow-lg flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <div className="text-center">
                            <p className="font-medium">Łączenie konta...</p>
                            <p className="text-sm text-muted-foreground">Proszę czekać</p>
                        </div>
                    </div>
                </div>
            )}

            {isMobile ? (
                <div className="flex flex-col gap-4 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <h1 className="text-lg font-semibold">Ustawienia</h1>
                        <SettingsHeader />
                    </div>

                    <div className="glass-card flex items-center gap-3 px-4 py-3.5">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-base font-semibold text-white">
                            {getInitials(settings.profile.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[14.5px] font-semibold text-foreground">
                                {settings.profile.name || 'Twój profil'}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {settings.profile.email}
                            </p>
                        </div>
                    </div>

                    <div className="glass-card flex flex-col divide-y divide-white/[0.05] overflow-hidden !p-0">
                        {mobileSections.map((section) => {
                            const isActive = activeSection === section.id;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id as SettingsSection)}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
                                        isActive ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg',
                                            isActive
                                                ? 'bg-gradient-to-br from-primary to-accent text-white'
                                                : 'bg-white/[0.06] text-muted-foreground'
                                        )}
                                    >
                                        {MOBILE_ICONS[section.icon]}
                                    </span>
                                    <span className="flex-1 text-[13.5px] text-foreground">{section.label}</span>
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                                </button>
                            );
                        })}
                    </div>

                    {dangerSection && (
                        <button
                            onClick={() => setActiveSection(dangerSection.id as SettingsSection)}
                            className={cn(
                                'glass-card flex items-center gap-3 border-destructive/20 bg-destructive/[0.04] px-4 py-3.5 text-left transition-colors hover:bg-destructive/[0.07]',
                                activeSection === dangerSection.id && 'bg-destructive/[0.08]'
                            )}
                        >
                            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
                                {MOBILE_ICONS[dangerSection.icon]}
                            </span>
                            <span className="flex-1 text-[13.5px] text-destructive/90">{dangerSection.label}</span>
                            <ChevronRight className="h-3.5 w-3.5 text-destructive/50" />
                        </button>
                    )}

                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(sectionCardClass, 'p-4')}
                    >
                        {renderSection()}
                    </motion.div>
                </div>
            ) : (
                <ScrollArea className="h-full">
                    <div className="flex flex-col gap-5 p-6 lg:p-8">
                        <div className="flex items-end justify-between gap-6">
                            <div>
                                <h1 className="text-2xl lg:text-[30px] font-semibold tracking-tight text-foreground">
                                    Ustawienia
                                </h1>
                                <p className="mt-2 text-[15px] text-muted-foreground">
                                    Konfiguracja konta, AI i połączeń.
                                </p>
                            </div>
                            <SettingsHeader />
                        </div>

                        <SettingsNav />

                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                            className={cn(sectionCardClass, 'p-6')}
                        >
                            {renderSection()}
                        </motion.div>
                    </div>
                </ScrollArea>
            )}
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
