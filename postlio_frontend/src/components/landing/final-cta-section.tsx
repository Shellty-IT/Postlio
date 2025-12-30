// src/components/landing/final-cta-section.tsx
'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Sparkles, Zap, Shield } from 'lucide-react';

export function FinalCTASection() {
    return (
        <section className="py-24 md:py-32 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-violet-500/5 to-primary/5" />

            {/* Animated orbs */}
            <motion.div
                className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
                className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl"
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.5, 0.3, 0.5],
                }}
                transition={{ duration: 8, repeat: Infinity }}
            />

            <div className="container mx-auto px-4 relative">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Icon */}
                    <motion.div
                        className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-violet-500 mb-8 shadow-xl shadow-primary/25"
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                    >
                        <Sparkles className="w-10 h-10 text-white" />
                    </motion.div>

                    {/* Heading */}
                    <motion.h2
                        className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
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

                    {/* Description */}
                    <motion.p
                        className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        Oszczędzaj czas i zwiększaj zasięgi dzięki AI.
                        Zacznij za darmo w 30 sekund.
                    </motion.p>

                    {/* Features */}
                    <motion.div
                        className="flex flex-wrap justify-center gap-6 mb-10"
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
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 border border-border/50 text-sm"
                            >
                                <item.icon className="w-4 h-4 text-primary" />
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Button
                            size="lg"
                            className="h-14 px-8 text-base bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-xl shadow-primary/25 group"
                            asChild
                        >
                            <Link href="/register" className="flex items-center gap-2">
                                Zacznij za darmo
                                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            className="h-14 px-8 text-base"
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