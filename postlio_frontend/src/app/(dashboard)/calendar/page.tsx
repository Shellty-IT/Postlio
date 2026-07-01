// src/app/(dashboard)/calendar/page.tsx
'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    DndContext,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
    PointerSensor,
    TouchSensor,
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
    isWithinInterval,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { FileText, Sparkles } from 'lucide-react';
import {
    CalendarHeader,
    MonthView,
    WeekView,
    ScheduleModal,
    CalendarStats,
    DraftsSidebar,
    DragOverlayContent,
    MobileAgendaView,
} from '@/components/calendar';
import { FeatureLocked, CalendarLimitedBanner } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useCalendarStore } from '@/store/calendar-store';
import { useAuthStore } from '@/store/auth-store';
import { useCalendarPosts, useUpdatePost, usePosts } from '@/hooks';
import type { ScheduledPost } from '@/types/calendar';
import type { CalendarEvent } from '@/types/post';
import type { Post } from '@/types/post';
import type { Platform } from '@/types';

function convertToScheduledPost(event: CalendarEvent): ScheduledPost {
    const platformsArray: Platform[] = Array.isArray(event.platforms) && event.platforms.length > 0
        ? event.platforms
        : ['facebook'];

    const primaryPlatform: Platform = platformsArray[0];

    return {
        id: event.id,
        title: event.title,
        content: event.preview || '',
        platforms: platformsArray,
        platform: primaryPlatform,
        platform_statuses: event.platform_statuses || {},
        scheduledAt: new Date(`${event.date}T${event.time}`),
        status: event.status,
        brandId: event.brand_id ?? undefined,
        brandName: undefined,
        aiGenerated: false,
        imageUrl: event.image_url ?? undefined,
    };
}

