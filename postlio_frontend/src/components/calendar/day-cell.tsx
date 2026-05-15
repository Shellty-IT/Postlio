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
import { Plus } from 'lucide-react';
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

    return (
        <motion.div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "min-h-[120px] p-2 border-b border-r border-border/50 transition-all duration-200",
                "group relative",
                !day.isCurrentMonth && "bg-muted/30",
                day.isToday && "bg-primary/5 ring-1 ring-primary/20",
                isDragOver && "bg-primary/10 ring-2 ring-primary/30",
                isHovered && day.isCurrentMonth && "bg-muted/50"
            )}
        >
            {/* Day Header */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                            day.isToday && "bg-primary text-primary-foreground",
                            !day.isCurrentMonth && "text-muted-foreground"
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

            {/* Drop zone overlay - pokazuje się gdy coś jest przeciągane nad komórką */}
            <AnimatePresence>
                {isDragOver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 border-2 border-dashed rounded-lg pointer-events-none border-primary bg-primary/10"
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
});