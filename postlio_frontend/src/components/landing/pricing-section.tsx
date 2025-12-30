'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { PricingToggle } from './pricing-toggle';
import { PricingCard } from './pricing-card';

const pricingPlans = [
    {
        name: 'Starter',
        description: 'Idealny na początek przygody z AI',
        priceMonthly: 0,
        priceYearly: 0,
        cta: 'Zacznij za darmo',
        features: [
            { text: '50 postów AI / miesiąc', included: true },
            { text: '1 profil marki', included: true },
            { text: '2 platformy social media', included: true },
            { text: 'Kreator postów', included: true },
            { text: 'Podstawowe szablony', included: true },
            { text: 'Kalendarz publikacji', included: true },
            { text: 'Autopilot AI', included: false },
            { text: 'Brand Voice DNA', included: false },
            { text: 'Generowanie obrazów AI', included: false },
            { text: 'Priorytetowe wsparcie', included: false },
        ],
    },
    {
        name: 'Pro',
        description: 'Dla rosnących marek i twórców',
        priceMonthly: 79,
        priceYearly: 758,
        cta: 'Wypróbuj 14 dni za darmo',
        popular: true,
        features: [
            { text: 'Nielimitowane posty AI', included: true, highlight: true },
            { text: '5 profili marek', included: true },
            { text: 'Wszystkie platformy', included: true },
            { text: 'Kreator postów', included: true },
            { text: 'Wszystkie szablony', included: true },
            { text: 'Kalendarz publikacji', included: true },
            { text: 'Autopilot AI', included: true, highlight: true },
            { text: 'Brand Voice DNA', included: true, highlight: true },
            { text: '100 obrazów AI / miesiąc', included: true },
            { text: 'Email wsparcie', included: true },
        ],
    },
    {
        name: 'Business',
        description: 'Dla agencji i zespołów',
        priceMonthly: 199,
        priceYearly: 1910,
        cta: 'Skontaktuj się',
        features: [
            { text: 'Wszystko z Pro', included: true },
            { text: 'Nielimitowane profile marek', included: true, highlight: true },
            { text: 'Nielimitowane obrazy AI', included: true, highlight: true },
            { text: 'Dostęp dla zespołu (5 osób)', included: true },
            { text: 'White-label raporty', included: true },
            { text: 'API dostęp', included: true },
            { text: 'Dedykowany opiekun', included: true, highlight: true },
            { text: 'Szkolenie onboarding', included: true },
            { text: 'SLA 99.9%', included: true },
            { text: 'Priorytetowe wsparcie 24/7', included: true },
        ],
    },
];

export function PricingSection() {
    const [isYearly, setIsYearly] = useState(false);

    return (
        <section id="pricing" className="py-24 md:py-32 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-gradient-to-br from-primary/5 to-violet-500/5 blur-3xl -z-10" />

            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <Badge
                            variant="secondary"
                            className="mb-4 px-4 py-2 bg-primary/10 text-primary border-primary/20"
                        >
                            Cennik
                        </Badge>
                    </motion.div>

                    <motion.h2
                        className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        Wybierz plan{' '}
                        <span className="text-primary">dopasowany do Ciebie</span>
                    </motion.h2>

                    <motion.p
                        className="text-lg text-muted-foreground mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        Zacznij za darmo, skaluj gdy potrzebujesz. Bez ukrytych kosztów.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <PricingToggle isYearly={isYearly} onToggle={setIsYearly} />
                    </motion.div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-4 max-w-6xl mx-auto items-stretch">
                    {pricingPlans.map((plan, index) => (
                        <PricingCard
                            key={plan.name}
                            {...plan}
                            isYearly={isYearly}
                            index={index}
                        />
                    ))}
                </div>

                {/* Trust badges */}
                <motion.div
                    className="mt-16 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <svg
                                className="w-5 h-5 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                />
                            </svg>
                            <span>Bezpieczne płatności</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg
                                className="w-5 h-5 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            <span>Anuluj kiedy chcesz</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg
                                className="w-5 h-5 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                />
                            </svg>
                            <span>14 dni gwarancji zwrotu</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}