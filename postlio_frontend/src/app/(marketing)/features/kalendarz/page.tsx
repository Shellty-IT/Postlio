// src/app/(marketing)/features/kalendarz/page.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Calendar,
    CalendarDays,
    CalendarRange,
    Layers,
    Move,
    Eye,
    Filter,
    Bell,
    ArrowRight,
    Check,
    ChevronDown,
    Facebook,
    Instagram,
    Linkedin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const capabilities = [
    {
        icon: CalendarDays,
        title: 'Widok dzienny',
        description: 'Szczegółowy przegląd wszystkich postów zaplanowanych na dany dzień.',
    },
    {
        icon: CalendarRange,
        title: 'Widok tygodniowy',
        description: 'Planuj całe tygodnie z góry. Zobacz rozkład postów na każdy dzień.',
    },
    {
        icon: Layers,
        title: 'Widok miesięczny',
        description: 'Strategiczny przegląd całego miesiąca publikacji.',
    },
    {
        icon: Move,
        title: 'Drag & Drop',
        description: 'Przenoś posty między datami prostym przeciąganiem.',
    },
    {
        icon: Filter,
        title: 'Filtrowanie',
        description: 'Filtruj po platformie, marce lub statusie publikacji.',
    },
    {
        icon: Bell,
        title: 'Powiadomienia',
        description: 'Przypomnienia o nadchodzących publikacjach.',
    },
];

const steps = [
    {
        number: '01',
        title: 'Utwórz post',
        description: 'Napisz treść lub wygeneruj z AI w Kreatorze.',
    },
    {
        number: '02',
        title: 'Wybierz datę',
        description: 'Kliknij na dzień w kalendarzu lub użyj date pickera.',
    },
    {
        number: '03',
        title: 'Ustaw godzinę',
        description: 'Wybierz optymalny czas publikacji.',
    },
    {
        number: '04',
        title: 'Gotowe!',
        description: 'Post zostanie opublikowany automatycznie.',
    },
];

const faqs = [
    {
        question: 'Czy mogę planować na wiele platform jednocześnie?',
        answer: 'Tak! Jeden post może być zaplanowany na Facebook, Instagram i LinkedIn jednocześnie. Każda platforma otrzyma zoptymalizowaną wersję.',
    },
    {
        question: 'Co jeśli chcę zmienić datę publikacji?',
        answer: 'Po prostu przeciągnij post na inną datę w kalendarzu (drag & drop) lub edytuj datę w szczegółach posta.',
    },
    {
        question: 'Czy widzę posty wszystkich marek w jednym kalendarzu?',
        answer: 'Tak, ale możesz też filtrować po konkretnej marce. Każda marka ma swój kolor dla łatwej identyfikacji.',
    },
    {
        question: 'Jak działają strefy czasowe?',
        answer: 'Kalendarz automatycznie uwzględnia Twoją strefę czasową. Posty są publikowane o wybranej godzinie lokalnej.',
    },
];

// Mock calendar data for demo
const mockDays = [
    { day: 'Pon', date: 13, posts: [] },
    { day: 'Wt', date: 14, posts: [{ platform: 'facebook', time: '10:00' }] },
    { day: 'Śr', date: 15, posts: [] },
    { day: 'Czw', date: 16, posts: [{ platform: 'instagram', time: '12:00' }, { platform: 'linkedin', time: '09:00' }] },
    { day: 'Pt', date: 17, posts: [{ platform: 'facebook', time: '10:00' }] },
    { day: 'Sob', date: 18, posts: [] },
    { day: 'Nie', date: 19, posts: [{ platform: 'instagram', time: '18:00' }] },
];

const platformIcons: Record<string, React.ReactNode> = {
    facebook: <Facebook className="w-3 h-3" />,
    instagram: <Instagram className="w-3 h-3" />,
    linkedin: <Linkedin className="w-3 h-3" />,
};

const platformColors: Record<string, string> = {
    facebook: 'bg-blue-500',
    instagram: 'bg-pink-500',
    linkedin: 'bg-sky-600',
};

export default function KalendarzPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div>
            {/* Hero */}
            <section className="container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 mb-6"
                    >
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">Kalendarz</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-bold mb-6"
                    >
                        Wszystkie posty w{' '}
                        <span className="bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">
                            jednym miejscu
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
                    >
                        Wizualny kalendarz publikacji dla wszystkich platform.
                        Planuj, przenoś i zarządzaj postami jednym kliknięciem.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Link href="/register">
                            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-8">
                                Zacznij planować
                                <Calendar className="w-5 h-5 ml-2" />
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

            {/* Calendar Demo */}
            <section className="container mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8">
                        {/* Calendar header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Styczeń 2025</h3>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm">Dziś</Button>
                                <Button variant="outline" size="sm">Tydzień</Button>
                                <Button variant="outline" size="sm">Miesiąc</Button>
                            </div>
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-2">
                            {mockDays.map((day) => (
                                <div
                                    key={day.date}
                                    className="aspect-square p-2 rounded-lg border border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                                >
                                    <div className="text-xs text-muted-foreground mb-1">{day.day}</div>
                                    <div className="font-semibold mb-2">{day.date}</div>
                                    <div className="space-y-1">
                                        {day.posts.map((post, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-white text-[10px] ${platformColors[post.platform]}`}
                                            >
                                                {platformIcons[post.platform]}
                                                <span>{post.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-border/50">
                            <span className="text-sm text-muted-foreground">Platformy:</span>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded bg-blue-500" />
                                    <span className="text-sm">Facebook</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded bg-pink-500" />
                                    <span className="text-sm">Instagram</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded bg-sky-600" />
                                    <span className="text-sm">LinkedIn</span>
                                </div>
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
                                Chaos w publikacjach
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Każda platforma ma swój panel. Pamiętanie co, gdzie i kiedy
                                opublikować to koszmar organizacyjny.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Rozproszenie w wielu narzędziach',
                                    'Zapominanie o zaplanowanych postach',
                                    'Nakładające się publikacje',
                                    'Brak przeglądu strategii',
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
                                Jeden kalendarz, pełna kontrola
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Wszystkie platformy, wszystkie marki, wszystkie posty -
                                w jednym wizualnym kalendarzu.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Wszystko w jednym miejscu',
                                    'Powiadomienia i przypomnienia',
                                    'Łatwe przenoszenie postów',
                                    'Strategiczny widok całości',
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
                        Jak zaplanować post?
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        4 proste kroki do zaplanowanej publikacji
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
                            <div className="text-5xl font-bold text-blue-500/20 mb-4">
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
                            Funkcje kalendarza
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Wszystko czego potrzebujesz do planowania
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
                                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                                    <cap.icon className="w-6 h-6 text-blue-500" />
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
                    className="max-w-3xl mx-auto text-center p-12 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-600/10 border border-blue-500/20"
                >
                    <Eye className="w-12 h-12 text-blue-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold mb-4">
                        Zobacz wszystko jasno
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        Zacznij planować publikacje wizualnie. Koniec z chaosem w social media.
                    </p>
                    <Link href="/register">
                        <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-8">
                            Wypróbuj kalendarz za darmo
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                </motion.div>
            </section>
        </div>
    );
}