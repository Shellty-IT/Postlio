// src/components/autopilot/schedule-config.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    Zap,
    TrendingUp,
    Rocket,
    Sun,
    Plus,
    Trash2,
    Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    type ScheduleConfig,
    type FrequencyType,
    type DayOfWeek,
    type TimeSlot,
    DAYS_OF_WEEK,
    QUICK_SCHEDULE_PRESETS,
} from '@/types/autopilot';
import { cn } from '@/lib/utils';

interface ScheduleConfigProps {
    value: ScheduleConfig;
    onChange: (config: ScheduleConfig) => void;
}

const FREQUENCY_OPTIONS: { value: FrequencyType; label: string; description: string }[] = [
    { value: 'daily', label: 'Codziennie', description: 'Publikuj każdego dnia' },
    { value: 'weekly', label: 'Tygodniowo', description: 'Wybrane dni tygodnia' },
    { value: 'biweekly', label: 'Co 2 tygodnie', description: 'Wybrane dni co 2 tygodnie' },
    { value: 'monthly', label: 'Miesięcznie', description: 'Określona liczba postów miesięcznie' },
    { value: 'custom', label: 'Własny', description: 'Pełna konfiguracja' },
];

const PRESET_ICONS: Record<string, React.ReactNode> = {
    starter: <Zap className="h-5 w-5" />,
    growth: <TrendingUp className="h-5 w-5" />,
    aggressive: <Rocket className="h-5 w-5" />,
    weekend: <Sun className="h-5 w-5" />,
};

