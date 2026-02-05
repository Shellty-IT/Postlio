// src/components/creator/action-bar.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Save,
    Calendar,
    Loader2,
    Clock,
    ChevronDown,
    Zap,
    PenLine,
    CheckCircle2,
    ImageOff,
    Sparkles,
    Pencil,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Platform } from '@/types';

// ============================================================
// TYPY
// ============================================================

interface ActionBarProps {
    onSaveDraft: () => Promise<void>;
    onSchedule: (scheduledAt: string) => Promise<void>;
    onPublishManually: () => void;
    onShareNow?: () => void;
    isSaving: boolean;
    hasContent: boolean;
    hasImage?: boolean;
    selectedPlatform?: string;
    selectedPlatforms?: Platform[];
    isEditMode?: boolean;
}

// ============================================================
// QUICK SCHEDULE OPTIONS
// ============================================================

const QUICK_SCHEDULE = [
    { label: 'Za 1 godzinę', hours: 1 },
    { label: 'Za 3 godziny', hours: 3 },
    { label: 'Jutro o 9:00', hours: 'tomorrow-9' },
    { label: 'Jutro o 12:00', hours: 'tomorrow-12' },
    { label: 'Jutro o 18:00', hours: 'tomorrow-18' },
];

function getScheduleDate(option: number | string): string {
    const now = new Date();

    if (typeof option === 'number') {
        now.setHours(now.getHours() + option);
        return now.toISOString();
    }

    const [, time] = (option as string).split('-');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(parseInt(time), 0, 0, 0);
    return tomorrow.toISOString();
}

// ============================================================
// KOMPONENT STATUSU - ULEPSZONY
// ============================================================

interface StatusIndicatorProps {
    hasAnything: boolean;
    instagramNeedsImage: boolean;
    isEditMode: boolean;
}

function StatusIndicator({
                             hasAnything,
                             instagramNeedsImage,
                             isEditMode
                         }: StatusIndicatorProps) {
    // Określ status i styl
    const getStatus = () => {
        // Tryb edycji
        if (isEditMode && hasAnything) {
            return {
                icon: Pencil,
                text: 'Tryb edycji',
                color: 'text-violet-500',
                bgColor: 'bg-violet-500/10',
                borderColor: 'border-violet-500/30',
                dotColor: 'bg-violet-500',
                pulse: false,
            };
        }

        // Instagram wymaga zdjęcia
        if (instagramNeedsImage) {
            return {
                icon: ImageOff,
                text: 'Instagram wymaga zdjęcia',
                color: 'text-amber-500',
                bgColor: 'bg-amber-500/10',
                borderColor: 'border-amber-500/30',
                dotColor: 'bg-amber-500',
                pulse: true,
            };
        }

        // Gotowy do publikacji (ma cokolwiek - tekst lub zdjęcie)
        if (hasAnything) {
            return {
                icon: CheckCircle2,
                text: 'Gotowy do publikacji',
                color: 'text-emerald-500',
                bgColor: 'bg-emerald-500/10',
                borderColor: 'border-emerald-500/30',
                dotColor: 'bg-emerald-500',
                pulse: false,
            };
        }

        // Brak treści
        return {
            icon: PenLine,
            text: 'Dodaj treść lub zdjęcie',
            color: 'text-muted-foreground',
            bgColor: 'bg-muted/50',
            borderColor: 'border-border',
            dotColor: 'bg-muted-foreground',
            pulse: false,
        };
    };

    const status = getStatus();
    const Icon = status.icon;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={status.text}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className={cn(
                    'flex items-center gap-2.5 px-3 py-1.5 rounded-full border text-sm font-medium',
                    status.bgColor,
                    status.borderColor,
                    status.color
                )}
            >
                {/* Animated dot */}
                <span className="relative flex h-2.5 w-2.5">
                    {status.pulse && (
                        <span className={cn(
                            'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
                            status.dotColor
                        )} />
                    )}
                    <span className={cn(
                        'relative inline-flex rounded-full h-2.5 w-2.5',
                        status.dotColor
                    )} />
                </span>

                {/* Icon */}
                <Icon className="w-4 h-4" />

                {/* Text */}
                <span className="hidden sm:inline">{status.text}</span>
            </motion.div>
        </AnimatePresence>
    );
}

// ============================================================
// KOMPONENT GŁÓWNY
// ============================================================

