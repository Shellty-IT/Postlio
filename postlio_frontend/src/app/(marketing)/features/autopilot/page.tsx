// src/app/(marketing)/features/autopilot/page.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Zap,
    Clock,
    Calendar,
    Brain,
    TrendingUp,
    Shield,
    Settings,
    Pause,
    BarChart3,
    ArrowRight,
    Check,
    ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const capabilities = [
    {
        icon: Brain,
        title: 'Inteligentne generowanie',
        description: 'AI tworzy treści zgodne z Twoim Brand Voice DNA. Każdy post brzmi jak Ty.',
    },
    {
        icon: Calendar,
        title: 'Smart harmonogram',
        description: 'System wybiera optymalne godziny publikacji dla maksymalnego zasięgu.',
    },
    {
        icon: Shield,
        title: 'Kolejka do zatwierdzenia',
        description: 'Przeglądaj i zatwierdzaj posty przed publikacją. Pełna kontrola.',
    },
    {
        icon: TrendingUp,
        title: 'Analiza wyników',
        description: 'Śledź engagement i optymalizuj strategię na podstawie danych.',
    },
    {
        icon: Settings,
        title: 'Elastyczna konfiguracja',
        description: 'Ustaw częstotliwość, kategorie, platformy - wszystko pod Twoje potrzeby.',
    },
    {
        icon: BarChart3,
        title: 'Raporty i statystyki',
        description: 'Cotygodniowe podsumowania efektywności Twojego autopilota.',
    },
];

const steps = [
    {
        number: '01',
        title: 'Skonfiguruj markę',
        description: 'Zdefiniuj Brand Voice DNA - ton, styl, słowa kluczowe.',
    },
    {
        number: '02',
        title: 'Ustaw harmonogram',
        description: 'Wybierz dni, godziny i częstotliwość publikacji.',
    },
    {
        number: '03',
        title: 'Włącz Autopilot',
        description: 'AI zaczyna generować treści według Twoich ustawień.',
    },
    {
        number: '04',
        title: 'Zatwierdzaj i publikuj',
        description: 'Przeglądaj kolejkę, zatwierdzaj lub edytuj przed publikacją.',
    },
];

const faqs = [
    {
        question: 'Czy Autopilot publikuje bez mojej zgody?',
        answer: 'Nie! Każdy wygenerowany post trafia do kolejki oczekujących. Możesz go przejrzeć, edytować lub odrzucić przed publikacją. Masz pełną kontrolę.',
    },
    {
        question: 'Jak często Autopilot generuje posty?',
        answer: 'To zależy od Twoich ustawień. Możesz ustawić od 1 posta tygodniowo do nawet 3 postów dziennie. Rekomendujemy 3-5 postów tygodniowo dla optymalnego engagement.',
    },
    {
        question: 'Czy mogę wstrzymać Autopilot?',
        answer: 'Tak, w każdej chwili możesz wstrzymać lub wyłączyć Autopilot. Twoje ustawienia zostaną zachowane do ponownego uruchomienia.',
    },
    {
        question: 'Jak Autopilot wie o czym pisać?',
        answer: 'Autopilot korzysta z Twojego Brand Voice DNA, wybranych kategorii tematycznych i analizy trendów. Możesz też dodać konkretne tematy do kolejki.',
    },
];

const stats = [
    { value: '10+', label: 'godzin oszczędności tygodniowo' },
    { value: '3x', label: 'więcej regularnych publikacji' },
    { value: '24/7', label: 'praca bez przerwy' },
];

