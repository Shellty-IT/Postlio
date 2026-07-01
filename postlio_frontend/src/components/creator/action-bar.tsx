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

interface ActionBarProps {
    onSaveDraft: () => Promise<void>;
    onSchedule: (scheduledAt: string) => Promise<void>;
    onPublishManually: () => void;
    isSaving: boolean;
    hasContent: boolean;
    hasImage?: boolean;
    selectedPlatform?: string;
    selectedPlatforms?: Platform[];
    isEditMode?: boolean;
}

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
    const getStatus = () => {
        if (isEditMode && hasAnything) {
            return {
                icon: Pencil,
                text: 'Tryb edycji',
                shortText: 'Edycja',
                color: 'text-accent',
                bgColor: 'bg-accent/10',
                borderColor: 'border-accent/30',
                dotColor: 'bg-accent',
                pulse: false,
            };
        }

        if (instagramNeedsImage) {
            return {
                icon: ImageOff,
                text: 'Instagram wymaga zdjęcia',
                shortText: 'Dodaj zdjęcie',
                color: 'text-warning',
                bgColor: 'bg-warning/10',
                borderColor: 'border-warning/30',
                dotColor: 'bg-warning',
                pulse: true,
            };
        }

        if (hasAnything) {
            return {
                icon: CheckCircle2,
                text: 'Gotowy do publikacji',
                shortText: 'Gotowy',
                color: 'text-success',
                bgColor: 'bg-success/10',
                borderColor: 'border-success/30',
                dotColor: 'bg-success',
                pulse: false,
            };
        }

        return {
            icon: PenLine,
            text: 'Dodaj treść lub zdjęcie',
            shortText: 'Dodaj treść',
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
                    'flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border text-xs sm:text-sm font-medium',
                    status.bgColor,
                    status.borderColor,
                    status.color
                )}
            >
                <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                    {status.pulse && (
                        <span className={cn(
                            'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
                            status.dotColor
                        )} />
                    )}
                    <span className={cn(
                        'relative inline-flex rounded-full h-full w-full',
                        status.dotColor
                    )} />
                </span>

                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />

                <span className="hidden xs:inline sm:hidden">{status.shortText}</span>
                <span className="hidden sm:inline">{status.text}</span>
            </motion.div>
        </AnimatePresence>
    );
}

export function ActionBar({
                              onSaveDraft,
                              onSchedule,
                              onPublishManually,
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

    const hasAnything = hasContent || hasImage;

    const platforms = selectedPlatforms.length > 0
        ? selectedPlatforms
        : (selectedPlatform ? [selectedPlatform as Platform] : []);

    const hasInstagram = platforms.includes('instagram');
    const instagramNeedsImage = hasInstagram && !hasImage;

    const canSave = hasAnything;
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
            <div className="flex items-center justify-between gap-2 p-3 sm:p-4">
                <StatusIndicator
                    hasAnything={hasAnything}
                    instagramNeedsImage={instagramNeedsImage}
                    isEditMode={isEditMode}
                />

                <div className="flex items-center gap-1.5 sm:gap-2">
                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSaveDraft}
                                    disabled={!canSave || isLoading}
                                    className={cn(
                                        "h-9 px-2 sm:px-3 rounded-[11px] border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                                        isEditMode && 'border-accent/30 text-accent hover:bg-accent/10'
                                    )}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : isEditMode ? (
                                        <Pencil className="w-4 h-4" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    <span className="hidden sm:inline ml-2">
                                        {isEditMode ? 'Aktualizuj' : 'Zapisz'}
                                    </span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {isEditMode ? 'Zapisz zmiany' : 'Zapisz jako szkic'}
                            </TooltipContent>
                        </Tooltip>

                        <DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!canPublish || isLoading}
                                            className="h-9 px-2 sm:px-3 rounded-[11px] border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                                        >
                                            <Calendar className="w-4 h-4" />
                                            <span className="hidden sm:inline ml-2">Zaplanuj</span>
                                            <ChevronDown className="w-3 h-3 ml-1" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>Zaplanuj publikację</TooltipContent>
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

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    onClick={onPublishManually}
                                    disabled={!canPublish || isLoading}
                                    className="h-9 px-2 sm:px-3 gap-1.5 btn-gradient"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span className="hidden xs:inline">Publikuj</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Otwórz modal publikacji
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Zaplanuj publikację</DialogTitle>
                        <DialogDescription>
                            Wybierz datę i godzinę publikacji.
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