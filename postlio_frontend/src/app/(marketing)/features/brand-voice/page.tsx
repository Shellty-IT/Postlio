// src/app/(marketing)/features/brand-voice/page.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Fingerprint,
    Sliders,
    Palette,
    MessageCircle,
    Hash,
    Ban,
    FileText,
    Radar,
    Sparkles,
    ArrowRight,
    Check,
    ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const capabilities = [
    {
        icon: Sliders,
        title: 'Suwaki tonu',
        description: 'Ustaw poziom formalności, energii, humoru i emocjonalności.',
    },
    {
        icon: Palette,
        title: 'Cechy osobowości',
        description: 'Wybierz cechy marki: innowacyjna, przyjazna, profesjonalna...',
    },
    {
        icon: MessageCircle,
        title: 'Style komunikacji',
        description: 'Informacyjny, casualowy, inspirujący - jak chcesz mówić?',
    },
    {
        icon: Hash,
        title: 'Hashtagi i słowa kluczowe',
        description: 'Zdefiniuj słowa, które AI będzie używać w postach.',
    },
    {
        icon: Ban,
        title: 'Zakazane słowa',
        description: 'Lista słów, których AI nigdy nie użyje.',
    },
    {
        icon: FileText,
        title: 'Przykładowe posty',
        description: 'Dodaj przykłady idealnych postów jako wzorzec dla AI.',
    },
];

const steps = [
    {
        number: '01',
        title: 'Stwórz markę',
        description: 'Dodaj nazwę, opis i kolory swojej marki.',
    },
    {
        number: '02',
        title: 'Ustaw ton głosu',
        description: 'Użyj suwaków żeby określić charakter komunikacji.',
    },
    {
        number: '03',
        title: 'Dodaj szczegóły',
        description: 'Słowa kluczowe, hashtagi, przykładowe posty.',
    },
    {
        number: '04',
        title: 'AI się uczy',
        description: 'Od teraz AI generuje treści w Twoim stylu.',
    },
];

const faqs = [
    {
        question: 'Czym jest Brand Voice DNA?',
        answer: 'To cyfrowy "odcisk palca" Twojej marki. Zbiór ustawień definiujących jak marka komunikuje się z odbiorcami - ton, styl, słownictwo. AI używa tego do generowania spójnych treści.',
    },
    {
        question: 'Ile marek mogę mieć?',
        answer: 'W planie podstawowym możesz mieć do 3 marek. Plany premium oferują nielimitowaną liczbę marek.',
    },
    {
        question: 'Czy AI naprawdę dopasowuje się do mojego stylu?',
        answer: 'Tak! AI analizuje Twoje ustawienia Voice DNA i przykładowe posty, żeby generować treści brzmiące jak Ty. Im więcej przykładów dodasz, tym lepsze dopasowanie.',
    },
    {
        question: 'Czy mogę mieć różne Voice DNA dla różnych platform?',
        answer: 'Tak, każda marka może mieć różne ustawienia dla Facebooka, Instagrama i LinkedIna. LinkedIn bardziej formalny, Instagram luźniejszy - Ty decydujesz.',
    },
];

// Mock radar chart data
const radarPoints = [
    { label: 'Formalność', value: 70 },
    { label: 'Energia', value: 85 },
    { label: 'Humor', value: 40 },
    { label: 'Emocjonalność', value: 60 },
    { label: 'Eksperckość', value: 75 },
    { label: 'Bezpośredniość', value: 80 },
];