export default function AutopilotPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div>
            {/* Hero */}
            <section className="container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-500 mb-6"
                    >
                        <Zap className="w-4 h-4" />
                        <span className="text-sm font-medium">Autopilot</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-bold mb-6"
                    >
                        Social media na{' '}
                        <span className="bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                            autopilocie
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
                    >
                        Ustaw harmonogram, zdefiniuj styl - AI zajmie się resztą.
                        Regularne publikacje bez codziennego wysiłku.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Link href="/register">
                            <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8">
                                Włącz Autopilot
                                <Zap className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                        <Link href="/features">
                            <Button size="lg" variant="outline">
                                Zobacz inne funkcje
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Stats */}
            <section className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            className="text-center"
                        >
                            <div className="text-3xl md:text-4xl font-bold text-amber-500 mb-1">
                                {stat.value}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Problem → Solution */}
            <section className="bg-muted/30 py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl font-bold mb-4">
                                Codzienne publikowanie jest wyczerpujące
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Algorytmy social media wymagają regularności. Ale kto ma czas
                                codziennie tworzyć nowe treści? Życie, praca, inne obowiązki...
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Brak czasu na codzienne tworzenie',
                                    'Nieregularne publikacje = spadek zasięgów',
                                    'Wypalenie content creatora',
                                    'Trudność w planowaniu z wyprzedzeniem',
                                ].map((problem) => (
                                    <li key={problem} className="flex items-center gap-3 text-muted-foreground">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        {problem}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl font-bold mb-4">
                                Autopilot pracuje za Ciebie
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Raz skonfigurowany Autopilot generuje i planuje posty automatycznie.
                                Ty tylko zatwierdzasz to co Ci się podoba.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Ustaw raz - działa cały czas',
                                    'Regularne publikacje = rosnące zasięgi',
                                    'Więcej czasu na inne rzeczy',
                                    'Posty gotowe na tygodnie do przodu',
                                ].map((solution) => (
                                    <li key={solution} className="flex items-center gap-3">
                                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        {solution}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Visual Demo */}
            <section className="container mx-auto px-4 py-16 md:py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Prosta kontrola
                        </h2>
                        <p className="text-muted-foreground">
                            Jedno kliknięcie włącza lub wyłącza automatyzację
                        </p>
                    </div>

                    {/* Mock Autopilot Control */}
                    <div className="bg-card border border-border/50 rounded-2xl p-8 md:p-12">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                    <Zap className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold mb-1">Autopilot</h3>
                                    <p className="text-muted-foreground">3 posty tygodniowo • Pon, Śr, Pt o 10:00</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-500">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="font-medium">Aktywny</span>
                                </div>
                                <Button variant="outline" size="lg" className="gap-2">
                                    <Pause className="w-5 h-5" />
                                    Wstrzymaj
                                </Button>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-border/50">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold">12</div>
                                    <div className="text-sm text-muted-foreground">Postów w kolejce</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">47</div>
                                    <div className="text-sm text-muted-foreground">Opublikowanych</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">89%</div>
                                    <div className="text-sm text-muted-foreground">Wskaźnik zatwierdzenia</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* How it works */}
            <section className="bg-muted/30 py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Jak uruchomić Autopilot?
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            4 kroki do automatyzacji social media
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center"
                            >
                                <div className="text-5xl font-bold text-amber-500/20 mb-4">
                                    {step.number}
                                </div>
                                <h3 className="font-semibold mb-2">{step.title}</h3>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Capabilities */}
            <section className="container mx-auto px-4 py-16 md:py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Co potrafi Autopilot?
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Pełna automatyzacja z zachowaniem kontroli
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {capabilities.map((cap, index) => (
                        <motion.div
                            key={cap.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="p-6 rounded-xl bg-card border border-border/50"
                        >
                            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                                <cap.icon className="w-6 h-6 text-amber-500" />
                            </div>
                            <h3 className="font-semibold mb-2">{cap.title}</h3>
                            <p className="text-sm text-muted-foreground">{cap.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section className="bg-muted/30 py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Często zadawane pytania
                        </h2>
                    </motion.div>

                    <div className="max-w-2xl mx-auto space-y-4">
                        {faqs.map((faq, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="border border-border/50 rounded-lg overflow-hidden bg-background"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                                >
                                    <span className="font-medium">{faq.question}</span>
                                    <ChevronDown
                                        className={`w-5 h-5 text-muted-foreground transition-transform ${
                                            openFaq === index ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>
                                {openFaq === index && (
                                    <div className="px-4 pb-4 text-muted-foreground">
                                        {faq.answer}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="container mx-auto px-4 py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto text-center p-12 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20"
                >
                    <Clock className="w-12 h-12 text-amber-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold mb-4">
                        Odzyskaj swój czas
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        Przestań codziennie martwić się o posty. Włącz Autopilot i skup się na tym, co ważne.
                    </p>
                    <Link href="/register">
                        <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8">
                            Włącz Autopilot za darmo
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                </motion.div>
            </section>
        </div>
    );
}