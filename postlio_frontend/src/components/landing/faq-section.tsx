// src/components/landing/faq-section.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FAQItem } from './faq-item';
import { MessageCircle } from 'lucide-react';

const faqs = [
    {
        question: 'Czy mogę wypróbować Postlio za darmo?',
        answer: 'Tak! Oferujemy darmowy plan Starter, który pozwala generować do 50 postów AI miesięcznie. Nie wymagamy karty kredytowej do rejestracji. Możesz też wypróbować plan Pro przez 14 dni za darmo.',
    },
    {
        question: 'Jak działa Autopilot AI?',
        answer: 'Autopilot AI automatycznie generuje treści na podstawie Twojego harmonogramu i profilu marki (Brand Voice DNA). Ustawiasz częstotliwość publikacji (np. 3 razy w tygodniu), wybierasz kategorie tematyczne, a AI tworzy posty które trafiają do kolejki. Ty tylko zatwierdzasz lub edytujesz przed publikacją.',
    },
    {
        question: 'Czym jest Brand Voice DNA?',
        answer: 'Brand Voice DNA to unikalny profil głosu Twojej marki. Definiujesz ton komunikacji (formalny/nieformalny, energiczny/spokojny), cechy osobowości, preferowane hashtagi, emoji i słowa kluczowe. AI używa tego profilu do generowania treści, które brzmią autentycznie jak Ty.',
    },
    {
        question: 'Które platformy social media są wspierane?',
        answer: 'Aktualnie wspieramy Facebook, Instagram i LinkedIn. Pracujemy nad integracją z Twitter/X, TikTok i YouTube. Każda platforma ma dedykowane formaty i optymalizacje treści.',
    },
    {
        question: 'Czy mogę używać różnych providerów AI?',
        answer: 'Tak! Postlio oferuje wybór między różnymi providerami AI dla tekstu (Gemini, Groq/Llama) i obrazów (Pollinations, HuggingFace, ClipDrop). Możesz wybrać różnych providerów dla różnych zadań w zależności od preferencji.',
    },
    {
        question: 'Czy moje dane są bezpieczne?',
        answer: 'Bezpieczeństwo danych to nasz priorytet. Używamy szyfrowania SSL, przechowujemy dane na bezpiecznych serwerach w UE, i nigdy nie udostępniamy Twoich treści osobom trzecim. Spełniamy wymogi RODO.',
    },
    {
        question: 'Czy mogę anulować subskrypcję w dowolnym momencie?',
        answer: 'Tak, możesz anulować subskrypcję w każdej chwili bez żadnych opłat. Twoje konto pozostanie aktywne do końca opłaconego okresu. Oferujemy też 14-dniową gwarancję zwrotu pieniędzy.',
    },
    {
        question: 'Czy Postlio obsługuje język polski?',
        answer: 'Tak! Postlio jest w pełni spolonizowane - zarówno interfejs jak i generowanie treści AI. Nasze modele są dostrojone do polskiego rynku i kultury, więc posty brzmią naturalnie, nie jak tłumaczenie.',
    },
];

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section id="faq" className="py-16 xs:py-20 md:py-24 lg:py-32 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-violet-500/5 blur-3xl -z-10" />

            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8 sm:mb-12">
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
                                FAQ
                            </Badge>
                        </motion.div>

                        <motion.h2
                            className="text-2xl xs:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            Często zadawane{' '}
                            <span className="text-primary">pytania</span>
                        </motion.h2>

                        <motion.p
                            className="text-sm sm:text-base md:text-lg text-muted-foreground px-2"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            Znajdź odpowiedzi na najczęściej zadawane pytania
                        </motion.p>
                    </div>

                    <motion.div
                        className="bg-card rounded-2xl sm:rounded-3xl border border-border/50 p-4 xs:p-5 sm:p-6 md:p-8"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        {faqs.map((faq, index) => (
                            <FAQItem
                                key={index}
                                question={faq.question}
                                answer={faq.answer}
                                index={index}
                                isOpen={openIndex === index}
                                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                            />
                        ))}
                    </motion.div>

                    <motion.div
                        className="mt-8 sm:mt-12 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                            Nie znalazłeś odpowiedzi na swoje pytanie?
                        </p>
                        <Button variant="outline" className="gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Skontaktuj się z nami
                        </Button>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}