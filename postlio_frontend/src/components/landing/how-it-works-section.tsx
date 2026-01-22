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
        <section id="how-it-works" className="py-24 md:py-32 bg-muted/30 relative overflow-hidden">
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
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
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
                            Jak to działa
                        </Badge>
                    </motion.div>

                    <motion.h2
                        className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        Zacznij w{' '}
                        <span className="text-primary">3 prostych krokach</span>
                    </motion.h2>

                    <motion.p
                        className="text-lg text-muted-foreground"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        Od rejestracji do pierwszego posta w mniej niż 5 minut.
                        Żadnej skomplikowanej konfiguracji.
                    </motion.p>
                </div>

                {/* Steps */}
                <div className="relative">
                    {/* Connection line - desktop */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                className="relative"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.15 }}
                            >
                                {/* Card */}
                                <div className="relative p-8 rounded-3xl bg-card border border-border/50 h-full">
                                    {/* Step number */}
                                    <div className="absolute -top-5 left-8">
                                        <motion.div
                                            className={`
                                                w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} 
                                                flex items-center justify-center text-white font-bold text-sm
                                                shadow-lg
                                            `}
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                        >
                                            {step.number}
                                        </motion.div>
                                    </div>

                                    {/* Icon */}
                                    <div className="mt-4 mb-6">
                                        <motion.div
                                            className={`
                                                w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color}/10
                                                flex items-center justify-center
                                            `}
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <step.icon
                                                className="w-8 h-8"
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

                                    {/* Content */}
                                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                                    <p className="text-muted-foreground mb-6">{step.description}</p>

                                    {/* Features list */}
                                    <ul className="space-y-2">
                                        {step.features.map((feature, featureIndex) => (
                                            <motion.li
                                                key={featureIndex}
                                                className="flex items-center gap-2 text-sm text-muted-foreground"
                                                initial={{ opacity: 0, x: -10 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: 0.3 + index * 0.15 + featureIndex * 0.05 }}
                                            >
                                                <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${step.color}/20 flex items-center justify-center flex-shrink-0`}>
                                                    <Check className="w-3 h-3 text-primary" />
                                                </div>
                                                {feature}
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Arrow between steps - mobile */}
                                {index < steps.length - 1 && (
                                    <div className="flex justify-center my-4 lg:hidden">
                                        <motion.div
                                            animate={{ y: [0, 5, 0] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <ArrowRight className="w-6 h-6 text-muted-foreground/50 rotate-90" />
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