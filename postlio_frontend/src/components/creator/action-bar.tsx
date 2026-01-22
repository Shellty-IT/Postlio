// src/components/creator/action-bar.tsx
/**
 * Pasek akcji w kreatorze - z opcją ręcznej publikacji
 */

'use client';

import { useState } from 'react';
import {
    Save,
    Calendar,
    Loader2,
    Clock,
    ChevronDown,
    Hand,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
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

// ============================================================
// TYPY
// ============================================================

interface ActionBarProps {
    onSaveDraft: () => Promise<void>;
    onSchedule: (scheduledAt: string) => Promise<void>;
    onPublishManually: () => void;  // ← NOWE
    isSaving: boolean;
    hasContent: boolean;
    hasImage?: boolean;  // ← NOWE - dla Instagram
    selectedPlatform?: string;  // ← NOWE - info o platformie
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
// KOMPONENT
// ============================================================

export function ActionBar({
                              onSaveDraft,
                              onSchedule,
                              onPublishManually,
                              isSaving,
                              hasContent,
                              hasImage = false,
                              selectedPlatform,
                          }: ActionBarProps) {
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Instagram wymaga obrazka
    const isInstagram = selectedPlatform === 'instagram';
    const canPublish = hasContent && (!isInstagram || hasImage);
    const instagramWarning = isInstagram && !hasImage;

    return (
        <>
            <div className="flex items-center justify-between p-4">
                {/* Left side - info */}
                <div className="text-sm text-muted-foreground">
                    {instagramWarning ? (
                        <span className="flex items-center gap-1 text-amber-500">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Instagram wymaga zdjęcia
                        </span>
                    ) : hasContent ? (
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            Gotowy do publikacji
                        </span>
                    ) : (
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                            Dodaj treść
                        </span>
                    )}
                </div>

                {/* Right side - actions */}
                <div className="flex items-center gap-2">
                    {/* Save draft */}
                    <Button
                        variant="outline"
                        onClick={handleSaveDraft}
                        disabled={!hasContent || isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Zapisz szkic
                    </Button>

                    {/* Schedule dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                disabled={!canPublish || isLoading}
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                Zaplanuj
                                <ChevronDown className="w-4 h-4 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
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
                            <DropdownMenuItem onClick={() => setIsScheduleOpen(true)}>
                                <Calendar className="w-4 h-4 mr-2" />
                                Wybierz datę...
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Publish manually - NOWY PRZYCISK */}
                    <Button
                        onClick={onPublishManually}
                        disabled={!canPublish || isLoading}
                        className="bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90"
                    >
                        <Hand className="w-4 h-4 mr-2" />
                        Opublikuj ręcznie
                    </Button>
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