// src/components/onboarding/onboarding-connect.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    const router = useRouter();
    const { setOnboardingStep, startSocialLogin, skipOnboarding } = useAuthStore();
    const [isConnecting, setIsConnecting] = useState<SocialPlatform | null>(null);
    const [isSkipping, setIsSkipping] = useState(false);

    const handleConnect = async (platform: SocialPlatform) => {
        try {
            setIsConnecting(platform);
            startSocialLogin(platform, false, 'onboarding');

            const response = await initOAuth(platform);

            sessionStorage.setItem('oauth_state', response.state);
            sessionStorage.setItem('oauth_platform', platform);
            sessionStorage.setItem('oauth_context', 'onboarding');

            window.location.href = response.authorization_url;

        } catch (error) {
            console.error('OAuth init error:', error);
            toast.error(`Nie udało się połączyć z ${platform}`);
            setIsConnecting(null);
        }
    };

    const handleSkip = async () => {
        setIsSkipping(true);
        try {
            await skipOnboarding();
            router.push('/dashboard');
        } catch (error) {
            console.error('Skip error:', error);
            toast.error('Wystąpił błąd. Spróbuj ponownie.');
            setIsSkipping(false);
        }
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
            businessTypes: ['Instagram Business', 'Creator'],
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
        <Card className="w-full max-w-3xl bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl mx-4">
            <CardHeader className="pb-3 xs:pb-4 px-4 xs:px-6">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit -ml-2 text-muted-foreground"
                    onClick={() => setOnboardingStep('welcome')}
                    disabled={isSkipping || isConnecting !== null}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Wstecz
                </Button>
                <CardTitle className="text-xl xs:text-2xl">Podłącz konto social media</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Typ konta zostanie wykryty automatycznie
                </p>
            </CardHeader>

            <CardContent className="space-y-4 xs:space-y-6 px-4 xs:px-6">
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4 p-3 xs:p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                            <Building2 className="w-4 h-4 xs:w-5 xs:h-5" />
                            <span className="font-semibold text-sm xs:text-base">Konto firmowe</span>
                        </div>
                        <ul className="text-xs xs:text-sm text-muted-foreground space-y-1">
                            <li className="flex items-center gap-2">
                                <Check className="w-3 h-3 xs:w-4 xs:h-4 text-green-500 flex-shrink-0" />
                                <span>Autopilot AI</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-3 h-3 xs:w-4 xs:h-4 text-green-500 flex-shrink-0" />
                                <span>Auto-publikacja</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-3 h-3 xs:w-4 xs:h-4 text-green-500 flex-shrink-0" />
                                <span>Harmonogram</span>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="w-4 h-4 xs:w-5 xs:h-5" />
                            <span className="font-semibold text-sm xs:text-base">Konto osobiste</span>
                        </div>
                        <ul className="text-xs xs:text-sm text-muted-foreground space-y-1">
                            <li className="flex items-center gap-2">
                                <Check className="w-3 h-3 xs:w-4 xs:h-4 text-green-500 flex-shrink-0" />
                                <span>Kreator AI</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-3 h-3 xs:w-4 xs:h-4 text-green-500 flex-shrink-0" />
                                <span>Materiały</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Info className="w-3 h-3 xs:w-4 xs:h-4 text-yellow-500 flex-shrink-0" />
                                <span>Ręczna publikacja</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="space-y-2 xs:space-y-3">
                    {platforms.map((platform) => (
                        <motion.div
                            key={platform.id}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                        >
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full h-auto py-3 xs:py-4 px-3 xs:px-6 justify-between group hover:border-primary/50"
                                onClick={() => handleConnect(platform.id)}
                                disabled={isConnecting !== null || isSkipping}
                            >
                                <div className="flex items-center gap-3 xs:gap-4">
                                    <div
                                        className="w-10 h-10 xs:w-12 xs:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: `${platform.color}20` }}
                                    >
                                        <platform.icon
                                            className="w-5 h-5 xs:w-6 xs:h-6"
                                            style={{ color: platform.color }}
                                        />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-foreground text-sm xs:text-base">
                                            {platform.name}
                                        </p>
                                        <p className="text-[10px] xs:text-sm text-muted-foreground hidden xs:block">
                                            {platform.businessTypes.join(' • ')} lub {platform.personalTypes.join(' • ')}
                                        </p>
                                    </div>
                                </div>

                                {isConnecting === platform.id ? (
                                    <Loader2 className="w-4 h-4 xs:w-5 xs:h-5 animate-spin text-primary flex-shrink-0" />
                                ) : (
                                    <span className="text-xs xs:text-sm text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0">
                                        Połącz →
                                    </span>
                                )}
                            </Button>
                        </motion.div>
                    ))}
                </div>

                <div className="text-center pt-3 xs:pt-4 border-t border-border/50">
                    <Button
                        variant="ghost"
                        className="text-muted-foreground text-sm"
                        onClick={handleSkip}
                        disabled={isConnecting !== null || isSkipping}
                    >
                        {isSkipping ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Pomijanie...
                            </>
                        ) : (
                            'Pomiń i przejdź do aplikacji'
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}