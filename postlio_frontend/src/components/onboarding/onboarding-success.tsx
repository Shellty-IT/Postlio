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

    const lastAccount = connectedAccounts[connectedAccounts.length - 1];
    const isBusinessAccount = lastAccount?.is_business_account ?? false;

    const handleContinue = useCallback(() => {
        completeOnboarding();
        router.push('/dashboard');
    }, [completeOnboarding, router]);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleContinue();
        }, 10000);
        return () => clearTimeout(timer);
    }, [handleContinue]);

    return (
        <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl overflow-hidden mx-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 xs:p-8 text-white text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                >
                    <CheckCircle2 className="w-12 h-12 xs:w-16 xs:h-16 mx-auto mb-3 xs:mb-4" />
                </motion.div>
                <h2 className="text-xl xs:text-2xl font-bold mb-2">Połączono pomyślnie!</h2>
                {lastAccount && (
                    <p className="text-green-100 text-sm xs:text-base truncate px-4">
                        {lastAccount.display_name || lastAccount.platform_username}
                    </p>
                )}
            </div>

            <CardContent className="p-4 xs:p-6 sm:p-8">
                <div className="flex justify-center mb-4 xs:mb-6">
                    <Badge
                        variant={isBusinessAccount ? 'default' : 'secondary'}
                        className="text-xs xs:text-sm px-3 xs:px-4 py-1"
                    >
                        {isBusinessAccount ? '🏢 Konto firmowe' : '👤 Konto osobiste'}
                    </Badge>
                </div>

                <div className="space-y-2 xs:space-y-3 mb-6 xs:mb-8">
                    {isBusinessAccount ? (
                        <>
                            <FeatureItem
                                icon={Rocket}
                                title="Kreator AI"
                                description="Twórz treści z AI"
                                available
                            />
                            <FeatureItem
                                icon={Calendar}
                                title="Harmonogram"
                                description="Auto-publikacja"
                                available
                            />
                            <FeatureItem
                                icon={Bot}
                                title="Autopilot AI"
                                description="Pełna automatyzacja"
                                available
                            />
                        </>
                    ) : (
                        <>
                            <FeatureItem
                                icon={Rocket}
                                title="Kreator AI"
                                description="Twórz treści z AI"
                                available
                            />
                            <FeatureItem
                                icon={Calendar}
                                title="Harmonogram"
                                description="Jako przypomnienia"
                                available
                                limited
                            />
                            <FeatureItem
                                icon={Copy}
                                title="Publikacja"
                                description="Przez okno udostępniania"
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

                {!isBusinessAccount && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-4 xs:mb-6 p-3 xs:p-4 rounded-xl bg-violet-500/10 border border-violet-500/20"
                    >
                        <p className="text-xs xs:text-sm text-foreground">
                            💡 <strong>Wskazówka:</strong> Podłącz konto firmowe, aby odblokować Autopilot AI.
                        </p>
                    </motion.div>
                )}

                <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-violet-500 to-primary hover:from-violet-500/90 hover:to-primary/90 h-11 xs:h-12"
                    onClick={handleContinue}
                >
                    <span className="text-sm xs:text-base">Przejdź do Dashboard</span>
                    <ArrowRight className="w-4 h-4 xs:w-5 xs:h-5 ml-2" />
                </Button>
            </CardContent>
        </Card>
    );
}

interface FeatureItemProps {
    icon: React.ElementType;
    title: string;
    description: string;
    available: boolean;
    limited?: boolean;
}

function FeatureItem({ icon: Icon, title, description, available, limited }: FeatureItemProps) {
    return (
        <div className={`flex items-center gap-3 xs:gap-4 p-2.5 xs:p-3 rounded-lg ${
            available ? 'bg-muted/50' : 'bg-muted/20 opacity-50'
        }`}>
            <div className={`w-8 h-8 xs:w-10 xs:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                available
                    ? limited
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-green-500/20 text-green-500'
                    : 'bg-muted text-muted-foreground'
            }`}>
                <Icon className="w-4 h-4 xs:w-5 xs:h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 xs:gap-2 flex-wrap">
                    <p className="font-medium text-foreground text-sm xs:text-base">{title}</p>
                    {limited && (
                        <Badge variant="outline" className="text-[10px] xs:text-xs px-1.5">Ograniczony</Badge>
                    )}
                    {!available && (
                        <Badge variant="outline" className="text-[10px] xs:text-xs px-1.5">Zablokowany</Badge>
                    )}
                </div>
                <p className="text-xs xs:text-sm text-muted-foreground truncate">{description}</p>
            </div>
            {available && !limited && (
                <CheckCircle2 className="w-4 h-4 xs:w-5 xs:h-5 text-green-500 flex-shrink-0" />
            )}
        </div>
    );
}