// src/app/(dashboard)/calendar/page.tsx
'use client';

import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
} from 'date-fns';
import {
    CalendarHeader,
    MonthView,
    WeekView,
    ScheduleModal,
    CalendarStats
} from '@/components/calendar';
import { useCalendarStore } from '@/store/calendar-store';
import { useCalendarPosts, useUpdatePost } from '@/hooks';
import type { ScheduledPost } from '@/types/calendar';
import type { CalendarEvent } from '@/lib/api';

// ============================================================
// HELPER: Konwersja CalendarEvent -> ScheduledPost
// ============================================================

function convertToScheduledPost(event: CalendarEvent): ScheduledPost {
    return {
        id: event.id,
        title: event.title,
        content: event.preview || '',
        platforms: event.platforms as ScheduledPost['platforms'],
        scheduledAt: new Date(`${event.date}T${event.time}`),
        status: event.status as ScheduledPost['status'],
        brandId: undefined, // API nie zwraca tego w CalendarEvent
        brandName: undefined,
        aiGenerated: false,
        imageUrl: undefined,
    };
}

// ============================================================
// KOMPONENT
// ============================================================

export default function CalendarPage() {
    const { view, currentDate } = useCalendarStore();

    // Oblicz zakres dat dla API
    const dateRange = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

        return {
            start_date: format(calendarStart, 'yyyy-MM-dd'),
            end_date: format(calendarEnd, 'yyyy-MM-dd'),
        };
    }, [currentDate]);

    // Pobierz posty z API
    const {
        data: apiEvents = [],
        isLoading,
        isError
    } = useCalendarPosts(dateRange);

    // Mutation do aktualizacji
    const updatePost = useUpdatePost();

    // Konwertuj API events na ScheduledPost
    const posts = useMemo(() => {
        return apiEvents.map(convertToScheduledPost);
    }, [apiEvents]);

    // Handler przenoszenia posta
    const handlePostMove = useCallback(async (postId: string, newDate: Date) => {
        // Znajdź oryginalny event
        const event = apiEvents.find(e => e.id === postId);
        if (!event) return;

        try {
            await updatePost.mutateAsync({
                id: event.post_id,
                data: {
                    scheduled_at: newDate.toISOString(),
                },
            });

            toast.success('Post został przeniesiony', {
                description: `Nowa data: ${format(newDate, 'dd.MM.yyyy HH:mm')}`,
            });
        } catch {
            toast.error('Nie udało się przenieść posta');
        }
    }, [apiEvents, updatePost]);

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-3xl font-bold">Kalendarz</h1>
                    <p className="text-muted-foreground mt-1">
                        Zarządzaj harmonogramem publikacji i planuj posty
                    </p>
                </motion.div>

                <div className="flex items-center justify-center h-96">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Ładowanie kalendarza...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (isError) {
        return (
            <div className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-3xl font-bold">Kalendarz</h1>
                    <p className="text-muted-foreground mt-1">
                        Zarządzaj harmonogramem publikacji i planuj posty
                    </p>
                </motion.div>

                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <p className="text-destructive mb-2">Błąd ładowania kalendarza</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-sm text-primary hover:underline"
                        >
                            Spróbuj ponownie
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold">Kalendarz</h1>
                <p className="text-muted-foreground mt-1">
                    Zarządzaj harmonogramem publikacji i planuj posty
                </p>
            </motion.div>

            {/* Stats */}
            <CalendarStats posts={posts} />

            {/* Calendar Header with controls */}
            <CalendarHeader />

            {/* Calendar Views */}
            <motion.div
                key={view}
                initial={{ opacity: 0, x: view === 'month' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                {view === 'month' ? (
                    <MonthView posts={posts} onPostMove={handlePostMove} />
                ) : (
                    <WeekView posts={posts} onPostMove={handlePostMove} />
                )}
            </motion.div>

            {/* Schedule Modal */}
            <ScheduleModal />
        </div>
    );
}