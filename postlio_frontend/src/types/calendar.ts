// src/types/calendar.ts
import { Platform, PostStatus } from './index';

export type CalendarView = 'month' | 'week';

export interface ScheduledPost {
    id: string;
    title: string;
    content: string;
    platforms: Platform[];
    scheduledAt: Date;
    status: PostStatus;
    brandId?: string;
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