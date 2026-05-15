// src/components/autopilot/content-categories-editor.tsx
'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Plus,
    X,
    GripVertical,
    Minus,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    ThematicCategory,
    THEMATIC_CATEGORIES,
    SelectedCategory,
} from '@/types/autopilot';

interface ContentCategoriesEditorProps {
    selectedCategories: SelectedCategory[];
    onChange: (categories: SelectedCategory[]) => void;
    maxCategories?: number;
    className?: string;
}

export function ContentCategoriesEditor({
                                            selectedCategories,
                                            onChange,
                                            maxCategories = 8,
                                            className,
                                        }: ContentCategoriesEditorProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllCategories, setShowAllCategories] = useState(false);

    // Znajdź pełne dane kategorii
    const getCategoryData = (categoryId: string): ThematicCategory | undefined => {
        return THEMATIC_CATEGORIES.find(c => c.id === categoryId);
    };

    // Filtruj dostępne kategorie
    const availableCategories = useMemo(() => {
        const selectedIds = new Set(selectedCategories.map(c => c.categoryId));
        return THEMATIC_CATEGORIES.filter(cat => {
            if (selectedIds.has(cat.id)) return false;
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                cat.name.toLowerCase().includes(query) ||
                cat.keywords.some(k => k.toLowerCase().includes(query))
            );
        });
    }, [selectedCategories, searchQuery]);

    // Dodaj kategorię
    const addCategory = (category: ThematicCategory) => {
        if (selectedCategories.length >= maxCategories) return;

        // Przelicz procenty równomiernie
        const newCount = selectedCategories.length + 1;
        const basePercentage = Math.floor(100 / newCount);
        const remainder = 100 - (basePercentage * newCount);

        const updatedCategories = selectedCategories.map((cat, idx) => ({
            ...cat,
            percentage: basePercentage + (idx < remainder ? 1 : 0),
        }));

        const newCategory: SelectedCategory = {
            categoryId: category.id,
            percentage: basePercentage,
        };

        onChange([...updatedCategories, newCategory]);
    };

    // Usuń kategorię
    const removeCategory = (categoryId: string) => {
        const filtered = selectedCategories.filter(c => c.categoryId !== categoryId);

        if (filtered.length === 0) {
            onChange([]);
            return;
        }

        // Przelicz procenty
        const basePercentage = Math.floor(100 / filtered.length);
        const remainder = 100 - (basePercentage * filtered.length);

        const updatedCategories = filtered.map((cat, idx) => ({
            ...cat,
            percentage: basePercentage + (idx < remainder ? 1 : 0),
        }));

        onChange(updatedCategories);
    };

    // Zmień procent kategorii
    const updatePercentage = (categoryId: string, delta: number) => {
        const idx = selectedCategories.findIndex(c => c.categoryId === categoryId);
        if (idx === -1) return;

        const category = selectedCategories[idx];
        const newPercentage = Math.max(5, Math.min(80, category.percentage + delta));
        const percentageDiff = newPercentage - category.percentage;

        if (percentageDiff === 0) return;

        // Rozłóż różnicę na pozostałe kategorie
        const others = selectedCategories.filter(c => c.categoryId !== categoryId);
        const perOther = Math.floor(Math.abs(percentageDiff) / Math.max(1, others.length));

        const updatedCategories = selectedCategories.map(cat => {
            if (cat.categoryId === categoryId) {
                return { ...cat, percentage: newPercentage };
            }
            const adjustment = percentageDiff > 0 ? -perOther : perOther;
            return { ...cat, percentage: Math.max(5, cat.percentage + adjustment) };
        });

        // Normalizuj do 100%
        const total = updatedCategories.reduce((sum, c) => sum + c.percentage, 0);
        if (total !== 100 && updatedCategories.length > 0) {
            updatedCategories[0].percentage += 100 - total;
        }

        onChange(updatedCategories);
    };

    // Suma procentów
    const totalPercentage = selectedCategories.reduce((sum, c) => sum + c.percentage, 0);

    return (
        <div className={cn('space-y-4', className)}>
            {/* Wybrane kategorie */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">
                        Wybrane kategorie ({selectedCategories.length}/{maxCategories})
                    </h4>
                    <span className={cn(
                        "text-xs font-medium",
                        totalPercentage === 100 ? "text-green-500" : "text-amber-500"
                    )}>
            {totalPercentage}%
          </span>
                </div>

                {selectedCategories.length === 0 ? (
                    <div className="flex items-center justify-center p-8 border-2 border-dashed border-border/50 rounded-xl bg-muted/30">
                        <div className="text-center">
                            <Sparkles className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">
                                Wybierz kategorie tematyczne dla Twoich postów
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                            {selectedCategories.map((selected, index) => {
                                const category = getCategoryData(selected.categoryId);
                                if (!category) return null;

                                return (
                                    <motion.div
                                        key={selected.categoryId}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group relative"
                                    >
                                        <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors">
                                            {/* Drag handle */}
                                            <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" />

                                            {/* Icon & Name */}
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                                                style={{ backgroundColor: `${category.color}20` }}
                                            >
                                                {category.icon}
                                            </div>

                                            <span className="flex-1 font-medium text-sm">
                        {category.name}
                      </span>

                                            {/* Percentage controls */}
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-6 h-6"
                                                    onClick={() => updatePercentage(selected.categoryId, -5)}
                                                    disabled={selected.percentage <= 5}
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </Button>

                                                <div
                                                    className="w-12 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                                                    style={{
                                                        backgroundColor: `${category.color}20`,
                                                        color: category.color,
                                                    }}
                                                >
                                                    {selected.percentage}%
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-6 h-6"
                                                    onClick={() => updatePercentage(selected.categoryId, 5)}
                                                    disabled={selected.percentage >= 80}
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </Button>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: category.color }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${selected.percentage}%` }}
                                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                                />
                                            </div>

                                            {/* Remove button */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-6 h-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => removeCategory(selected.categoryId)}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Dodaj kategorię */}
            {selectedCategories.length < maxCategories && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Szukaj kategorii..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllCategories(!showAllCategories)}
                        >
                            {showAllCategories ? 'Mniej' : 'Wszystkie'}
                        </Button>
                    </div>

                    {/* Kategorie do wyboru */}
                    <div className="flex flex-wrap gap-2">
                        <AnimatePresence>
                            {(showAllCategories ? availableCategories : availableCategories.slice(0, 12)).map((category, index) => (
                                <motion.button
                                    key={category.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ delay: index * 0.02 }}
                                    onClick={() => addCategory(category)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                                        "border border-border bg-card hover:bg-accent",
                                        "text-sm transition-all hover:scale-105",
                                        "hover:border-primary/50 hover:shadow-sm"
                                    )}
                                >
                                    <span>{category.icon}</span>
                                    <span>{category.name}</span>
                                    <Plus className="w-3 h-3 text-muted-foreground" />
                                </motion.button>
                            ))}
                        </AnimatePresence>
                    </div>

                    {availableCategories.length === 0 && searchQuery && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Nie znaleziono kategorii pasujących do &ldquo;{searchQuery}&rdquo;
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}