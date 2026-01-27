// src/components/onboarding/onboarding-welcome.tsx
'use client';

import { motion } from 'framer-motion';
import { Sparkles, Rocket, Wand2, Calendar, Bot, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';

interface OnboardingWelcomeProps {
    userName?: string;
}

export function OnboardingWelcome({ userName }: OnboardingWelcomeProps) {
    const { setOnboardingStep, skipOnboarding } = useAuthStore();

    const firstName = userName?.split(' ')[0] || 'Użytkowniku';

    const features = [
        {
            icon: Wand2,
            title: 'Kreator AI',
            description: 'Twórz angażujące treści z pomocą AI',
        },
        {
            icon: Calendar,
            title: 'Harmonogram',
            description: 'Planuj posty w kalendarzu',
        },
        {
            icon: Bot,
            title: 'Autopilot AI',
            description: 'Automatyczna publikacja (konta firmowe)',
        },
    ];

    return (
        <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl">
            <CardContent className="p-8 md:p-12">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center shadow-lg shadow-violet-500/25">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-violet-500 to-primary bg-clip-text text-transparent">
            Postlio
          </span>
                </div>

                {/* Greeting */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Witaj, {firstName}! 🎉
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8">
                        Twoje konto zostało utworzone. Jak chcesz rozpocząć?
                    </p>
                </motion.div>

                {/* Features preview */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-3 gap-4 mb-8"
                >
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="text-center p-4 rounded-xl bg-muted/50 border border-border/50"
                        >
                            <feature.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                            <p className="text-sm font-medium text-foreground">{feature.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4"
                >
                    {/* Primary CTA - Connect account */}
                    <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-violet-500 to-primary hover:from-violet-500/90 hover:to-primary/90 text-lg h-14"
                        onClick={() => setOnboardingStep('connect')}
                    >
                        <Rocket className="w-5 h-5 mr-2" />
                        Podłącz konto social media
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>

                    {/* Secondary CTA - Skip */}
                    <Button
                        variant="ghost"
                        size="lg"
                        className="w-full text-muted-foreground hover:text-foreground"
                        onClick={skipOnboarding}
                    >
                        Chcę najpierw wypróbować bez konta
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        Konto możesz podłączyć później w Ustawieniach
                    </p>
                </motion.div>
            </CardContent>
        </Card>
    );
}