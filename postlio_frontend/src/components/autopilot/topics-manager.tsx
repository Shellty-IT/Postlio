// src/components/autopilot/topics-manager.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    X,
    Sparkles,
    Lightbulb,
    RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TopicSuggestion } from '@/types/autopilot';

interface TopicsManagerProps {
    topics: TopicSuggestion[];
    onChange: (topics: TopicSuggestion[]) => void;
    categoryHints?: string[]; // ID kategorii do podpowiedzi
    maxTopics?: number;
    className?: string;
}

// Przykładowe podpowiedzi tematów na podstawie kategorii
const TOPIC_SUGGESTIONS_BY_CATEGORY: Record<string, string[]> = {
    kitchen: ['Szybkie przepisy', 'Kuchnia włoska', 'Przepisy na śniadanie', 'Obiady dla rodziny', 'Przekąski'],
    cooking: ['Techniki gotowania', 'Przepisy sezonowe', 'Gotowanie dla początkujących', 'One pot dishes'],
    health: ['Zdrowe nawyki', 'Suplementacja', 'Profilaktyka zdrowotna', 'Zdrowy sen', 'Odporność'],
    beauty: ['Pielęgnacja twarzy', 'Triki makijażowe', 'Naturalne kosmetyki', 'Rytuały pielęgnacyjne'],
    cosmetics: ['Nowości kosmetyczne', 'Recenzje produktów', 'Skincare routine', 'Najlepsze kremy'],
    diet: ['Przepisy fit', 'Liczenie kalorii', 'Meal prep', 'Zdrowe przekąski', 'Dieta redukcyjna'],
    training: ['Trening siłowy', 'Cardio', 'Trening w domu', 'Regeneracja', 'Plan treningowy'],
    exercises: ['Ćwiczenia na brzuch', 'Rozciąganie', 'HIIT', 'Trening funkcjonalny'],
    sport: ['Aktywność fizyczna', 'Sporty zespołowe', 'Outdoor', 'Zawody amatorskie'],
    yoga: ['Joga dla początkujących', 'Medytacja', 'Asany', 'Joga poranna'],
    nature: ['Spacery', 'Fotografia przyrody', 'Ekologia', 'Rośliny domowe', 'Ochrona środowiska'],
    travel: ['Podróże krajowe', 'City break', 'Wakacje budżetowe', 'Lokalne atrakcje', 'Packing tips'],
    technology: ['Nowości tech', 'Aplikacje', 'Sztuczna inteligencja', 'Produktywność cyfrowa'],
    coffee: ['Metody parzenia', 'Ziarna kawy', 'Latte art', 'Kawiarnie godne odwiedzenia'],
    motivation: ['Poranne rutyny', 'Cele życiowe', 'Nawyki sukcesu', 'Mindfulness', 'Rozwój osobisty'],
    fashion: ['Trendy sezonu', 'Stylizacje', 'Capsule wardrobe', 'Sustainable fashion'],
    home: ['Dekoracje DIY', 'Organizacja przestrzeni', 'Rośliny doniczkowe', 'Porządki'],
    baking: ['Ciasta na weekend', 'Chleb domowy', 'Desery bez cukru', 'Muffiny'],
    vegan: ['Przepisy wegańskie', 'Zamienniki mięsa', 'Wegański obiad', 'Roślinna kuchnia'],
    photography: ['Tips fotograficzne', 'Edycja zdjęć', 'Kompozycja', 'Sprzęt fotograficzny'],
};

export function TopicsManager({
                                  topics,
                                  onChange,
                                  categoryHints = [],
                                  maxTopics = 20,
                                  className,
                              }: TopicsManagerProps) {
    const [inputValue, setInputValue] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Zbierz sugestie na podstawie kategorii
    const suggestions = categoryHints
        .flatMap(cat => TOPIC_SUGGESTIONS_BY_CATEGORY[cat] || [])
        .filter(s => !topics.some(t => t.topic === s))
        .slice(0, 8);

    // Dodaj temat
    const addTopic = (topicName: string) => {
        const trimmed = topicName.trim();
        if (!trimmed || topics.some(t => t.topic === trimmed) || topics.length >= maxTopics) return;

        const newTopic: TopicSuggestion = {
            id: `topic-${Date.now()}`,
            topic: trimmed,
            category: 'tips', // Domyślna kategoria
            usedCount: 0,
        };

        onChange([...topics, newTopic]);
        setInputValue('');
    };

    // Usuń temat
    const removeTopic = (topicId: string) => {
        onChange(topics.filter(t => t.id !== topicId));
    };

    // Handle Enter
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTopic(inputValue);
        }
    };

    // Generuj sugestie AI (symulacja)
    const generateSuggestions = async () => {
        setIsGenerating(true);
        // Symulacja API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        const aiSuggestions = [
            'Trendy 2024',
            'Poradniki krok po kroku',
            'Kulisy pracy',
            'Odpowiedzi na pytania',
            'Inspiracje dnia',
            'Behind the scenes',
        ].filter(s => !topics.some(t => t.topic === s));

        const newTopics: TopicSuggestion[] = aiSuggestions.slice(0, 3).map((topic, idx) => ({
            id: `topic-ai-${Date.now()}-${idx}`,
            topic,
            category: 'tips',
            usedCount: 0,
        }));

        onChange([...topics, ...newTopics]);
        setIsGenerating(false);
    };

    return (
        <div className={cn('space-y-4', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-medium text-foreground">
                        Tematy ({topics.length}/{maxTopics})
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Szczegółowe tematy do generowania postów
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={generateSuggestions}
                    disabled={isGenerating}
                    className="gap-2"
                >
                    {isGenerating ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">
            {isGenerating ? 'Generuję...' : 'Zaproponuj AI'}
          </span>
                </Button>
            </div>

            {/* Input */}
            <div className="flex gap-2">
                <Input
                    placeholder="Dodaj nowy temat..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={topics.length >= maxTopics}
                    className="flex-1"
                />
                <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => addTopic(inputValue)}
                    disabled={!inputValue.trim() || topics.length >= maxTopics}
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            {/* Wybrane tematy */}
            {topics.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <AnimatePresence mode="popLayout">
                        {topics.map((topic, index) => (
                            <motion.div
                                key={topic.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ delay: index * 0.02 }}
                            >
                                <Badge
                                    variant="secondary"
                                    className="gap-1.5 px-3 py-1.5 text-sm hover:bg-secondary/80 group cursor-default"
                                >
                                    {topic.topic}
                                    {topic.usedCount > 0 && (
                                        <span className="text-xs text-muted-foreground">
                      ({topic.usedCount})
                    </span>
                                    )}
                                    <button
                                        onClick={() => removeTopic(topic.id)}
                                        className="ml-1 hover:text-destructive transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Sugestie */}
            {suggestions.length > 0 && topics.length < maxTopics && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Sugestie na podstawie kategorii:</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion) => (
                            <button
                                key={suggestion}
                                onClick={() => addTopic(suggestion)}
                                className={cn(
                                    "px-3 py-1 rounded-full text-xs",
                                    "border border-dashed border-border",
                                    "text-muted-foreground hover:text-foreground",
                                    "hover:border-primary/50 hover:bg-primary/5",
                                    "transition-all"
                                )}
                            >
                                + {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {topics.length === 0 && suggestions.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                    <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Dodaj tematy lub wybierz kategorie, aby zobaczyć sugestie</p>
                </div>
            )}
        </div>
    );
}