export default function CalendarPage() {
    const { view, currentDate } = useCalendarStore();
    const { capabilities } = useAuthStore();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeDraft, setActiveDraft] = useState<Post | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isDraftSheetOpen, setIsDraftSheetOpen] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const accessLevel = capabilities.access_level;
    const canUseCalendar = capabilities.can_use_calendar;
    const canAutoPublish = capabilities.can_auto_publish;

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 250, tolerance: 5 },
        })
    );

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

    const {
        data: apiEvents = [],
        isLoading: isLoadingCalendar,
        isError
    } = useCalendarPosts(dateRange);

    const {
        data: allPostsData,
        isLoading: isLoadingPosts,
    } = usePosts({ status: 'draft' });

    const drafts = allPostsData?.posts || [];
    const updatePost = useUpdatePost();

    const posts = useMemo(() => {
        return apiEvents.map(convertToScheduledPost);
    }, [apiEvents]);

    const currentWeek = useMemo(() => {
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
        return { start: weekStart, end: weekEnd };
    }, []);

    const isCurrentWeekEmpty = useMemo(() => {
        return !posts.some((post) =>
            isWithinInterval(new Date(post.scheduledAt), currentWeek)
        );
    }, [posts, currentWeek]);

    const handlePostMove = useCallback(async (postId: string, newDate: Date) => {
        const event = apiEvents.find(e => e.id === postId);
        if (!event) return;

        try {
            await updatePost.mutateAsync({
                id: event.post_id,
                data: { scheduled_at: newDate.toISOString() },
            });

            toast.success('Post został przeniesiony', {
                description: `Nowa data: ${format(newDate, 'dd.MM.yyyy HH:mm')}`,
            });
        } catch {
            toast.error('Nie udało się przenieść posta');
        }
    }, [apiEvents, updatePost]);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        const draft = active.data.current?.draft as Post | undefined;
        if (draft) setActiveDraft(draft);
    }, []);

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDraft(null);

        if (!over) return;

        const draft = active.data.current?.draft as Post | undefined;
        const targetDate = over.data.current?.date as Date | undefined;

        if (!draft || !targetDate) return;

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

            setIsDraftSheetOpen(false);

            if (canAutoPublish) {
                toast.success('Post zaplanowany!', {
                    description: `${format(scheduledDate, 'dd.MM.yyyy')} o ${format(scheduledDate, 'HH:mm')}`,
                });
            } else {
                toast.success('Przypomnienie ustawione!', {
                    description: `${format(scheduledDate, 'dd.MM.yyyy')} o ${format(scheduledDate, 'HH:mm')}`,
                });
            }
        } catch {
            toast.error('Nie udało się zaplanować posta');
        }
    }, [updatePost, canAutoPublish]);

    const handleDragCancel = useCallback(() => {
        setActiveDraft(null);
    }, []);

    if (!canUseCalendar) {
        return (
            <div className="p-4 sm:p-6">
                <FeatureLocked feature="calendar" accessLevel={accessLevel} />
            </div>
        );
    }

    if (isLoadingCalendar) {
        return (
            <div className="p-4 sm:p-6">
                <div className="flex items-center justify-center h-96">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Ładowanie kalendarza...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4 sm:p-6">
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

    const draftCount = drafts.filter(d => d.status === 'draft').length;
    const showAiEmptyWeekBanner = isCurrentWeekEmpty && draftCount > 0;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="flex h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] -mx-3 xs:-mx-4 sm:-mx-6 lg:-mx-8 -mb-4">
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-auto p-3 xs:p-4 sm:p-6 space-y-4 sm:space-y-6 pb-20 md:pb-6">
                        {accessLevel === 'limited' && <CalendarLimitedBanner />}

                        <div className="flex items-center justify-between gap-2">
                            <CalendarStats posts={posts} />

                            {isMobile && (
                                <Sheet open={isDraftSheetOpen} onOpenChange={setIsDraftSheetOpen}>
                                    <SheetTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 flex-shrink-0 rounded-[11px] border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]"
                                        >
                                            <FileText className="h-4 w-4" />
                                            <span className="hidden xs:inline">Szkice</span>
                                            {draftCount > 0 && (
                                                <Badge className="h-5 rounded-md bg-warning/16 px-1.5 text-xs text-warning hover:bg-warning/16">
                                                    {draftCount}
                                                </Badge>
                                            )}
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="right" className="w-full xs:w-80 p-0 border-white/10 bg-[#0a0a0f]">
                                        <SheetHeader className="p-4 border-b border-white/[0.06]">
                                            <SheetTitle className="mono-label flex items-center gap-2 text-foreground/70">
                                                <FileText className="h-4 w-4" />
                                                SZKICE
                                            </SheetTitle>
                                        </SheetHeader>
                                        <DraftsSidebar
                                            drafts={drafts}
                                            isLoading={isLoadingPosts}
                                            isCollapsed={false}
                                            isMobileSheet
                                        />
                                    </SheetContent>
                                </Sheet>
                            )}
                        </div>

                        <CalendarHeader isMobile={isMobile} />

                        {showAiEmptyWeekBanner && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="hero-card flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
                            >
                                <span className="ai-pulse relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow-primary">
                                    <Sparkles className="h-[18px] w-[18px] text-white" />
                                </span>
                                <div className="relative flex-1">
                                    <p className="text-[14.5px] font-semibold">
                                        Ten tydzień ({format(currentWeek.start, 'd MMM', { locale: pl })} – {format(currentWeek.end, 'd MMM', { locale: pl })}) jest pusty
                                    </p>
                                    <p className="mt-1 text-[13px] text-muted-foreground">
                                        Mam {draftCount} {draftCount === 1 ? 'szkic gotowy' : 'szkice gotowe'} do zaplanowania — mogę dobrać dla nich najlepsze godziny.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-gradient relative w-full px-5 py-2.5 text-[13.5px] sm:w-auto"
                                >
                                    <Sparkles className="h-[15px] w-[15px]" />
                                    Wypełnij tydzień z AI
                                </button>
                            </motion.div>
                        )}

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${view}-${isMobile}`}
                                initial={{ opacity: 0, x: view === 'month' ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {isMobile ? (
                                    <MobileAgendaView
                                        posts={posts}
                                        onPostMove={handlePostMove}
                                    />
                                ) : view === 'month' ? (
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
                        </AnimatePresence>
                    </div>
                </div>

                {!isMobile && (
                    <DraftsSidebar
                        drafts={drafts}
                        isLoading={isLoadingPosts}
                        isCollapsed={isSidebarCollapsed}
                        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    />
                )}
            </div>

            <ScheduleModal />

            <DragOverlay>
                {activeDraft && <DragOverlayContent draft={activeDraft} />}
            </DragOverlay>
        </DndContext>
    );
}