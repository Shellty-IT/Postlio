// src/components/brands/empty-state.tsx
'use client';

import { motion } from 'framer-motion';
import { Sparkles, Plus, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBrandsStore } from '@/store/brands-store';

interface EmptyStateProps {
    isFiltered?: boolean;
    onClearFilters?: () => void;
}

export function EmptyState({ isFiltered, onClearFilters }: EmptyStateProps) {
    const { openForm } = useBrandsStore();

    if (isFiltered) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 px-4"
            >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Brak wyników</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                    Nie znaleziono marek pasujących do wyszukiwania. Spróbuj zmienić kryteria.
                </p>
                <Button variant="outline" onClick={onClearFilters}>
                    Wyczyść filtry
                </Button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4"
        >
            {/* Animated illustration */}
            <div className="relative mb-8">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500/20 to-primary/20 flex items-center justify-center"
                >
                    <motion.div
                        animate={{
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.05, 1]
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <Palette className="h-16 w-16 text-violet-500" />
                    </motion.div>
                </motion.div>

                {/* Floating particles */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-3 h-3 rounded-full bg-primary/40"
                        style={{
                            top: `${20 + i * 30}%`,
                            left: `${10 + i * 35}%`,
                        }}
                        animate={{
                            y: [0, -10, 0],
                            opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                            duration: 2,
                            delay: i * 0.3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            <h3 className="text-xl font-semibold mb-2">Utwórz swoją pierwszą markę</h3>
            <p className="text-muted-foreground text-center max-w-md mb-8">
                Marki pozwalają na definiowanie unikalnego głosu i stylu komunikacji.
                AI będzie generować treści dopasowane do Twojej marki.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button
                    size="lg"
                    onClick={() => openForm()}
                    className="bg-gradient-to-r from-violet-600 to-primary hover:from-violet-500 hover:to-primary/90"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Utwórz markę
                </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 max-w-2xl">
                {[
                    {
                        icon: '🎨',
                        title: 'Unikalny styl',
                        description: 'Zdefiniuj ton głosu i osobowość marki',
                    },
                    {
                        icon: '🤖',
                        title: 'AI dopasowane',
                        description: 'Generuj treści zgodne z brandingiem',
                    },
                    {
                        icon: '📊',
                        title: 'Spójność',
                        description: 'Zachowaj jednolity przekaz we wszystkich postach',
                    },
                ].map((feature, index) => (
                    <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="text-center p-4"
                    >
                        <div className="text-3xl mb-2">{feature.icon}</div>
                        <h4 className="font-medium mb-1">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}