// src/lib/reminders.ts
/**
 * System przypomnień o publikacji postów
 * Używa Web Notifications API + localStorage do przechowywania
 */

import type { Platform } from '@/types';

// ============================================================
// TYPY
// ============================================================

export interface ScheduledReminder {
    id: string;
    title: string;
    body: string;
    scheduledFor: Date;
    platform: Platform;
    postData?: {
        content: string;
        image_url?: string | null;
    };
    notified?: boolean;
}

// ============================================================
// STORAGE KEY
// ============================================================

const REMINDERS_STORAGE_KEY = 'postlio_reminders';

// ============================================================
// PERMISSION
// ============================================================

export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'denied') {
        return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

export function hasNotificationPermission(): boolean {
    if (!('Notification' in window)) {
        return false;
    }
    return Notification.permission === 'granted';
}

// ============================================================
// STORAGE FUNCTIONS
// ============================================================

export function getReminders(): ScheduledReminder[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(REMINDERS_STORAGE_KEY);
        if (!stored) return [];

        const reminders = JSON.parse(stored) as ScheduledReminder[];

        // Konwertuj stringi dat na obiekty Date
        return reminders.map(r => ({
            ...r,
            scheduledFor: new Date(r.scheduledFor),
        }));
    } catch {
        return [];
    }
}

export function saveReminders(reminders: ScheduledReminder[]): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
    } catch (e) {
        console.error('Failed to save reminders:', e);
    }
}

// ============================================================
// SCHEDULE REMINDER
// ============================================================

export function scheduleReminder(reminder: Omit<ScheduledReminder, 'notified'>): void {
    const reminders = getReminders();

    // Usuń stare przypomnienia (starsze niż 24h)
    const now = new Date();
    const cleanedReminders = reminders.filter(r => {
        const reminderDate = new Date(r.scheduledFor);
        const hoursDiff = (now.getTime() - reminderDate.getTime()) / (1000 * 60 * 60);
        return hoursDiff < 24;
    });

    // Dodaj nowe przypomnienie
    cleanedReminders.push({
        ...reminder,
        notified: false,
    });

    saveReminders(cleanedReminders);

    // Ustaw timer dla tego przypomnienia
    const timeUntilReminder = new Date(reminder.scheduledFor).getTime() - now.getTime();

    if (timeUntilReminder > 0) {
        setTimeout(() => {
            showNotification(reminder);
        }, timeUntilReminder);
    }
}

// ============================================================
// SHOW NOTIFICATION
// ============================================================

export function showNotification(reminder: Omit<ScheduledReminder, 'notified'>): void {
    if (!hasNotificationPermission()) {
        console.warn('No notification permission');
        return;
    }

    const notification = new Notification(reminder.title, {
        body: reminder.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: reminder.id,
        requireInteraction: true,
        data: {
            platform: reminder.platform,
            postData: reminder.postData,
        },
    });

    notification.onclick = () => {
        window.focus();
        notification.close();

        // Możesz tu dodać nawigację do odpowiedniej strony
        // lub otworzyć modal publikacji
    };

    // Oznacz jako powiadomione
    const reminders = getReminders();
    const updated = reminders.map(r =>
        r.id === reminder.id ? { ...r, notified: true } : r
    );
    saveReminders(updated);
}

// ============================================================
// CANCEL REMINDER
// ============================================================

export function cancelReminder(id: string): void {
    const reminders = getReminders();
    const filtered = reminders.filter(r => r.id !== id);
    saveReminders(filtered);
}

// ============================================================
// CHECK PENDING REMINDERS (call on app load)
// ============================================================

export function checkPendingReminders(): void {
    const reminders = getReminders();
    const now = new Date();

    reminders.forEach(reminder => {
        if (reminder.notified) return;

        const reminderDate = new Date(reminder.scheduledFor);
        const timeUntil = reminderDate.getTime() - now.getTime();

        if (timeUntil <= 0) {
            // Czas minął - pokaż natychmiast
            showNotification(reminder);
        } else {
            // Ustaw timer
            setTimeout(() => {
                showNotification(reminder);
            }, timeUntil);
        }
    });
}

// ============================================================
// INIT - call this on app startup
// ============================================================

export function initReminders(): void {
    if (typeof window === 'undefined') return;

    // Sprawdź oczekujące przypomnienia
    checkPendingReminders();

    // Opcjonalnie: poproś o uprawnienia przy pierwszym użyciu
    // requestNotificationPermission();
}