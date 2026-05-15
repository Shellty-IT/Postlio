// src/components/landing/how-it-works-section.tsx
'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
    UserPlus,
    Palette,
    Rocket,
    Check,
    ArrowRight
} from 'lucide-react';

const steps = [
    {
        number: '01',
        icon: UserPlus,
        title: 'Załóż konto',
        description: 'Zarejestruj się za darmo w 30 sekund. Nie potrzebujesz karty kredytowej.',
        features: ['Darmowe konto', 'Bez zobowiązań', 'Natychmiastowy dostęp'],
        color: 'from-blue-500 to-cyan-500',
    },
    {
        number: '02',
        icon: Palette,
        title: 'Zdefiniuj markę',
        description: 'Stwórz profil marki z unikalnym Voice DNA. AI nauczy się Twojego stylu komunikacji.',
        features: ['Brand Voice DNA', 'Tone & Style', 'Hashtagi i emoji'],
        color: 'from-violet-500 to-purple-500',
    },
    {
        number: '03',
        icon: Rocket,
        title: 'Włącz Autopilota',
        description: 'Ustaw harmonogram, zatwierdź wygenerowane treści i obserwuj jak Twoja marka rośnie.',
        features: ['Automatyczne posty', 'Smart scheduling', 'Analityka wzrostu'],
        color: 'from-orange-500 to-red-500',
    },
];

export function HowItWorksSection() {
    return (
        <section id="how-it-works" className="py-16 xs:py-20 md:py-24 lg:py-32 bg-muted/30 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.02]">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                    }}
                />
            </div>

            <div className="container mx-auto px-4 relative">
                <div className="text-center max-w-3xl mx-auto mb-10 xs:mb-12 md:mb-16 lg:mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <Badge
                            variant="secondary"
                            className="mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-primary/10 text-primary border-primary/20"
                        >
                            Jak to działa
                        </Badge>
                    </motion.div>

                    <motion.h2
                        className="text-2xl xs:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        Zacznij w{' '}
                        <span className="text-primary">3 prostych krokach</span>
                    </motion.h2>

                    <motion.p
                        className="text-sm sm:text-base md:text-lg text-muted-foreground px-2"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        Od rejestracji do pierwszego posta w mniej niż 5 minut.
                        Żadnej skomplikowanej konfiguracji.
                    </motion.p>
                </div>

                <div className="relative">
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                className="relative"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.15 }}
                            >
                                <div className="relative p-5 xs:p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-card border border-border/50 h-full">
                                    <div className="absolute -top-5 left-6 sm:left-8">
                                        <motion.div
                                            className={`
                                                w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${step.color} 
                                                flex items-center justify-center text-white font-bold text-xs sm:text-sm
                                                shadow-lg
                                            `}
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                        >
                                            {step.number}
                                        </motion.div>
                                    </div>

                                    <div className="mt-3 sm:mt-4 mb-4 sm:mb-6">
                                        <motion.div
                                            className={`
                                                w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${step.color}/10
                                                flex items-center justify-center
                                            `}
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <step.icon
                                                className="w-6 h-6 sm:w-8 sm:h-8"
                                                style={{
                                                    color: step.color.includes('blue')
                                                        ? '#3B82F6'
                                                        : step.color.includes('violet')
                                                            ? '#8B5CF6'
                                                            : '#F97316'
                                                }}
                                            />
                                        </motion.div>
                                    </div>

                                    <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">{step.title}</h3>
                                    <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">{step.description}</p>

                                    <ul className="space-y-2">
                                        {step.features.map((feature, featureIndex) => (
                                            <motion.li
                                                key={featureIndex}
                                                className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground"
                                                initial={{ opacity: 0, x: -10 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: 0.3 + index * 0.15 + featureIndex * 0.05 }}
                                            >
                                                <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br ${step.color}/20 flex items-center justify-center flex-shrink-0`}>
                                                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                                                </div>
                                                {feature}
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>

                                {index < steps.length - 1 && (
                                    <div className="flex justify-center my-3 sm:my-4 lg:hidden">
                                        <motion.div
                                            animate={{ y: [0, 5, 0] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground/50 rotate-90" />
                                        </motion.div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}