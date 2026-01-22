// src/app/(marketing)/features/page.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Sparkles,
    Zap,
    Calendar,
    Fingerprint,
    ArrowRight,
    Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
    {
        icon: Sparkles,
        title: 'Kreator AI',
        description: 'Twórz angażujące posty z pomocą sztucznej inteligencji. Wybierz ton, kategorię i platformę - AI zrobi resztę.',
        href: '/features/kreator-ai',
        color: 'from-violet-500 to-purple-600',
        highlights: [
            'Generowanie tekstu i obrazów',
            'Wsparcie wielu providerów AI',
            'Personalizacja tonu komunikacji',
        ],
    },
    {
        icon: Zap,
        title: 'Autopilot',
        description: 'Ustaw harmonogram i pozwól AI tworzyć oraz publikować posty automatycznie. Oszczędź godziny pracy tygodniowo.',
        href: '/features/autopilot',
        color: 'from-amber-500 to-orange-600',
        highlights: [
            'Automatyczne generowanie treści',
            'Inteligentny harmonogram',
            'Kolejka postów do zatwierdzenia',
        ],
    },
    {
        icon: Calendar,
        title: 'Kalendarz',
        description: 'Planuj publikacje na wszystkich platformach w jednym miejscu. Wizualny widok całego miesiąca.',
        href: '/features/kalendarz',
        color: 'from-blue-500 to-cyan-600',
        highlights: [
            'Drag & drop planowanie',
            'Widok dzienny, tygodniowy, miesięczny',
            'Synchronizacja z platformami',
        ],
    },
    {
        icon: Fingerprint,
        title: 'Brand Voice DNA',
        description: 'Zdefiniuj unikalny głos swojej marki. AI będzie generować treści zgodne z Twoją tożsamością.',
        href: '/features/brand-voice',
        color: 'from-emerald-500 to-teal-600',
        highlights: [
            'Analiza tonu i stylu',
            'Słowa kluczowe i hashtagi',
            'Wizualizacja DNA marki',
        ],
    },
];

export default function FeaturesPage() {
    return (
        <div className="container mx-auto px-4 py-16">
            {/* Hero */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-3xl mx-auto mb-16"
            >
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    Wszystkie funkcje{' '}
                    <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
                        Postlio
                    </span>
                </h1>
                <p className="text-xl text-muted-foreground">
                    Odkryj jak Postlio może zrewolucjonizować Twoje zarządzanie social media.
                    Od tworzenia treści po automatyczną publikację.
                </p>
            </motion.div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {features.map((feature, index) => (
                    <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Link href={feature.href} className="block group">
                            <div className="relative p-8 rounded-2xl border border-border/50 bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 h-full">
                                {/* Icon */}
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>

                                {/* Content */}
                                <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                                    {feature.title}
                                </h2>
                                <p className="text-muted-foreground mb-6">
                                    {feature.description}
                                </p>

                                {/* Highlights */}
                                <ul className="space-y-2 mb-6">
                                    {feature.highlights.map((highlight) => (
                                        <li key={highlight} className="flex items-center gap-2 text-sm">
                                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span>{highlight}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <div className="flex items-center gap-2 text-primary font-medium">
                                    Dowiedz się więcej
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>

            {/* Bottom CTA */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center mt-16"
            >
                <p className="text-muted-foreground mb-6">
                    Gotowy, żeby zacząć?
                </p>
                <Link href="/register">
                    <Button size="lg" className="bg-gradient-to-r from-blue-500 to-violet-500 text-white px-8">
                        Wypróbuj za darmo
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                </Link>
            </motion.div>
        </div>
    );
}