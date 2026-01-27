// src/components/common/feature-locked.tsx
'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Lock,
    Calendar,
    Bot,
    Building2,
    User,
    ArrowRight,
    Sparkles,
    Check,
    Info,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { AccessLevel } from '@/types';

// ============================================================
// TYPES
// ============================================================

type FeatureType = 'calendar' | 'autopilot';

interface FeatureLockedProps {
    feature: FeatureType;
    accessLevel: AccessLevel;
    title?: string;
    description?: string;
    onConnectAccount?: () => void;
}

// ============================================================
// FEATURE CONFIGS
// ============================================================

const featureConfigs: Record<FeatureType, {
    icon: typeof Lock;
    title: string;
    demoMessage: string;
    limitedMessage: string;
    requirements: {
        demo: string[];
        limited: string[];
    };
    businessAccountTypes: string[];
}> = {
    calendar: {
        icon: Calendar,
        title: 'Kalendarz',
        demoMessage: 'Podłącz konto social media aby korzystać z kalendarza',
        limitedMessage: 'Kalendarz działa w trybie przypomnienia - automatyczna publikacja wymaga konta firmowego',
        requirements: {
            demo: [
                'Podłącz dowolne konto social media',
                'Planuj posty w kalendarzu',
                'Otrzymuj przypomnienia o publikacji',
            ],
            limited: [
                'Podłącz konto firmowe aby odblokować automatyczną publikację',
                'Strona Facebook, Instagram Business/Creator lub Strona LinkedIn',
            ],
        },
        businessAccountTypes: ['Strona Facebook', 'Instagram Business', 'Instagram Creator', 'Strona firmowa LinkedIn'],
    },
    autopilot: {
        icon: Bot,
        title: 'Autopilot AI',
        demoMessage: 'Podłącz konto firmowe aby korzystać z Autopilota',
        limitedMessage: 'Autopilot wymaga konta firmowego z możliwością automatycznej publikacji',
        requirements: {
            demo: [
                'Automatyczne generowanie postów z AI',
                'Harmonogram publikacji',
                'Publikacja bez Twojej ingerencji',
            ],
            limited: [
                'Twoje konto osobiste nie wspiera automatycznej publikacji',
                'Regulamin platform wymaga konta firmowego dla automatyzacji',
            ],
        },
        businessAccountTypes: ['Strona Facebook', 'Instagram Business', 'Instagram Creator', 'Strona firmowa LinkedIn'],
    },
};

// ============================================================
// COMPONENT
// ============================================================

export function FeatureLocked({
                                  feature,
                                  accessLevel,
                                  title,
                                  description,
                                  onConnectAccount,
                              }: FeatureLockedProps) {
    const router = useRouter();
    const config = featureConfigs[feature];
    const Icon = config.icon;

    const handleConnect = () => {
        if (onConnectAccount) {
            onConnectAccount();
        } else {
            router.push('/settings?tab=accounts');
        }
    };

    // Dla kalendarz z limited - pokaż warning, nie blokuj całkowicie
    if (feature === 'calendar' && accessLevel === 'limited') {
        return null; // Kalendarz działa dla limited, tylko z warningiem
    }

    const message = accessLevel === 'demo'
        ? config.demoMessage
        : config.limitedMessage;

    const requirements = accessLevel === 'demo'
        ? config.requirements.demo
        : config.requirements.limited;

    return (
        <div className="flex items-center justify-center min-h-[60vh] p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-lg"
            >
                <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-xl overflow-hidden">
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-br from-violet-500/20 via-primary/20 to-violet-500/10 p-8 text-center relative">
                        <div className="absolute inset-0 bg-grid-white/5" />
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.1 }}
                            className="relative"
                        >
                            <div className="w-20 h-20 mx-auto rounded-2xl bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center shadow-lg">
                                <Lock className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                <Icon className="w-4 h-4 text-primary-foreground" />
                            </div>
                        </motion.div>
                    </div>

                    <CardContent className="p-6 space-y-6">
                        {/* Title */}
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-foreground">
                                {title || config.title}
                            </h2>
                            <p className="text-muted-foreground mt-2">
                                {description || message}
                            </p>
                        </div>

                        {/* What you'll get */}
                        <div className="space-y-3">
                            <p className="text-sm font-medium text-foreground">
                                {accessLevel === 'demo' ? 'Po podłączeniu konta:' : 'Z kontem firmowym:'}
                            </p>
                            <ul className="space-y-2">
                                {requirements.map((req, index) => (
                                    <motion.li
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                        className="flex items-start gap-3"
                                    >
                                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Check className="w-3 h-3 text-primary" />
                                        </div>
                                        <span className="text-sm text-muted-foreground">{req}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>

                        {/* Account types */}
                        <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                            <div className="flex items-center gap-2 mb-3">
                                <Building2 className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium text-foreground">
                  Obsługiwane konta firmowe:
                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {config.businessAccountTypes.map((type) => (
                                    <span
                                        key={type}
                                        className="text-xs px-2 py-1 rounded-full bg-background border border-border text-muted-foreground"
                                    >
                    {type}
                  </span>
                                ))}
                            </div>
                        </div>

                        {/* Info for limited */}
                        {accessLevel === 'limited' && (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                                <Info className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-foreground">
                                    Twoje obecne konto osobiste nie pozwala na automatyczną publikację.
                                    Regulamin platform wymaga konta firmowego dla automatyzacji.
                                </p>
                            </div>
                        )}

                        {/* CTA */}
                        <Button
                            size="lg"
                            className="w-full bg-gradient-to-r from-violet-500 to-primary hover:from-violet-500/90 hover:to-primary/90"
                            onClick={handleConnect}
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Podłącz konto
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

// ============================================================
// CALENDAR WARNING BANNER
// ============================================================

interface CalendarLimitedBannerProps {
    onUpgrade?: () => void;
}

export function CalendarLimitedBanner({ onUpgrade }: CalendarLimitedBannerProps) {
    const router = useRouter();

    const handleUpgrade = () => {
        if (onUpgrade) {
            onUpgrade();
        } else {
            router.push('/settings?tab=accounts');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
        >
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground">
                        Konto osobiste - tylko przypomnienia
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Automatyczna publikacja wymaga konta firmowego.
                        Posty zostaną zapisane jako przypomnienia - opublikujesz je ręcznie.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUpgrade}
                    className="flex-shrink-0"
                >
                    Podłącz firmowe
                </Button>
            </div>
        </motion.div>
    );
}

// ============================================================
// EXPORTS
// ============================================================

export default FeatureLocked;