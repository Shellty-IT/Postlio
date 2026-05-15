// src/store/calendar-store.ts
import { create } from 'zustand';
import {
    addMonths,
    subMonths,
    addWeeks,
    subWeeks
} from 'date-fns';
import { CalendarView, ScheduledPost } from '@/types/calendar';

interface CalendarStore {
    // State
    currentDate: Date;
    view: CalendarView;
    selectedDate: Date | null;
    selectedPost: ScheduledPost | null;
    isScheduleModalOpen: boolean;
    isDragging: boolean;

    // Actions
    setView: (view: CalendarView) => void;
    goToNext: () => void;
    goToPrevious: () => void;
    goToToday: () => void;
    selectDate: (date: Date | null) => void;
    selectPost: (post: ScheduledPost | null) => void;
    openScheduleModal: (date?: Date) => void;
    closeScheduleModal: () => void;
    setDragging: (isDragging: boolean) => void;
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
    // Initial state
    currentDate: new Date(),
    view: 'month',
    selectedDate: null,
    selectedPost: null,
    isScheduleModalOpen: false,
    isDragging: false,

    // Actions
    setView: (view) => set({ view }),

    goToNext: () => {
        const { view, currentDate } = get();
        set({
            currentDate: view === 'month'
                ? addMonths(currentDate, 1)
                : addWeeks(currentDate, 1)
        });
    },

    goToPrevious: () => {
        const { view, currentDate } = get();
        set({
            currentDate: view === 'month'
                ? subMonths(currentDate, 1)
                : subWeeks(currentDate, 1)
        });
    },

    goToToday: () => set({ currentDate: new Date() }),

    selectDate: (date) => set({ selectedDate: date }),

    selectPost: (post) => set({ selectedPost: post }),

    openScheduleModal: (date) => set({
        isScheduleModalOpen: true,
        selectedDate: date || get().selectedDate || new Date()
    }),

    closeScheduleModal: () => set({
        isScheduleModalOpen: false,
        selectedPost: null
    }),

    setDragging: (isDragging) => set({ isDragging }),
}));