export function ActionBar({
                              onSaveDraft,
                              onSchedule,
                              onPublishManually,
                              onShareNow,
                              isSaving,
                              hasContent,
                              hasImage = false,
                              selectedPlatform,
                              selectedPlatforms = [],
                              isEditMode = false,
                          }: ActionBarProps) {
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ✅ POPRAWKA: Logika walidacji
    const hasAnything = hasContent || hasImage; // Ma tekst LUB zdjęcie

    // Sprawdź czy Instagram jest w wybranych platformach
    const platforms = selectedPlatforms.length > 0
        ? selectedPlatforms
        : (selectedPlatform ? [selectedPlatform as Platform] : []);

    const hasInstagram = platforms.includes('instagram');
    const instagramNeedsImage = hasInstagram && !hasImage;

    // ✅ POPRAWKA: Można zapisać jeśli jest COKOLWIEK (tekst lub zdjęcie)
    const canSave = hasAnything;

    // ✅ POPRAWKA: Można opublikować jeśli:
    // - Ma cokolwiek (tekst lub zdjęcie)
    // - I jeśli jest Instagram - musi mieć zdjęcie
    const canPublish = hasAnything && !instagramNeedsImage;

    const handleSaveDraft = async () => {
        setIsSubmitting(true);
        try {
            await onSaveDraft();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickSchedule = async (option: number | string) => {
        setIsSubmitting(true);
        try {
            const date = getScheduleDate(option);
            await onSchedule(date);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCustomSchedule = async () => {
        if (!scheduleDate || !scheduleTime) return;

        setIsSubmitting(true);
        try {
            const dateTime = new Date(`${scheduleDate}T${scheduleTime}`);
            await onSchedule(dateTime.toISOString());
            setIsScheduleOpen(false);
            setScheduleDate('');
            setScheduleTime('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = isSaving || isSubmitting;

    return (
        <>
            <div className="flex items-center justify-between p-4">
                {/* Left side - Ulepszony status */}
                <StatusIndicator
                    hasAnything={hasAnything}
                    instagramNeedsImage={instagramNeedsImage}
                    isEditMode={isEditMode}
                />

                {/* Right side - actions */}
                <div className="flex items-center gap-2">
                    <TooltipProvider delayDuration={300}>
                        {/* Save draft / Update */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    onClick={handleSaveDraft}
                                    disabled={!canSave || isLoading}
                                    className={cn(
                                        isEditMode && 'border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950'
                                    )}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : isEditMode ? (
                                        <Pencil className="w-4 h-4 mr-2" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    <span className="hidden sm:inline">
                                        {isEditMode ? 'Aktualizuj' : 'Zapisz szkic'}
                                    </span>
                                    <span className="sm:hidden">
                                        {isEditMode ? 'Aktualizuj' : 'Zapisz'}
                                    </span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {isEditMode
                                    ? 'Zapisz zmiany w poście'
                                    : 'Zapisz jako szkic do późniejszej edycji'
                                }
                            </TooltipContent>
                        </Tooltip>

                        {/* Schedule dropdown */}
                        <DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            disabled={!canPublish || isLoading}
                                        >
                                            <Calendar className="w-4 h-4 mr-2" />
                                            <span className="hidden sm:inline">Zaplanuj</span>
                                            <ChevronDown className="w-4 h-4 ml-1" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>Zaplanuj publikację na później</TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent align="end" className="w-48">
                                {QUICK_SCHEDULE.map((option) => (
                                    <DropdownMenuItem
                                        key={option.label}
                                        onClick={() => handleQuickSchedule(option.hours)}
                                    >
                                        <Clock className="w-4 h-4 mr-2" />
                                        {option.label}
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setIsScheduleOpen(true)}>
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Wybierz datę...
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Share Now */}
                        {onShareNow && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        onClick={onShareNow}
                                        disabled={!canPublish || isLoading}
                                        className="gap-2 border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950"
                                    >
                                        <Zap className="w-4 h-4" />
                                        <span className="hidden lg:inline">Udostępnij teraz</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Natychmiastowe udostępnienie przez Share Dialog
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {/* Publish manually - GŁÓWNY PRZYCISK */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={onPublishManually}
                                    disabled={!canPublish || isLoading}
                                    className="gap-2 bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-lg shadow-primary/25"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span className="hidden sm:inline">Opublikuj</span>
                                    <span className="sm:hidden">Publikuj</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Otwórz modal z instrukcjami ręcznej publikacji
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Custom schedule dialog */}
            <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Zaplanuj publikację</DialogTitle>
                        <DialogDescription>
                            Wybierz datę i godzinę. Post zostanie dodany do kalendarza
                            i może być opublikowany automatycznie przez Autopilota
                            (wymaga Facebook Page lub Instagram Business).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="schedule-date">Data</Label>
                            <Input
                                id="schedule-date"
                                type="date"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="schedule-time">Godzina</Label>
                            <Input
                                id="schedule-time"
                                type="time"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsScheduleOpen(false)}
                        >
                            Anuluj
                        </Button>
                        <Button
                            onClick={handleCustomSchedule}
                            disabled={!scheduleDate || !scheduleTime || isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Calendar className="w-4 h-4 mr-2" />
                            )}
                            Zaplanuj
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default ActionBar;