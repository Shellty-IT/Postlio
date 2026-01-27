// src/components/onboarding/onboarding-connect.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Facebook,
    Instagram,
    Linkedin,
    ArrowLeft,
    Building2,
    User,
    Check,
    Info,
    Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { initOAuth } from '@/lib/api/social';
import { toast } from 'sonner';
import type { SocialPlatform } from '@/types';

export function OnboardingConnect() {
    const { setOnboardingStep, startSocialLogin, skipOnboarding } = useAuthStore();
    const [isConnecting, setIsConnecting] = useState<SocialPlatform | null>(null);

    const handleConnect = async (platform: SocialPlatform) => {
        try {
            setIsConnecting(platform);
            startSocialLogin(platform, false, 'onboarding');

            const response = await initOAuth(platform);

            // Dodaj kontekst do state (backend powinien zwrócić state z prefixem)
            // Alternatywnie, możemy zapisać w sessionStorage
            sessionStorage.setItem('oauth_state', response.state);
            sessionStorage.setItem('oauth_platform', platform);
            sessionStorage.setItem('oauth_context', 'onboarding');

            // Przekieruj do OAuth
            window.location.href = response.authorization_url;

        } catch (error) {
            console.error('OAuth init error:', error);
            toast.error(`Nie udało się połączyć z ${platform}`);
            setIsConnecting(null);
        }
    };

    const handleSkip = () => {
        skipOnboarding();
        // Router.push jest obsługiwany przez skipOnboarding w store
        window.location.href = '/dashboard';
    };

    const platforms = [
        {
            id: 'facebook' as SocialPlatform,
            name: 'Facebook',
            icon: Facebook,
            color: '#1877F2',
            businessTypes: ['Strona Facebook'],
            personalTypes: ['Profil osobisty'],
        },
        {
            id: 'instagram' as SocialPlatform,
            name: 'Instagram',
            icon: Instagram,
            color: '#E4405F',
            businessTypes: ['Instagram Business', 'Instagram Creator'],
            personalTypes: ['Konto osobiste'],
        },
        {
            id: 'linkedin' as SocialPlatform,
            name: 'LinkedIn',
            icon: Linkedin,
            color: '#0A66C2',
            businessTypes: ['Strona firmowa'],
            personalTypes: ['Profil osobisty'],
        },
    ];

    return (
        <Card className="w-full max-w-3xl bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl">
            <CardHeader className="pb-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit -ml-2 text-muted-foreground"
                    onClick={() => setOnboardingStep('welcome')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Wstecz
                </Button>
                <CardTitle className="text-2xl">Podłącz konto social media</CardTitle>
                <p className="text-muted-foreground">
                    Typ konta zostanie wykryty automatycznie po połączeniu
                </p>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Account types explanation */}
                <div className="grid md:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                    {/* Business */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                            <Building2 className="w-5 h-5" />
                            <span className="font-semibold">Konto firmowe</span>
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                Autopilot AI - automatyczne publikacje
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                Harmonogram w kalendarzu
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                Publikacja bez Twojej ingerencji
                            </li>
                        </ul>
                    </div>

                    {/* Personal */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="w-5 h-5" />
                            <span className="font-semibold">Konto osobiste</span>
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                Kreator AI - generowanie treści
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                Zapisywanie w Materiałach
                            </li>
                            <li className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-yellow-500" />
                                Publikacja przez okno udostępniania
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Platform buttons */}
                <div className="space-y-3">
                    {platforms.map((platform) => (
                        <motion.div
                            key={platform.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full h-auto py-4 px-6 justify-between group hover:border-primary/50"
                                onClick={() => handleConnect(platform.id)}
                                disabled={isConnecting !== null}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: `${platform.color}20` }}
                                    >
                                        <platform.icon
                                            className="w-6 h-6"
                                            style={{ color: platform.color }}
                                        />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-foreground">{platform.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {platform.businessTypes.join(' • ')} lub {platform.personalTypes.join(' • ')}
                                        </p>
                                    </div>
                                </div>

                                {isConnecting === platform.id ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                ) : (
                                    <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    Połącz →
                  </span>
                                )}
                            </Button>
                        </motion.div>
                    ))}
                </div>

                {/* Skip option */}
                <div className="text-center pt-4 border-t border-border/50">
                    <Button
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={handleSkip}
                        disabled={isConnecting !== null}
                    >
                        Pomiń i przejdź do aplikacji
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}