// src/components/onboarding/onboarding-welcome.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Rocket, Wand2, Calendar, Bot, ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { AppLogo } from '@/components/common/app-logo';

interface OnboardingWelcomeProps {
    userName?: string;
}

export function OnboardingWelcome({ userName }: OnboardingWelcomeProps) {
    const router = useRouter();
    const { setOnboardingStep, skipOnboarding } = useAuthStore();
    const [isSkipping, setIsSkipping] = useState(false);

    const firstName = userName?.split(' ')[0] || 'Użytkowniku';

    const features = [
        {
            icon: Wand2,
            title: 'Kreator AI',
            description: 'Twórz treści z AI',
        },
        {
            icon: Calendar,
            title: 'Harmonogram',
            description: 'Planuj posty',
        },
        {
            icon: Bot,
            title: 'Autopilot',
            description: 'Auto-publikacja',
        },
    ];

    const handleSkip = async () => {
        setIsSkipping(true);
        try {
            await skipOnboarding();
            router.push('/dashboard');
        } catch (error) {
            console.error('Skip error:', error);
            setIsSkipping(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl mx-4">
            <CardContent className="p-6 xs:p-8 md:p-12">
                <div className="flex items-center gap-2 xs:gap-3 mb-6 xs:mb-8">
                    <AppLogo className="h-10 w-10 xs:h-12 xs:w-12" />
                    <span className="text-xl xs:text-2xl font-bold bg-gradient-to-r from-violet-500 to-primary bg-clip-text text-transparent">
                        Postlio
                    </span>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h1 className="text-2xl xs:text-3xl md:text-4xl font-bold text-foreground mb-3 xs:mb-4">
                        Witaj, {firstName}! 🎉
                    </h1>
                    <p className="text-base xs:text-lg text-muted-foreground mb-6 xs:mb-8">
                        Twoje konto zostało utworzone. Jak chcesz rozpocząć?
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-3 gap-2 xs:gap-4 mb-6 xs:mb-8"
                >
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="text-center p-2 xs:p-4 rounded-xl bg-muted/50 border border-border/50"
                        >
                            <feature.icon className="w-6 h-6 xs:w-8 xs:h-8 mx-auto mb-1 xs:mb-2 text-primary" />
                            <p className="text-xs xs:text-sm font-medium text-foreground">{feature.title}</p>
                            <p className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 xs:mt-1 hidden xs:block">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3 xs:space-y-4"
                >
                    <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-violet-500 to-primary hover:from-violet-500/90 hover:to-primary/90 text-base xs:text-lg h-12 xs:h-14"
                        onClick={() => setOnboardingStep('connect')}
                        disabled={isSkipping}
                    >
                        <Rocket className="w-4 h-4 xs:w-5 xs:h-5 mr-2" />
                        <span className="hidden xs:inline">Podłącz konto social media</span>
                        <span className="xs:hidden">Podłącz konto</span>
                        <ArrowRight className="w-4 h-4 xs:w-5 xs:h-5 ml-2" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="lg"
                        className="w-full text-muted-foreground hover:text-foreground text-sm xs:text-base"
                        onClick={handleSkip}
                        disabled={isSkipping}
                    >
                        {isSkipping ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Pomijanie...
                            </>
                        ) : (
                            <>
                                <span className="hidden xs:inline">Chcę najpierw wypróbować bez konta</span>
                                <span className="xs:hidden">Pomiń na razie</span>
                            </>
                        )}
                    </Button>

                    <p className="text-[10px] xs:text-xs text-center text-muted-foreground">
                        Konto możesz podłączyć później w Ustawieniach
                    </p>
                </motion.div>
            </CardContent>
        </Card>
    );
}
