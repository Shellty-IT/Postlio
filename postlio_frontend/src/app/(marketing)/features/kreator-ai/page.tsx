// src/app/(marketing)/features/kreator-ai/page.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Sparkles,
    MessageSquare,
    Image as ImageIcon,
    Wand2,
    Zap,
    Palette,
    Languages,
    Hash,
    ArrowRight,
    Check,
    ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const capabilities = [
    {
        icon: MessageSquare,
        title: 'Generowanie tekstu',
        description: 'AI tworzy angażujące posty dopasowane do platformy i Twojej grupy docelowej.',
    },
    {
        icon: ImageIcon,
        title: 'Generowanie obrazów',
        description: 'Twórz unikalne grafiki bez umiejętności projektowania. Opisz, co chcesz zobaczyć.',
    },
    {
        icon: Wand2,
        title: 'Ulepszanie treści',
        description: 'Popraw istniejące teksty - AI zasugeruje lepsze sformułowania i strukturę.',
    },
    {
        icon: Palette,
        title: 'Dopasowanie stylu',
        description: 'Wybierz ton: profesjonalny, casualowy, inspirujący - AI dostosuje komunikację.',
    },
    {
        icon: Languages,
        title: 'Wielojęzyczność',
        description: 'Generuj treści w różnych językach z naturalnym brzmieniem.',
    },
    {
        icon: Hash,
        title: 'Automatyczne hashtagi',
        description: 'AI dobiera najlepsze hashtagi zwiększające zasięg postów.',
    },
];

const steps = [
    {
        number: '01',
        title: 'Wybierz platformę',
        description: 'Facebook, Instagram czy LinkedIn? Każda ma swoje zasady - AI je zna.',
    },
    {
        number: '02',
        title: 'Opisz temat',
        description: 'Powiedz AI o czym ma być post. Im więcej szczegółów, tym lepszy rezultat.',
    },
    {
        number: '03',
        title: 'Dostosuj styl',
        description: 'Wybierz ton komunikacji i kategorię. AI dopasuje język do odbiorców.',
    },
    {
        number: '04',
        title: 'Generuj i edytuj',
        description: 'Otrzymaj gotowy post. Możesz go edytować, regenerować lub użyć od razu.',
    },
];

const faqs = [
    {
        question: 'Jakich providerów AI używa Kreator?',
        answer: 'Postlio obsługuje wielu providerów: Gemini 2.5, Groq (Llama 3.3) dla tekstu oraz Pollinations, HuggingFace i ClipDrop dla obrazów. Możesz wybrać preferowanego providera w ustawieniach.',
    },
    {
        question: 'Czy wygenerowane treści są unikalne?',
        answer: 'Tak! Każdy wygenerowany tekst i obraz jest unikalny. AI tworzy oryginalne treści na podstawie Twojego opisu, nie kopiuje istniejących materiałów.',
    },
    {
        question: 'Ile postów mogę wygenerować?',
        answer: 'W wersji podstawowej możesz generować do 50 postów miesięcznie. Plany premium oferują nielimitowane generowanie.',
    },
    {
        question: 'Czy mogę edytować wygenerowane treści?',
        answer: 'Oczywiście! Wygenerowany tekst trafia do edytora, gdzie możesz go dowolnie modyfikować przed publikacją.',
    },
];

export default function KreatorAIPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div>
            {/* Hero */}
            <section className="container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 text-violet-500 mb-6"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">Kreator AI</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-bold mb-6"
                    >
                        Twórz treści{' '}
                        <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                            10x szybciej
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
                    >
                        Zapomnij o blokadzie twórczej. AI Postlio generuje angażujące posty,
                        które przyciągają uwagę i budują zasięgi. Ty tylko wybierasz temat.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Link href="/register">
                            <Button size="lg" className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-8">
                                Zacznij tworzyć
                                <Sparkles className="w-5 h-5 ml-2" />
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
                                Koniec z pustą stroną
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Tworzenie treści na social media zajmuje godziny. Szukanie pomysłów,
                                pisanie, poprawianie... A potem i tak nie wiesz, czy post zadziała.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Brak pomysłów na kolejne posty',
                                    'Godziny spędzone na pisaniu',
                                    'Niepewność czy treść zaangażuje',
                                    'Trudność w utrzymaniu regularności',
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
                                AI robi to za Ciebie
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Kreator AI generuje profesjonalne treści w sekundach.
                                Opisz temat, wybierz styl - gotowe. Możesz skupić się na tym, co ważne.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    'Nieskończone pomysły na posty',
                                    'Gotowa treść w 30 sekund',
                                    'Sprawdzone formuły angażujące',
                                    'Łatwe utrzymanie regularności',
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
                        Jak to działa?
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        4 proste kroki do profesjonalnego posta
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
                            <div className="text-5xl font-bold text-primary/20 mb-4">
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
                            Możliwości Kreatora
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Wszystko czego potrzebujesz do tworzenia treści
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
                                <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center mb-4">
                                    <cap.icon className="w-6 h-6 text-violet-500" />
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
                    className="max-w-3xl mx-auto text-center p-12 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-600/10 border border-violet-500/20"
                >
                    <Zap className="w-12 h-12 text-violet-500 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold mb-4">
                        Gotowy na rewolucję w tworzeniu treści?
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        Dołącz do Postlio i zacznij tworzyć angażujące posty w kilka sekund.
                    </p>
                    <Link href="/register">
                        <Button size="lg" className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-8">
                            Wypróbuj za darmo
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                </motion.div>
            </section>
        </div>
    );
}