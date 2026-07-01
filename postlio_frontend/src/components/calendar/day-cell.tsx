// src/components/calendar/day-cell.tsx
/**
 * Komórka dnia w kalendarzu
 *
 * ✅ NAPRAWIONE: Obsługa platforms[] + bezpieczne indeksowanie
 */

'use client';

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CalendarDay, ScheduledPost } from '@/types/calendar';
import { useCalendarStore } from '@/store/calendar-store';
import { PostCard } from './post-card';
import type { Platform } from '@/types';

interface DayCellProps {
    day: CalendarDay;
    onDrop?: (post: ScheduledPost, targetDate: Date) => void;
}

// Platform colors config
const platformColors: Record<Platform, string> = {
    facebook: '#1877F2',
    instagram: '#E4405F',
    linkedin: '#0A66C2',
};

const AI_SLOT_TIMES = ['09:00', '12:30', '18:00'];

function getSuggestedTime(dayOfMonth: number): string {
    return AI_SLOT_TIMES[dayOfMonth % AI_SLOT_TIMES.length];
}

export const DayCell = memo(function DayCell({ day, onDrop }: DayCellProps) {
    const { openScheduleModal, selectDate } = useCalendarStore();
    const [isHovered, setIsHovered] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        try {
            const postData = JSON.parse(e.dataTransfer.getData('application/json'));
            onDrop?.(postData, day.date);
        } catch (error) {
            console.error('Drop error:', error);
        }
    };

    const handleAddClick = () => {
        selectDate(day.date);
        openScheduleModal(day.date);
    };

    // Zbierz unikalne platformy ze wszystkich postów tego dnia
    // Obsługa zarówno platforms[] jak i legacy platform
    const uniquePlatforms = Array.from(new Set(
        day.posts.flatMap(post => {
            if (post.platforms && post.platforms.length > 0) {
                return post.platforms;
            }
            return post.platform ? [post.platform] : [];
        })
    )).filter((p): p is Platform => !!p);

    const isEmptySlot = day.isCurrentMonth && !day.isToday && day.posts.length === 0;
    const suggestedTime = isEmptySlot ? getSuggestedTime(day.date.getDate()) : null;

    return (
        <motion.div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "min-h-[104px] xs:min-h-[120px] flex flex-col rounded-[14px] border p-2 transition-all duration-200",
                "group relative",
                !day.isCurrentMonth && "border-white/[0.045] bg-white/[0.008] opacity-45",
                day.isCurrentMonth && !day.isToday && !isEmptySlot && "border-white/[0.06] bg-white/[0.015]",
                day.isToday && "border-primary/40 bg-primary/[0.08] shadow-[0_12px_30px_-18px_hsl(var(--primary)/0.5)]",
                isEmptySlot && "dashed-slot",
                isDragOver && "!border-primary !bg-primary/10 ring-2 ring-primary/30",
                isHovered && day.isCurrentMonth && !isEmptySlot && "bg-white/[0.03]"
            )}
        >
            {/* Day Header */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            "text-xs font-medium w-[22px] h-[22px] flex items-center justify-center rounded-[7px]",
                            day.isToday
                                ? "bg-gradient-to-br from-primary to-accent font-bold text-white"
                                : day.isCurrentMonth
                                    ? "text-muted-foreground"
                                    : "text-muted-foreground/60"
                        )}
                    >
                        {format(day.date, 'd')}
                    </span>

                    {/* Platform dots */}
                    {uniquePlatforms.length > 0 && (
                        <div className="flex gap-0.5">
                            {uniquePlatforms.map(platform => (
                                <div
                                    key={platform}
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: platformColors[platform] || '#888' }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Add button - visible on hover */}
                <AnimatePresence>
                    {isHovered && day.isCurrentMonth && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={handleAddClick}
                            className={cn(
                                "p-1 rounded-md hover:bg-primary/10 text-muted-foreground",
                                "hover:text-primary transition-colors"
                            )}
                        >
                            <Plus className="h-4 w-4" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Posts */}
            <div className="space-y-1 overflow-hidden">
                <AnimatePresence mode="popLayout">
                    {day.posts.slice(0, 3).map((post) => (
                        <PostCard key={post.id} post={post} compact />
                    ))}
                </AnimatePresence>

                {/* More posts indicator */}
                {day.posts.length > 3 && (
                    <button
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => selectDate(day.date)}
                    >
                        +{day.posts.length - 3} więcej
                    </button>
                )}
            </div>

            {/* AI-suggested empty slot chip */}
            {suggestedTime && (
                <div className="mt-auto flex items-center gap-1 self-start rounded-[7px] border border-dashed border-primary/35 bg-primary/10 px-1.5 py-1 text-[10px] text-primary/80">
                    <Sparkles className="h-2.5 w-2.5" />
                    {suggestedTime}
                </div>
            )}

            {/* Drop zone overlay - pokazuje się gdy coś jest przeciągane nad komórką */}
            <AnimatePresence>
                {isDragOver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 rounded-[14px] border-2 border-dashed pointer-events-none border-primary bg-primary/10"
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
});