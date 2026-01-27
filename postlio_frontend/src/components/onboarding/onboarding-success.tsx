// src/components/onboarding/onboarding-success.tsx
'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    CheckCircle2,
    ArrowRight,
    Rocket,
    Calendar,
    Bot,
    Copy,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth-store';

export function OnboardingSuccess() {
    const router = useRouter();
    const {
        connectedAccounts,
        completeOnboarding,
    } = useAuthStore();

    // Znajdź ostatnio podłączone konto
    const lastAccount = connectedAccounts[connectedAccounts.length - 1];
    const isBusinessAccount = lastAccount?.is_business_account ?? false;

    const handleContinue = useCallback(() => {
        completeOnboarding();
        router.push('/dashboard');
    }, [completeOnboarding, router]);

    // Auto-redirect po 10 sekundach
    useEffect(() => {
        const timer = setTimeout(() => {
            handleContinue();
        }, 10000);
        return () => clearTimeout(timer);
    }, [handleContinue]);

    return (
        <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl overflow-hidden">
            {/* Success header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-white text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                >
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Połączono pomyślnie!</h2>
                {lastAccount && (
                    <p className="text-green-100">
                        {lastAccount.display_name || lastAccount.platform_username}
                    </p>
                )}
            </div>

            <CardContent className="p-8">
                {/* Account type badge */}
                <div className="flex justify-center mb-6">
                    <Badge
                        variant={isBusinessAccount ? 'default' : 'secondary'}
                        className="text-sm px-4 py-1"
                    >
                        {isBusinessAccount ? '🏢 Konto firmowe' : '👤 Konto osobiste'}
                    </Badge>
                </div>

                {/* Features based on account type */}
                <div className="space-y-3 mb-8">
                    {isBusinessAccount ? (
                        <>
                            <FeatureItem
                                icon={Rocket}
                                title="Kreator AI"
                                description="Twórz angażujące treści z pomocą AI"
                                available
                            />
                            <FeatureItem
                                icon={Calendar}
                                title="Harmonogram"
                                description="Planuj posty i publikuj automatycznie"
                                available
                            />
                            <FeatureItem
                                icon={Bot}
                                title="Autopilot AI"
                                description="Automatyczne generowanie i publikacja"
                                available
                            />
                        </>
                    ) : (
                        <>
                            <FeatureItem
                                icon={Rocket}
                                title="Kreator AI"
                                description="Twórz angażujące treści z pomocą AI"
                                available
                            />
                            <FeatureItem
                                icon={Calendar}
                                title="Harmonogram"
                                description="Planuj posty jako przypomnienia"
                                available
                                limited
                            />
                            <FeatureItem
                                icon={Copy}
                                title="Publikacja"
                                description="Przez okno udostępniania platformy"
                                available
                            />
                            <FeatureItem
                                icon={Bot}
                                title="Autopilot AI"
                                description="Wymaga konta firmowego"
                                available={false}
                            />
                        </>
                    )}
                </div>

                {/* Upgrade message for personal accounts */}
                {!isBusinessAccount && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-6 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20"
                    >
                        <p className="text-sm text-foreground">
                            💡 <strong>Wskazówka:</strong> Aby odblokować Autopilot AI i automatyczną publikację,
                            podłącz konto firmowe (Stronę Facebook, Instagram Business lub Stronę LinkedIn).
                        </p>
                    </motion.div>
                )}

                {/* CTA */}
                <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-violet-500 to-primary hover:from-violet-500/90 hover:to-primary/90"
                    onClick={handleContinue}
                >
                    Przejdź do Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
            </CardContent>
        </Card>
    );
}

// Helper component
interface FeatureItemProps {
    icon: React.ElementType;
    title: string;
    description: string;
    available: boolean;
    limited?: boolean;
}

function FeatureItem({ icon: Icon, title, description, available, limited }: FeatureItemProps) {
    return (
        <div className={`flex items-center gap-4 p-3 rounded-lg ${
            available ? 'bg-muted/50' : 'bg-muted/20 opacity-50'
        }`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                available
                    ? limited
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-green-500/20 text-green-500'
                    : 'bg-muted text-muted-foreground'
            }`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{title}</p>
                    {limited && (
                        <Badge variant="outline" className="text-xs">Ograniczony</Badge>
                    )}
                    {!available && (
                        <Badge variant="outline" className="text-xs">Zablokowany</Badge>
                    )}
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {available && !limited && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
        </div>
    );
}