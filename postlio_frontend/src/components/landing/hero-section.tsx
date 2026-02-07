// src/components/landing/hero-section.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FloatingIcons } from './floating-icons';
import {
    ArrowRight,
    Play,
    Sparkles,
    Zap,
    Shield,
    TrendingUp
} from 'lucide-react';

const trustBadges = [
    { icon: Zap, text: 'Błyskawiczne AI' },
    { icon: Shield, text: 'Bezpieczne dane' },
    { icon: TrendingUp, text: 'Wzrost zasięgów' },
];

export function HeroSection() {
    return (
        <section className="relative min-h-[80vh] sm:min-h-screen flex items-center justify-center pt-16 sm:pt-20 pb-10 sm:pb-16 overflow-hidden">
            <FloatingIcons />

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Badge
                            variant="secondary"
                            className="mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors cursor-default"
                        >
                            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                            Nowa era zarządzania social media
                        </Badge>
                    </motion.div>

                    <motion.h1
                        className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 sm:mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <span className="text-foreground">Twórz posty z </span>
                        <span className="relative">
                            <span className="bg-gradient-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                                AI na autopilocie
                            </span>
                            <motion.svg
                                className="absolute -bottom-1 sm:-bottom-2 left-0 w-full"
                                viewBox="0 0 300 12"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1, delay: 0.5 }}
                            >
                                <motion.path
                                    d="M2 10 Q 75 2, 150 6 Q 225 10, 298 4"
                                    fill="none"
                                    stroke="url(#gradient)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#2563EB" />
                                        <stop offset="50%" stopColor="#8B5CF6" />
                                        <stop offset="100%" stopColor="#2563EB" />
                                    </linearGradient>
                                </defs>
                            </motion.svg>
                        </span>
                    </motion.h1>

                    <motion.p
                        className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        Postlio wykorzystuje sztuczną inteligencję do tworzenia angażujących treści
                        dla Twojej marki. Ustaw harmonogram, a AI zajmie się resztą.
                    </motion.p>

                    <motion.div
                        className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 sm:mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        {trustBadges.map((badge, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-muted/50 text-xs sm:text-sm text-muted-foreground"
                            >
                                <badge.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                                <span>{badge.text}</span>
                            </div>
                        ))}
                    </motion.div>

                    <motion.div
                        className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Button
                            size="lg"
                            className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base group shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all w-full sm:w-auto"
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
                            className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base group w-full sm:w-auto"
                        >
                            <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 transition-transform group-hover:scale-110" />
                            Zobacz demo
                        </Button>
                    </motion.div>

                    {/* USUNIĘTE: Stats - nie mamy jeszcze danych */}
                </div>

                <motion.div
                    className="mt-8 sm:mt-12 md:mt-16 relative"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                >
                    <div className="relative mx-auto max-w-5xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-violet-500/20 to-primary/20 blur-3xl -z-10" />

                        <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-background">
                            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-muted/50 border-b border-border/50">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80" />
                                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80" />
                                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/80" />
                                </div>
                                <div className="flex-1 mx-2 sm:mx-4">
                                    <div className="max-w-md mx-auto h-6 sm:h-7 rounded-lg bg-background/80 border border-border/50 flex items-center px-2 sm:px-3">
                                        <span className="text-[10px] sm:text-xs text-muted-foreground">app.postlio.pl/dashboard</span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative aspect-[16/9] bg-gradient-to-br from-muted/30 to-muted/10">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                                        </div>
                                        <p className="text-muted-foreground text-xs sm:text-sm">Podgląd aplikacji Postlio</p>
                                    </div>
                                </div>

                                <div className="hidden sm:block absolute top-6 left-6 w-48 h-32 rounded-xl bg-card/80 border border-border/50 shadow-lg" />
                                <div className="hidden sm:block absolute top-6 right-6 w-64 h-40 rounded-xl bg-card/80 border border-border/50 shadow-lg" />
                                <div className="hidden sm:block absolute bottom-6 left-1/4 w-72 h-24 rounded-xl bg-card/80 border border-border/50 shadow-lg" />
                            </div>
                        </div>

                        <motion.div
                            className="hidden md:block absolute -left-12 top-1/3 p-4 rounded-2xl bg-card border border-border shadow-xl max-w-[200px]"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.9 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                </div>
                                <span className="text-xs font-medium">Zaangażowanie</span>
                            </div>
                            <p className="text-2xl font-bold text-green-500">+127%</p>
                            <p className="text-xs text-muted-foreground">w tym miesiącu</p>
                        </motion.div>

                        <motion.div
                            className="hidden md:block absolute -right-12 top-1/2 p-4 rounded-2xl bg-card border border-border shadow-xl max-w-[220px]"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.1 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-violet-500" />
                                </div>
                                <span className="text-xs font-medium">AI wygenerowało</span>
                            </div>
                            <p className="text-lg font-bold">Nowy post gotowy!</p>
                            <p className="text-xs text-muted-foreground">Zaplanowany na 10:00</p>
                        </motion.div>
                    </div>
                </motion.div>
            </div>

            <motion.div
                className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 hidden xs:block"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
            >
                <motion.div
                    className="w-5 h-8 sm:w-6 sm:h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5 sm:p-2"
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <motion.div
                        className="w-1 h-2 sm:w-1.5 sm:h-2.5 rounded-full bg-muted-foreground/50"
                        animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </motion.div>
            </motion.div>
        </section>
    );
}