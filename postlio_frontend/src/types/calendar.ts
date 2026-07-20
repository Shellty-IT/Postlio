// src/types/calendar.ts
/**
 * Typy dla kalendarza
 *
 * ✅ ZAKTUALIZOWANE: Obsługa platforms[] + legacy platform
 */

import type { Platform } from './index';
import type { PostStatus, PlatformStatuses } from './post';

export type CalendarView = 'month' | 'week';

export interface ScheduledPost {
    id: string | number;
    title: string;
    content: string;

    // ✅ NOWE: Wiele platform
    platforms: Platform[];
    platform_statuses?: Partial<PlatformStatuses>;

    // Legacy - dla kompatybilności wstecznej
    platform?: Platform;

    scheduledAt: Date | string;
    status: PostStatus;
    brandId?: string | number;
    brandName?: string;
    imageUrl?: string;
    aiGenerated: boolean;

    // "manual" = utworzony w Kreatorze, "autopilot" = z kolejki Autopilota -
    // Kalendarz laczy oba zrodla (Etap 4)
    origin: 'manual' | 'autopilot';
    requiresManualPublish: boolean;
}

export interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    posts: ScheduledPost[];
}

export interface CalendarState {
    currentDate: Date;
    view: CalendarView;
    selectedDate: Date | null;
    selectedPost: ScheduledPost | null;
}

export interface TimeSlot {
    hour: number;
    label: string;
    posts: ScheduledPost[];
}

export interface DragItem {
    type: 'post';
    post: ScheduledPost;
    sourceDate: Date;
}

// ============================================================
// HELPER
// ============================================================

/**
 * Pobierz pierwszą platformę z ScheduledPost
 */
export function getPrimaryPlatformFromScheduledPost(post: ScheduledPost): Platform {
    if (post.platforms && post.platforms.length > 0) {
        return post.platforms[0];
    }
    return post.platform || 'facebook';
}