export function ScheduleConfigComponent({ value, onChange }: ScheduleConfigProps) {
    const [showCustomTime, setShowCustomTime] = useState(false);
    const [newTime, setNewTime] = useState('12:00');

    const handlePresetSelect = (presetId: string) => {
        const preset = QUICK_SCHEDULE_PRESETS.find((p) => p.id === presetId);
        if (preset?.schedule) {
            onChange({
                ...value,
                ...preset.schedule,
                timezone: value.timezone,
            });
        }
    };

    const handleFrequencyChange = (frequency: FrequencyType) => {
        onChange({ ...value, frequency });
    };

    const handleDayToggle = (day: DayOfWeek) => {
        const newDays = value.selectedDays.includes(day)
            ? value.selectedDays.filter((d) => d !== day)
            : [...value.selectedDays, day].sort();
        onChange({ ...value, selectedDays: newDays });
    };

    const handleAddTimeSlot = () => {
        if (!newTime) return;
        const newSlot: TimeSlot = {
            id: `ts-${Date.now()}`,
            time: newTime,
        };
        onChange({
            ...value,
            timeSlots: [...value.timeSlots, newSlot].sort((a, b) =>
                a.time.localeCompare(b.time)
            ),
        });
        setNewTime('12:00');
        setShowCustomTime(false);
    };

    const handleRemoveTimeSlot = (slotId: string) => {
        onChange({
            ...value,
            timeSlots: value.timeSlots.filter((s) => s.id !== slotId),
        });
    };

    const handlePostsPerPeriodChange = (posts: number) => {
        onChange({ ...value, postsPerPeriod: Math.max(1, Math.min(20, posts)) });
    };

    return (
        <div className="space-y-6">
            {/* Quick Presets */}
            <div>
                <Label className="mb-3 block text-sm font-medium">Szybkie ustawienia</Label>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {QUICK_SCHEDULE_PRESETS.map((preset) => {
                        const isSelected =
                            value.frequency === preset.schedule.frequency &&
                            value.postsPerPeriod === preset.schedule.postsPerPeriod;

                        return (
                            <motion.button
                                key={preset.id}
                                onClick={() => handlePresetSelect(preset.id)}
                                className={cn(
                                    'group relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all',
                                    isSelected
                                        ? 'border-violet-500 bg-violet-500/10'
                                        : 'border-border hover:border-violet-500/50 hover:bg-accent'
                                )}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div
                                    className={cn(
                                        'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                                        isSelected
                                            ? 'bg-violet-500 text-white'
                                            : 'bg-muted text-muted-foreground group-hover:bg-violet-500/20 group-hover:text-violet-500'
                                    )}
                                >
                                    {PRESET_ICONS[preset.id]}
                                </div>
                                <div>
                                    <p className="font-medium">{preset.name}</p>
                                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                                </div>
                                {isSelected && (
                                    <motion.div
                                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                    >
                                        <Check className="h-3 w-3 text-white" />
                                    </motion.div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Frequency & Posts per Period */}
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <Label className="mb-2 block">Częstotliwość</Label>
                    <Select value={value.frequency} onValueChange={handleFrequencyChange}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {FREQUENCY_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    <div className="flex flex-col">
                                        <span>{opt.label}</span>
                                        <span className="text-xs text-muted-foreground">{opt.description}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label className="mb-2 block">Liczba postów</Label>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePostsPerPeriodChange(value.postsPerPeriod - 1)}
                            disabled={value.postsPerPeriod <= 1}
                        >
                            -
                        </Button>
                        <div className="flex-1 text-center">
                            <span className="text-2xl font-bold">{value.postsPerPeriod}</span>
                            <span className="ml-1 text-sm text-muted-foreground">
                / {value.frequency === 'daily' ? 'dzień' : value.frequency === 'weekly' ? 'tydzień' : 'okres'}
              </span>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePostsPerPeriodChange(value.postsPerPeriod + 1)}
                            disabled={value.postsPerPeriod >= 20}
                        >
                            +
                        </Button>
                    </div>
                </div>
            </div>

            {/* Days of Week */}
            {value.frequency !== 'daily' && (
                <div>
                    <Label className="mb-3 block">Dni publikacji</Label>
                    <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => {
                            const isSelected = value.selectedDays.includes(day.value);
                            return (
                                <TooltipProvider key={day.value}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <motion.button
                                                onClick={() => handleDayToggle(day.value)}
                                                className={cn(
                                                    'flex h-12 w-12 items-center justify-center rounded-xl border-2 font-medium transition-all',
                                                    isSelected
                                                        ? 'border-violet-500 bg-violet-500 text-white'
                                                        : 'border-border hover:border-violet-500/50'
                                                )}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {day.short}
                                            </motion.button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{day.label}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        })}
                    </div>
                    {value.selectedDays.length === 0 && (
                        <p className="mt-2 text-sm text-destructive">
                            Wybierz przynajmniej jeden dzień
                        </p>
                    )}
                </div>
            )}

            {/* Time Slots */}
            <div>
                <Label className="mb-3 block">Godziny publikacji</Label>
                <div className="space-y-3">
                    {/* Existing Time Slots */}
                    <div className="flex flex-wrap gap-2">
                        <AnimatePresence mode="popLayout">
                            {value.timeSlots.map((slot) => (
                                <motion.div
                                    key={slot.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                >
                                    <Badge
                                        variant="secondary"
                                        className="flex items-center gap-2 px-3 py-2 text-sm"
                                    >
                                        <Clock className="h-3.5 w-3.5" />
                                        {slot.time}
                                        {slot.label && (
                                            <span className="text-xs text-muted-foreground">
                        ({slot.label})
                      </span>
                                        )}
                                        <button
                                            onClick={() => handleRemoveTimeSlot(slot.id)}
                                            className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                                        >
                                            <Trash2 className="h-3 w-3 text-destructive" />
                                        </button>
                                    </Badge>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Add Time Slot */}
                    <AnimatePresence mode="wait">
                        {showCustomTime ? (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center gap-2"
                            >
                                <Input
                                    type="time"
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                    className="w-32"
                                />
                                <Button size="sm" onClick={handleAddTimeSlot}>
                                    <Check className="mr-1 h-4 w-4" />
                                    Dodaj
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setShowCustomTime(false)}
                                >
                                    Anuluj
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div key="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowCustomTime(true)}
                                    className="border-dashed"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Dodaj godzinę
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Schedule Preview */}
            <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/20">
                        <Calendar className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                        <h4 className="font-medium">Podsumowanie harmonogramu</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {value.postsPerPeriod} post{value.postsPerPeriod > 1 ? 'y' : ''}{' '}
                            {value.frequency === 'daily' && 'dziennie'}
                            {value.frequency === 'weekly' && 'tygodniowo'}
                            {value.frequency === 'biweekly' && 'co 2 tygodnie'}
                            {value.frequency === 'monthly' && 'miesięcznie'}
                            {value.frequency !== 'daily' && value.selectedDays.length > 0 && (
                                <>
                                    {' '}
                                    w dni:{' '}
                                    {value.selectedDays
                                        .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.short)
                                        .join(', ')}
                                </>
                            )}
                            {value.timeSlots.length > 0 && (
                                <>
                                    {' '}
                                    o godzinach: {value.timeSlots.map((s) => s.time).join(', ')}
                                </>
                            )}
                        </p>
                        <p className="mt-2 text-sm font-medium text-violet-600 dark:text-violet-400">
                            ~{calculateMonthlyPosts(value)} postów miesięcznie
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}

// Helper function to calculate estimated monthly posts
function calculateMonthlyPosts(config: ScheduleConfig): number {
    const postsPerDay = config.timeSlots.length * config.postsPerPeriod;

    switch (config.frequency) {
        case 'daily':
            return postsPerDay * 30;
        case 'weekly':
            return config.selectedDays.length * config.timeSlots.length * 4;
        case 'biweekly':
            return config.selectedDays.length * config.timeSlots.length * 2;
        case 'monthly':
            return config.postsPerPeriod;
        default:
            return config.selectedDays.length * config.timeSlots.length * 4;
    }
}