export default function BrandVoicePage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div>
            {/* Hero */}
            <section className="container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 mb-6"
                    >
                        <Fingerprint className="w-4 h-4" />
                        <span className="text-sm font-medium">Brand Voice DNA</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-bold mb-6"
                    >
                        Twój unikalny{' '}
                        <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                            głos marki
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
                    >
                        Zdefiniuj tożsamość swojej marki. AI będzie generować treści,
                        które brzmią dokładnie jak Ty - spójnie i autentycznie.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Link href="/register">
                            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8">
                                Stwórz Voice DNA
                                <Fingerprint className="w-5 h-5 ml-2" />
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

            {/* Voice DNA Visualization */}
            <section className="container mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="bg-card border border-border/50 rounded-2xl p-8 md:p-12">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            {/* Radar Chart Mock */}
                            <div className="relative aspect-square max-w-xs mx-auto">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {/* Circular grid */}
                                    <div className="absolute inset-4 rounded-full border border-border/30" />
                                    <div className="absolute inset-12 rounded-full border border-border/30" />
                                    <div className="absolute inset-20 rounded-full border border-border/30" />

                                    {/* Center icon */}
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center z-10">
                                        <Radar className="w-8 h-8 text-white" />
                                    </div>
                                </div>

                                {/* Data points */}
                                {radarPoints.map((point, index) => {
                                    const angle = (index * 360) / radarPoints.length - 90;
                                    const radius = (point.value / 100) * 45;
                                    const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
                                    const y = 50 + radius * Math.sin((angle * Math.PI) / 180);

                                    return (
                                        <div
                                            key={point.label}
                                            className="absolute w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"
                                            style={{
                                                left: `${x}%`,
                                                top: `${y}%`,
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        />
                                    );
                                })}

                                {/* Labels */}
                                {radarPoints.map((point, index) => {
                                    const angle = (index * 360) / radarPoints.length - 90;
                                    const x = 50 + 55 * Math.cos((angle * Math.PI) / 180);
                                    const y = 50 + 55 * Math.sin((angle * Math.PI) / 180);

                                    return (
                                        <div
                                            key={`label-${point.label}`}
                                            className="absolute text-xs text-muted-foreground whitespace-nowrap"
                                            style={{
                                                left: `${x}%`,
                                                top: `${y}%`,
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        >
                                            {point.label}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Sliders preview */}
                            <div className="space-y-4">
                                <h3 className="font-semibold mb-4">Twój profil Voice DNA</h3>
                                {radarPoints.map((point) => (
                                    <div key={point.label} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>{point.label}</span>
                                            <span className="text-muted-foreground">{point.value}%</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${point.value}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.8, delay: 0.2 }}
                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
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
                                AI pisze generycznie
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Standardowe narzędzia AI generują treści, które brzmią... jak AI.
                                Sztywne, bezosobowe, pozbawione charakteru Twojej marki.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Posty brzmią jak od robota',
                                    'Brak spójności w komunikacji',
                                    'Utrata autentycznego głosu marki',
                                    'Każdy post trzeba mocno edytować',
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
                                AI pisze jak Ty
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Z Brand Voice DNA, AI rozumie Twoją markę. Generuje treści,
                                które brzmią autentycznie - jakbyś pisał je sam.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Naturalny, ludzki język',
                                    'Spójna komunikacja we wszystkich postach',
                                    'Twój unikalny styl zachowany',
                                    'Gotowe treści od razu do publikacji',
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

            {/* How it works */}
            <section className="container mx-auto px-4 py-16 md:py-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Jak stworzyć Voice DNA?
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        4 kroki do unikalnego głosu marki
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
                            <div className="text-5xl font-bold text-emerald-500/20 mb-4">
                                {step.number}
                            </div>
                            <h3 className="font-semibold mb-2">{step.title}</h3>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Capabilities */}
            <section className="bg-muted/30 py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Co definiuje Voice DNA?
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Pełna kontrola nad głosem Twojej marki
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
                                className="p-6 rounded-xl bg-background border border-border/50"
                            >
                                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                                    <cap.icon className="w-6 h-6 text-emerald-500" />
                                </div>
                                <h3 className="font-semibold mb-2">{cap.title}</h3>
                                <p className="text-sm text-muted-foreground">{cap.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="container mx-auto px-4 py-16 md:py-24">
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
                            className="border border-border/50 rounded-lg overflow-hidden"
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
            </section>

            {/* CTA */}
            <section className="container mx-auto px-4 py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto text-center p-12 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/20"
                >
                    <Sparkles className="w-12 h-12 text-emerald-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold mb-4">
                        Daj AI swój głos
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        Stwórz Voice DNA i pozwól AI tworzyć treści, które brzmią autentycznie jak Ty.
                    </p>
                    <Link href="/register">
                        <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8">
                            Stwórz Voice DNA za darmo
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                </motion.div>
            </section>
        </div>
    );
}