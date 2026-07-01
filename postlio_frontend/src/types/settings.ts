// src/types/settings.ts
/**
 * Types for Settings module.
 *
 * UWAGA: Typy dla Connected Accounts są w @/lib/api/social.ts
 * Ten plik zawiera tylko typy dla lokalnych preferencji.
 */

import type { AIProvider, ImageProvider } from './autopilot';

// ==================== USER PROFILE ====================

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    company?: string;
    website?: string;
    bio?: string;
    timezone: string;
    language: 'pl' | 'en';
    createdAt: string;
    updatedAt: string;
}

// ==================== AI PREFERENCES ====================

export interface AIPreferences {
    defaultTextProvider: AIProvider;
    defaultImageProvider: ImageProvider;
    defaultCreativityLevel: number; // 0-100
    defaultPostLength: 'short' | 'medium' | 'long';
    autoGenerateImages: boolean;
    autoHashtags: boolean;
    defaultHashtagCount: number;
    autoEmoji: boolean;
    preferredImageStyle?: string;
}

// ==================== NOTIFICATIONS ====================

export interface NotificationPreferences {
    // Email
    emailEnabled: boolean;
    emailDigest: 'daily' | 'weekly' | 'never';
    emailOnPublish: boolean;
    emailOnError: boolean;
    emailOnApprovalNeeded: boolean;

    // Push
    pushEnabled: boolean;
    pushOnPublish: boolean;
    pushOnError: boolean;
    pushOnApprovalNeeded: boolean;

    // In-App
    inAppEnabled: boolean;
    soundEnabled: boolean;
}

// ==================== APPEARANCE ====================

export type AccentColor = 'blue' | 'violet' | 'green' | 'orange' | 'rose';

export interface AppearancePreferences {
    accentColor: AccentColor;
    reducedMotion: boolean;
    compactMode: boolean;
    showAvatars: boolean;
}

// ==================== SETTINGS SECTION ====================

export type SettingsSection =
    | 'profile'
    | 'ai'
    | 'notifications'
    | 'appearance'
    | 'accounts'
    | 'danger';

export interface SettingsSectionInfo {
    id: SettingsSection;
    label: string;
    description: string;
    icon: string;
}

export const SETTINGS_SECTIONS: SettingsSectionInfo[] = [
    {
        id: 'profile',
        label: 'Profil',
        description: 'Twoje dane i informacje o koncie',
        icon: 'User',
    },
    {
        id: 'ai',
        label: 'Preferencje AI',
        description: 'Domyślne ustawienia generowania',
        icon: 'Sparkles',
    },
    {
        id: 'notifications',
        label: 'Powiadomienia',
        description: 'Zarządzaj alertami i powiadomieniami',
        icon: 'Bell',
    },
    {
        id: 'appearance',
        label: 'Wygląd',
        description: 'Motyw, kolory i personalizacja',
        icon: 'Palette',
    },
    {
        id: 'accounts',
        label: 'Połączone konta',
        description: 'Zarządzaj kontami social media',
        icon: 'Link',
    },
    {
        id: 'danger',
        label: 'Strefa niebezpieczna',
        description: 'Eksport danych i usunięcie konta',
        icon: 'AlertTriangle',
    },
];

// ==================== CONSTANTS ====================

export const ACCENT_COLORS: { value: AccentColor; label: string; color: string }[] = [
    { value: 'blue', label: 'Niebieski', color: '#3B82F6' },
    { value: 'violet', label: 'Fioletowy', color: '#8B5CF6' },
    { value: 'green', label: 'Zielony', color: '#10B981' },
    { value: 'orange', label: 'Pomarańczowy', color: '#F97316' },
    { value: 'rose', label: 'Różowy', color: '#F43F5E' },
];

export const LANGUAGE_OPTIONS = [
    { value: 'pl', label: 'Polski', flag: '🇵🇱' },
    { value: 'en', label: 'English', flag: '🇬🇧' },
];

export const TIMEZONE_OPTIONS = [
    { value: 'Europe/Warsaw', label: 'Warszawa (CET)' },
    { value: 'Europe/London', label: 'Londyn (GMT)' },
    { value: 'Europe/Paris', label: 'Paryż (CET)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET)' },
    { value: 'America/New_York', label: 'Nowy Jork (EST)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
];

// Platform info przeniesione do @/lib/api/social.ts
// Używaj getPlatformColor(), getPlatformName() z tego modułu