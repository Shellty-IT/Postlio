// src/components/calendar/month-view.tsx
'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isToday,
    isSameDay,
    format,
} from 'date-fns';
import { DayCell } from './day-cell';
import { DroppableDay } from './droppable-day';
import { CalendarDay, ScheduledPost } from '@/types/calendar';
import { useCalendarStore } from '@/store/calendar-store';

interface MonthViewProps {
    posts: ScheduledPost[];
    onPostMove?: (postId: string, newDate: Date) => void;
    enableDroppable?: boolean;
}

const WEEKDAYS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];

export function MonthView({ posts, onPostMove, enableDroppable = false }: MonthViewProps) {
    const { currentDate } = useCalendarStore();

    const calendarDays = useMemo((): CalendarDay[] => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

        return days.map((date) => ({
            date,
            isCurrentMonth: isSameMonth(date, currentDate),
            isToday: isToday(date),
            posts: posts.filter((post) =>
                isSameDay(new Date(post.scheduledAt), date)
            ),
        }));
    }, [currentDate, posts]);

    const handleDrop = (post: ScheduledPost, targetDate: Date) => {
        if (onPostMove) {
            // Zachowaj godzinę, zmień tylko datę
            const newDateTime = new Date(targetDate);
            const oldTime = new Date(post.scheduledAt);
            newDateTime.setHours(oldTime.getHours(), oldTime.getMinutes());

            onPostMove(String(post.id), newDateTime);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border rounded-xl overflow-hidden bg-card"
        >
            {/* Weekday headers */}
            <div className="grid grid-cols-7 bg-muted/50">
                {WEEKDAYS.map((day) => (
                    <div
                        key={day}
                        className="py-3 text-center text-sm font-medium text-muted-foreground border-b border-r last:border-r-0"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                    const dayContent = (
                        <DayCell
                            key={day.date.toISOString()}
                            day={day}
                            onDrop={handleDrop}
                        />
                    );

                    // Jeśli enableDroppable, opakuj w DroppableDay
                    if (enableDroppable) {
                        return (
                            <DroppableDay
                                key={day.date.toISOString()}
                                id={`day-${format(day.date, 'yyyy-MM-dd')}`}
                                date={day.date}
                                disabled={!day.isCurrentMonth}
                            >
                                {dayContent}
                            </DroppableDay>
                        );
                    }

                    return dayContent;
                })}
            </div>
        </motion.div>
    );
}