// src/types/calendar.ts
import { Platform, PostStatus } from './index';

export type CalendarView = 'month' | 'week';

export interface ScheduledPost {
    id: string | number;
    title: string;
    content: string;
    platform: Platform;          // ← ZMIANA: singular - zgodne z backendem
    scheduledAt: Date | string;  // ← ZMIANA: może być string z API
    status: PostStatus;
    brandId?: string | number;   // ← ZMIANA: może być number z backendu
    brandName?: string;
    imageUrl?: string;
    aiGenerated: boolean;
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