// src/components/calendar/week-view.tsx
'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isToday,
    isSameDay,
    setHours
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScheduledPost } from '@/types/calendar';
import { useCalendarStore } from '@/store/calendar-store';
import { PostCard } from './post-card';
import { DroppableDay } from './droppable-day';

interface WeekViewProps {
    posts: ScheduledPost[];
    onPostMove?: (postId: string, newDate: Date) => void;
    enableDroppable?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WORKING_HOURS = { start: 6, end: 22 }; // Widoczne domyślnie 6:00 - 22:00

export function WeekView({ posts, onPostMove, enableDroppable = false }: WeekViewProps) {
    const { currentDate, openScheduleModal, selectDate } = useCalendarStore();

    const weekDays = useMemo(() => {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }, [currentDate]);

    const getPostsForHour = (day: Date, hour: number) => {
        return posts.filter((post) => {
            const postDate = new Date(post.scheduledAt);
            return isSameDay(postDate, day) && postDate.getHours() === hour;
        });
    };

    const handleCellClick = (day: Date, hour: number) => {
        const selectedDateTime = setHours(day, hour);
        selectDate(selectedDateTime);
        openScheduleModal(selectedDateTime);
    };

    const handleDrop = (e: React.DragEvent, day: Date, hour: number) => {
        e.preventDefault();
        try {
            const post: ScheduledPost = JSON.parse(e.dataTransfer.getData('application/json'));
            const newDate = setHours(day, hour);
            // Zachowaj minuty z oryginalnego czasu
            const originalMinutes = new Date(post.scheduledAt).getMinutes();
            newDate.setMinutes(originalMinutes);
            onPostMove?.(String(post.id), newDate);
        } catch (error) {
            console.error('Drop error:', error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border rounded-xl overflow-hidden bg-card"
        >
            {/* Header z dniami tygodnia */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] bg-muted/50 border-b sticky top-0 z-10">
                {/* Puste miejsce na godziny */}
                <div className="p-2 border-r" />

                {/* Dni tygodnia */}
                {weekDays.map((day) => {
                    const headerContent = (
                        <div
                            className={cn(
                                "p-3 text-center border-r last:border-r-0",
                                isToday(day) && "bg-primary/10"
                            )}
                        >
                            <div className="text-xs text-muted-foreground uppercase">
                                {format(day, 'EEE', { locale: pl })}
                            </div>
                            <div
                                className={cn(
                                    "text-lg font-semibold mt-1",
                                    isToday(day) && "text-primary"
                                )}
                            >
                                {format(day, 'd')}
                            </div>
                        </div>
                    );

                    return (
                        <div key={day.toISOString()}>
                            {headerContent}
                        </div>
                    );
                })}
            </div>

            {/* Siatka godzinowa */}
            <div className="max-h-[600px] overflow-y-auto">
                {HOURS.filter(h => h >= WORKING_HOURS.start && h <= WORKING_HOURS.end).map((hour) => (
                    <div
                        key={hour}
                        className="grid grid-cols-[60px_repeat(7,1fr)] border-b last:border-b-0"
                    >
                        {/* Etykieta godziny */}
                        <div className="p-2 text-xs text-muted-foreground text-right pr-3 border-r bg-muted/30">
                            {format(setHours(new Date(), hour), 'HH:00')}
                        </div>

                        {/* Komórki dla każdego dnia */}
                        {weekDays.map((day) => {
                            const cellPosts = getPostsForHour(day, hour);
                            const isCurrentHour = isToday(day) && new Date().getHours() === hour;
                            const cellDate = setHours(new Date(day), hour);

                            const cellContent = (
                                <div
                                    onClick={() => handleCellClick(day, hour)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleDrop(e, day, hour)}
                                    className={cn(
                                        "min-h-[60px] h-full p-1 border-r last:border-r-0 cursor-pointer",
                                        "hover:bg-muted/50 transition-colors",
                                        isCurrentHour && "bg-primary/5 ring-1 ring-inset ring-primary/20"
                                    )}
                                >
                                    {cellPosts.map((post) => (
                                        <PostCard key={post.id} post={post} compact />
                                    ))}
                                </div>
                            );

                            // Jeśli enableDroppable, opakuj w DroppableDay
                            if (enableDroppable) {
                                return (
                                    <DroppableDay
                                        key={`${day.toISOString()}-${hour}`}
                                        id={`hour-${format(day, 'yyyy-MM-dd')}-${hour}`}
                                        date={cellDate}
                                    >
                                        {cellContent}
                                    </DroppableDay>
                                );
                            }

                            return (
                                <div key={`${day.toISOString()}-${hour}`}>
                                    {cellContent}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Time ribbon - wskaźnik aktualnego czasu */}
            <TimeRibbon weekDays={weekDays} />
        </motion.div>
    );
}

// Wskaźnik aktualnego czasu
function TimeRibbon({ weekDays }: { weekDays: Date[] }) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Sprawdź czy dziś jest w widocznym tygodniu
    const todayIndex = weekDays.findIndex(day => isToday(day));
    if (todayIndex === -1) return null;
    if (currentHour < WORKING_HOURS.start || currentHour > WORKING_HOURS.end) return null;

    const topOffset = ((currentHour - WORKING_HOURS.start) * 60 + currentMinute) / ((WORKING_HOURS.end - WORKING_HOURS.start + 1) * 60) * 100;
    const leftOffset = ((todayIndex + 1) / 8) * 100; // +1 bo pierwsza kolumna to godziny

    return (
        <div
            className="absolute pointer-events-none z-20"
            style={{
                top: `calc(${topOffset}% + 52px)`, // 52px to wysokość headera
                left: `calc(${leftOffset}% + 60px)`,
                width: `calc(${100/8}% - 1px)`,
            }}
        >
            <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                <div className="flex-1 h-0.5 bg-destructive" />
            </div>
        </div>
    );
}