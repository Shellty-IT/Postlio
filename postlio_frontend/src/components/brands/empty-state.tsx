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
                className="flex flex-col items-center justify-center py-10 xs:py-12 sm:py-16 px-4"
            >
                <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center mb-3 xs:mb-4">
                    <Sparkles className="h-6 w-6 xs:h-7 xs:w-7 sm:h-8 sm:w-8 text-muted-foreground" />
                </div>
                <h3 className="text-base xs:text-lg font-semibold mb-2">Brak wyników</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mb-4 xs:mb-6">
                    Nie znaleziono marek pasujących do wyszukiwania. Spróbuj zmienić kryteria.
                </p>
                <Button variant="outline" onClick={onClearFilters} className="h-10 xs:h-11">
                    Wyczyść filtry
                </Button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-10 xs:py-12 sm:py-16 px-4"
        >
            <div className="relative mb-6 xs:mb-8">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-24 h-24 xs:w-28 xs:h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-violet-500/20 to-primary/20 flex items-center justify-center"
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
                        <Palette className="h-12 w-12 xs:h-14 xs:w-14 sm:h-16 sm:w-16 text-violet-500" />
                    </motion.div>
                </motion.div>

                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 xs:w-3 xs:h-3 rounded-full bg-primary/40"
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

            <h3 className="text-lg xs:text-xl font-semibold mb-2 text-center">Utwórz swoją pierwszą markę</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6 xs:mb-8 px-2">
                Marki pozwalają na definiowanie unikalnego głosu i stylu komunikacji.
                AI będzie generować treści dopasowane do Twojej marki.
            </p>

            <Button
                size="lg"
                onClick={() => openForm()}
                className="h-11 xs:h-12 bg-gradient-to-r from-violet-600 to-primary hover:from-violet-500 hover:to-primary/90"
            >
                <Plus className="h-4 w-4 xs:h-5 xs:w-5 mr-2" />
                Utwórz markę
            </Button>

            <div className="grid grid-cols-1 xs:grid-cols-3 gap-4 xs:gap-6 mt-8 xs:mt-12 max-w-2xl w-full">
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
                        className="text-center p-3 xs:p-4"
                    >
                        <div className="text-2xl xs:text-3xl mb-2">{feature.icon}</div>
                        <h4 className="font-medium text-sm xs:text-base mb-1">{feature.title}</h4>
                        <p className="text-xs xs:text-sm text-muted-foreground">{feature.description}</p>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}