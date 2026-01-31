// src/app/(dashboard)/calendar/page.tsx
'use client';

import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
    DndContext,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
} from '@dnd-kit/core';
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
    CalendarStats,
    DraftsSidebar,
    DragOverlayContent,
} from '@/components/calendar';
import { FeatureLocked, CalendarLimitedBanner } from '@/components/common';
import { useCalendarStore } from '@/store/calendar-store';
import { useAuthStore } from '@/store/auth-store';
import { useCalendarPosts, useUpdatePost, usePosts } from '@/hooks';
import type { ScheduledPost } from '@/types/calendar';
import type { CalendarEvent } from '@/lib/api';
import type { Post } from '@/types';

// ============================================================
// HELPER: Konwersja CalendarEvent -> ScheduledPost
// ============================================================

function convertToScheduledPost(event: CalendarEvent): ScheduledPost {
    return {
        id: event.id,
        title: event.title,
        content: event.preview || '',
        platform: Array.isArray(event.platforms) && event.platforms.length > 0
            ? event.platforms[0]
            : (event.platforms as unknown as ScheduledPost['platform']) || 'facebook',
        scheduledAt: new Date(`${event.date}T${event.time}`),
        status: event.status as ScheduledPost['status'],
        brandId: event.brand_id,
        brandName: undefined,
        aiGenerated: false,
        imageUrl: event.image_url,
    };
}

// ============================================================
// KOMPONENT
// ============================================================

export default function CalendarPage() {
    const { view, currentDate } = useCalendarStore();
    const { capabilities } = useAuthStore();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeDraft, setActiveDraft] = useState<Post | null>(null);

    // Sprawdź dostęp
    const accessLevel = capabilities.access_level;
    const canUseCalendar = capabilities.can_use_calendar;
    const canAutoPublish = capabilities.can_auto_publish;

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

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

    // Pobierz posty z API (kalendarz) - tylko jeśli ma dostęp
    const {
        data: apiEvents = [],
        isLoading: isLoadingCalendar,
        isError
    } = useCalendarPosts(dateRange);

    // Pobierz wszystkie posty (dla draftów)
    const {
        data: allPostsData,
        isLoading: isLoadingPosts,
    } = usePosts({ status: 'draft' });

    const drafts = allPostsData?.posts || [];

    // Mutation do aktualizacji
    const updatePost = useUpdatePost();

    // Konwertuj API events na ScheduledPost
    const posts = useMemo(() => {
        return apiEvents.map(convertToScheduledPost);
    }, [apiEvents]);

    // Handler przenoszenia posta (istniejącego w kalendarzu)
    const handlePostMove = useCallback(async (postId: string, newDate: Date) => {
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

    // DnD handlers
    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        const draft = active.data.current?.draft as Post | undefined;
        if (draft) {
            setActiveDraft(draft);
        }
    }, []);

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDraft(null);

        if (!over) return;

        const draft = active.data.current?.draft as Post | undefined;
        const targetDate = over.data.current?.date as Date | undefined;

        if (!draft || !targetDate) return;

        // Ustaw domyślną godzinę na 12:00 jeśli to dzień
        const scheduledDate = new Date(targetDate);
        if (scheduledDate.getHours() === 0 && scheduledDate.getMinutes() === 0) {
            scheduledDate.setHours(12, 0, 0, 0);
        }

        try {
            await updatePost.mutateAsync({
                id: String(draft.id),
                data: {
                    scheduled_at: scheduledDate.toISOString(),
                    status: 'scheduled',
                },
            });

            // Różny komunikat w zależności od możliwości auto-publish
            if (canAutoPublish) {
                toast.success('Post zaplanowany!', {
                    description: `${format(scheduledDate, 'dd.MM.yyyy')} o ${format(scheduledDate, 'HH:mm')} - zostanie opublikowany automatycznie`,
                });
            } else {
                toast.success('Przypomnienie ustawione!', {
                    description: `${format(scheduledDate, 'dd.MM.yyyy')} o ${format(scheduledDate, 'HH:mm')} - otrzymasz powiadomienie`,
                });
            }
        } catch {
            toast.error('Nie udało się zaplanować posta');
        }
    }, [updatePost, canAutoPublish]);

    const handleDragCancel = useCallback(() => {
        setActiveDraft(null);
    }, []);

    // ============================================================
    // BLOKADA - Brak konta (tryb demo)
    // ============================================================
    if (!canUseCalendar) {
        return (
            <div className="p-6">
                <FeatureLocked
                    feature="calendar"
                    accessLevel={accessLevel}
                />
            </div>
        );
    }

    // Loading state
    if (isLoadingCalendar) {
        return (
            <div className="p-6">
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
            <div className="p-6">
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
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="flex h-[calc(100vh-4rem)]">
                {/* Main Calendar Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-auto p-6 space-y-6">
                        {/* Banner dla konta osobistego (limited) */}
                        {accessLevel === 'limited' && (
                            <CalendarLimitedBanner />
                        )}

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
                                <MonthView
                                    posts={posts}
                                    onPostMove={handlePostMove}
                                    enableDroppable
                                />
                            ) : (
                                <WeekView
                                    posts={posts}
                                    onPostMove={handlePostMove}
                                    enableDroppable
                                />
                            )}
                        </motion.div>
                    </div>
                </div>

                {/* Drafts Sidebar */}
                <DraftsSidebar
                    drafts={drafts}
                    isLoading={isLoadingPosts}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
            </div>

            {/* Schedule Modal */}
            <ScheduleModal />

            {/* Drag Overlay */}
            <DragOverlay>
                {activeDraft && (
                    <DragOverlayContent draft={activeDraft} />
                )}
            </DragOverlay>
        </DndContext>
    );
}