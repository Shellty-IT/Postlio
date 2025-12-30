// src/components/autopilot/time-slots-picker.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    X,
    Clock,
    Sun,
    Sunset,
    Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ScheduleConfig,
    TimeSlot,
    DayOfWeek,
    DAYS_OF_WEEK,
    TIME_SLOT_SUGGESTIONS,
} from '@/types/autopilot';

interface TimeSlotsPickerProps {
    schedule: ScheduleConfig;
    onChange: (schedule: ScheduleConfig) => void;
    className?: string;
}

export function TimeSlotsPicker({
                                    schedule,
                                    onChange,
                                    className,
                                }: TimeSlotsPickerProps) {
    const [showTimeSelect, setShowTimeSelect] = useState(false);

    // Toggle day
    const toggleDay = (day: DayOfWeek) => {
        const isActive = schedule.selectedDays.includes(day);
        const newDays = isActive
            ? schedule.selectedDays.filter(d => d !== day)
            : [...schedule.selectedDays, day].sort((a, b) => a - b);

        onChange({
            ...schedule,
            selectedDays: newDays,
        });
    };

    // Add time slot
    const addTimeSlot = (time: string) => {
        const exists = schedule.timeSlots.some(s => s.time === time);
        if (exists) return;

        const suggestion = TIME_SLOT_SUGGESTIONS.find(s => s.time === time);

        const newSlot: TimeSlot = {
            id: `slot-${Date.now()}`,
            time,
            label: suggestion?.label,
        };

        const newSlots = [...schedule.timeSlots, newSlot]
            .sort((a, b) => a.time.localeCompare(b.time));

        onChange({
            ...schedule,
            timeSlots: newSlots,
        });
        setShowTimeSelect(false);
    };

    // Remove time slot
    const removeTimeSlot = (slotId: string) => {
        onChange({
            ...schedule,
            timeSlots: schedule.timeSlots.filter(s => s.id !== slotId),
        });
    };

    // Generate hours for select
    const hours = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        return `${hour}:00`;
    });

    // Get icon for time
    const getTimeIcon = (time: string) => {
        const hour = parseInt(time.split(':')[0]);
        if (hour >= 5 && hour < 12) return <Sun className="w-3.5 h-3.5 text-yellow-500" />;
        if (hour >= 12 && hour < 18) return <Sunset className="w-3.5 h-3.5 text-orange-500" />;
        return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
    };

    // Oblicz posty tygodniowo
    const postsPerWeek = schedule.timeSlots.length * schedule.selectedDays.length;

    return (
        <div className={cn('space-y-6', className)}>
            {/* Days Selection */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                    📅 Dni tygodnia
                </h4>

                <div className="flex gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                        const isActive = schedule.selectedDays.includes(day.value);
                        const isWeekend = day.value === 0 || day.value === 6;

                        return (
                            <button
                                key={day.value}
                                onClick={() => toggleDay(day.value)}
                                className={cn(
                                    "flex-1 py-3 rounded-xl font-medium text-sm transition-all",
                                    "border-2",
                                    isActive
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : isWeekend
                                            ? "border-border bg-muted/50 text-muted-foreground hover:border-primary/50"
                                            : "border-border bg-card text-foreground hover:border-primary/50"
                                )}
                            >
                <span className="block text-xs opacity-60 mb-0.5">
                  {day.short}
                </span>
                            </button>
                        );
                    })}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                    Wybrano: {schedule.selectedDays.length} {schedule.selectedDays.length === 1 ? 'dzień' : 'dni'}
                </p>
            </div>

            {/* Time Slots */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        Godziny publikacji
                    </h4>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTimeSelect(!showTimeSelect)}
                        className="gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Dodaj
                    </Button>
                </div>

                {/* Time slot selector */}
                <AnimatePresence>
                    {showTimeSelect && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
                        >
                            {/* Quick suggestions */}
                            <div className="grid grid-cols-3 gap-2">
                                {TIME_SLOT_SUGGESTIONS.map((suggestion) => {
                                    const exists = schedule.timeSlots.some(s => s.time === suggestion.time);

                                    return (
                                        <button
                                            key={suggestion.time}
                                            onClick={() => addTimeSlot(suggestion.time)}
                                            disabled={exists}
                                            className={cn(
                                                "p-3 rounded-lg border text-left transition-all",
                                                exists
                                                    ? "border-border bg-muted opacity-50 cursor-not-allowed"
                                                    : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span>{suggestion.icon}</span>
                                                <span className="text-sm font-medium">{suggestion.time}</span>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">
                        {suggestion.description}
                      </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Custom time select */}
                            <div className="flex items-center gap-2">
                                <Select onValueChange={addTimeSlot}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Lub wybierz inną godzinę..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {hours.map((hour) => {
                                            const exists = schedule.timeSlots.some(s => s.time === hour);
                                            return (
                                                <SelectItem
                                                    key={hour}
                                                    value={hour}
                                                    disabled={exists}
                                                >
                                                    {hour} {exists && '(już dodano)'}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Selected time slots */}
                <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                        {schedule.timeSlots.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl"
                            >
                                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>Dodaj godziny publikacji</p>
                            </motion.div>
                        ) : (
                            schedule.timeSlots.map((slot, index) => (
                                <motion.div
                                    key={slot.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl group hover:border-primary/30"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        {getTimeIcon(slot.time)}
                                    </div>

                                    <div className="flex-1">
                                        <span className="font-mono font-bold text-lg">{slot.time}</span>
                                        {slot.label && (
                                            <span className="text-xs text-muted-foreground ml-2">
                        {slot.label}
                      </span>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            {schedule.selectedDays.length} {schedule.selectedDays.length === 1 ? 'dzień' : 'dni'} w tygodniu
                                        </p>
                                    </div>

                                    <div className="text-xs text-muted-foreground">
                                        ~{schedule.selectedDays.length} postów/tydzień
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-8 h-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => removeTimeSlot(slot.id)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {/* Summary */}
                {postsPerWeek > 0 && (
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                        <p className="text-sm text-center">
              <span className="font-bold text-primary">
                {postsPerWeek}
              </span>
                            <span className="text-muted-foreground"> postów tygodniowo</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}