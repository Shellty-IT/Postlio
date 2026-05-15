// src/components/landing/final-cta-section.tsx
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Sparkles, Zap, Shield } from 'lucide-react';

export function FinalCTASection() {
    return (
        <section className="py-16 xs:py-20 md:py-24 lg:py-32 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-violet-500/5 to-primary/5" />

            <motion.div
                className="absolute top-1/4 left-1/4 w-40 sm:w-64 h-40 sm:h-64 rounded-full bg-primary/10 blur-3xl"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
                className="absolute bottom-1/4 right-1/4 w-48 sm:w-80 h-48 sm:h-80 rounded-full bg-violet-500/10 blur-3xl"
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.5, 0.3, 0.5],
                }}
                transition={{ duration: 8, repeat: Infinity }}
            />

            <div className="container mx-auto px-4 relative">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        className="inline-flex items-center justify-center w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary to-violet-500 mb-5 sm:mb-8 shadow-xl shadow-primary/25"
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                    >
                        <Sparkles className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 text-white" />
                    </motion.div>

                    <motion.h2
                        className="text-2xl xs:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        Gotowy, by zrewolucjonizować{' '}
                        <br className="hidden md:block" />
                        <span className="bg-gradient-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                            swoje social media?
                        </span>
                    </motion.h2>

                    <motion.p
                        className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-2"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        Oszczędzaj czas i zwiększaj zasięgi dzięki AI.
                        Zacznij za darmo w 30 sekund.
                    </motion.p>

                    <motion.div
                        className="flex flex-wrap justify-center gap-2.5 sm:gap-4 xs:gap-3 mb-8 sm:mb-10"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        {[
                            { icon: Zap, text: 'Konfiguracja w 2 minuty' },
                            { icon: Shield, text: 'Bez karty kredytowej' },
                            { icon: Sparkles, text: '50 postów AI za darmo' },
                        ].map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-background/80 border border-border/50 text-xs sm:text-sm"
                            >
                                <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div
                        className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Button
                            size="lg"
                            className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-xl shadow-primary/25 group w-full sm:w-auto"
                            asChild
                        >
                            <Link href="/register" className="flex items-center justify-center gap-2">
                                Zacznij za darmo
                                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base w-full sm:w-auto"
                            asChild
                        >
                            <Link href="#pricing">Zobacz cennik</Link>
                        </Button>
                    </motion.div>

                    {/* USUNIĘTO: Social proof z avatarami i "10,000+" */}
                </div>
            </div>
        </section>
    );
}