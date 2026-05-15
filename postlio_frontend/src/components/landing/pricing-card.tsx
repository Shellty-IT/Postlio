// src/components/landing/pricing-card.tsx
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface PricingFeature {
    text: string;
    included: boolean;
    highlight?: boolean;
}

interface PricingCardProps {
    name: string;
    description: string;
    priceMonthly: number;
    priceYearly: number;
    isYearly: boolean;
    features: PricingFeature[];
    popular?: boolean;
    cta: string;
    index: number;
}

export function PricingCard({
                                name,
                                description,
                                priceMonthly,
                                priceYearly,
                                isYearly,
                                features,
                                popular,
                                cta,
                                index,
                            }: PricingCardProps) {
    const price = isYearly ? priceYearly : priceMonthly;
    const monthlyEquivalent = isYearly ? Math.round(priceYearly / 12) : priceMonthly;

    return (
        <motion.div
            className={cn(
                'relative h-full',
                popular && 'z-10'
            )}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
        >
            {popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <Badge className="px-3 sm:px-4 py-1 text-xs sm:text-sm bg-gradient-to-r from-primary to-violet-500 text-white border-0 shadow-lg whitespace-nowrap">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Najpopularniejszy
                    </Badge>
                </div>
            )}

            <div
                className={cn(
                    'relative h-full p-5 xs:p-6 sm:p-8 rounded-2xl sm:rounded-3xl border transition-all duration-300',
                    popular
                        ? 'bg-gradient-to-b from-primary/5 to-violet-500/5 border-primary/30 shadow-xl shadow-primary/10 lg:scale-105'
                        : 'bg-card border-border/50 hover:border-primary/20 hover:shadow-lg'
                )}
            >
                {popular && (
                    <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-primary/10 to-transparent opacity-50" />
                )}

                <div className="relative z-10">
                    <div className="mb-4 sm:mb-6">
                        <h3 className="text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2">{name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
                    </div>

                    <div className="mb-4 sm:mb-6">
                        <div className="flex items-baseline gap-1.5 sm:gap-2">
                            <motion.span
                                key={price}
                                className="text-3xl xs:text-4xl sm:text-5xl font-bold"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {price === 0 ? 'Free' : `${price} zł`}
                            </motion.span>
                            {price > 0 && (
                                <span className="text-xs sm:text-sm text-muted-foreground">
                                    /{isYearly ? 'rok' : 'mies.'}
                                </span>
                            )}
                        </div>
                        {isYearly && price > 0 && (
                            <motion.p
                                className="text-xs sm:text-sm text-muted-foreground mt-1"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                czyli {monthlyEquivalent} zł/miesiąc
                            </motion.p>
                        )}
                    </div>

                    <Button
                        className={cn(
                            'w-full h-10 sm:h-12 mb-5 sm:mb-8 text-sm',
                            popular
                                ? 'bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-lg shadow-primary/25'
                                : ''
                        )}
                        variant={popular ? 'default' : 'outline'}
                        asChild
                    >
                        <Link href="/register">{cta}</Link>
                    </Button>

                    <div className="space-y-2.5 sm:space-y-3">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-3 sm:mb-4">
                            Zawiera:
                        </p>
                        {features.map((feature, featureIndex) => (
                            <motion.div
                                key={featureIndex}
                                className={cn(
                                    'flex items-start gap-2.5 sm:gap-3',
                                    !feature.included && 'opacity-40'
                                )}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: feature.included ? 1 : 0.4, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 + featureIndex * 0.05 }}
                            >
                                <div
                                    className={cn(
                                        'w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                                        feature.included
                                            ? feature.highlight
                                                ? 'bg-gradient-to-br from-primary to-violet-500'
                                                : 'bg-primary/20'
                                            : 'bg-muted'
                                    )}
                                >
                                    <Check
                                        className={cn(
                                            'w-2.5 h-2.5 sm:w-3 sm:h-3',
                                            feature.included
                                                ? feature.highlight
                                                    ? 'text-white'
                                                    : 'text-primary'
                                                : 'text-muted-foreground'
                                        )}
                                    />
                                </div>
                                <span
                                    className={cn(
                                        'text-xs sm:text-sm',
                                        feature.highlight && 'font-medium text-foreground'
                                    )}
                                >
                                    {feature.text}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}