// src/store/settings-store.ts
/**
 * Settings Store - Zustand
 *
 * UWAGA: Connected Accounts są teraz zarządzane przez React Query (useSocial.ts)
 * Ten store obsługuje tylko lokalne preferencje użytkownika.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    UserProfile,
    AIPreferences,
    NotificationPreferences,
    AppearancePreferences,
    SettingsSection,
} from '@/types/settings';

// ==================== DEFAULT VALUES ====================

const defaultProfile: UserProfile = {
    id: '',
    email: '',
    name: '',
    avatar: undefined,
    company: '',
    website: '',
    bio: '',
    timezone: 'Europe/Warsaw',
    language: 'pl',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

const defaultAIPreferences: AIPreferences = {
    defaultTextProvider: 'gemini',
    defaultImageProvider: 'flux',  // ✅ POPRAWKA: było 'pollinations', teraz 'flux'
    defaultCreativityLevel: 60,
    defaultPostLength: 'medium',
    autoGenerateImages: true,
    autoHashtags: true,
    defaultHashtagCount: 5,
    autoEmoji: true,
    preferredImageStyle: 'modern, professional',
};

const defaultNotifications: NotificationPreferences = {
    emailEnabled: true,
    emailDigest: 'daily',
    emailOnPublish: true,
    emailOnError: true,
    emailOnApprovalNeeded: true,
    pushEnabled: true,
    pushOnPublish: false,
    pushOnError: true,
    pushOnApprovalNeeded: true,
    inAppEnabled: true,
    soundEnabled: false,
};

const defaultAppearance: AppearancePreferences = {
    theme: 'system',
    accentColor: 'blue',
    reducedMotion: false,
    compactMode: false,
    showAvatars: true,
};

// ==================== SETTINGS TYPE ====================

interface LocalSettings {
    profile: UserProfile;
    ai: AIPreferences;
    notifications: NotificationPreferences;
    appearance: AppearancePreferences;
}

// ==================== STORE INTERFACE ====================

interface SettingsStore {
    // State
    settings: LocalSettings;
    activeSection: SettingsSection;
    isSaving: boolean;
    hasUnsavedChanges: boolean;

    // Navigation
    setActiveSection: (section: SettingsSection) => void;

    // Profile
    updateProfile: (updates: Partial<UserProfile>) => void;
    updateAvatar: (avatarUrl: string) => void;
    setProfile: (profile: UserProfile) => void;

    // AI Preferences
    updateAIPreferences: (updates: Partial<AIPreferences>) => void;

    // Notifications
    updateNotifications: (updates: Partial<NotificationPreferences>) => void;

    // Appearance
    updateAppearance: (updates: Partial<AppearancePreferences>) => void;
    setTheme: (theme: AppearancePreferences['theme']) => void;

    // Danger Zone
    exportData: () => Promise<void>;
    deleteAccount: () => Promise<void>;

    // Save
    saveSettings: () => Promise<void>;
    resetToDefaults: () => void;

    // Helpers
    setSaving: (saving: boolean) => void;
}

// ==================== STORE ====================

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set, get) => ({
            // Initial State
            settings: {
                profile: defaultProfile,
                ai: defaultAIPreferences,
                notifications: defaultNotifications,
                appearance: defaultAppearance,
            },
            activeSection: 'profile',
            isSaving: false,
            hasUnsavedChanges: false,

            // Navigation
            setActiveSection: (section) => set({ activeSection: section }),

            // Profile
            updateProfile: (updates) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        profile: {
                            ...state.settings.profile,
                            ...updates,
                            updatedAt: new Date().toISOString(),
                        },
                    },
                    hasUnsavedChanges: true,
                }));
            },

            updateAvatar: (avatarUrl) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        profile: {
                            ...state.settings.profile,
                            avatar: avatarUrl,
                            updatedAt: new Date().toISOString(),
                        },
                    },
                    hasUnsavedChanges: true,
                }));
            },

            setProfile: (profile) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        profile,
                    },
                }));
            },

            // AI Preferences
            updateAIPreferences: (updates) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        ai: { ...state.settings.ai, ...updates },
                    },
                    hasUnsavedChanges: true,
                }));
            },

            // Notifications
            updateNotifications: (updates) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        notifications: { ...state.settings.notifications, ...updates },
                    },
                    hasUnsavedChanges: true,
                }));
            },

            // Appearance
            updateAppearance: (updates) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        appearance: { ...state.settings.appearance, ...updates },
                    },
                    hasUnsavedChanges: true,
                }));
            },

            setTheme: (theme) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        appearance: { ...state.settings.appearance, theme },
                    },
                    hasUnsavedChanges: true,
                }));

                // Apply theme to document
                if (typeof window !== 'undefined') {
                    const root = document.documentElement;
                    if (theme === 'dark') {
                        root.classList.add('dark');
                    } else if (theme === 'light') {
                        root.classList.remove('dark');
                    } else {
                        // System
                        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                        root.classList.toggle('dark', prefersDark);
                    }
                }
            },

            // Danger Zone
            exportData: async () => {
                set({ isSaving: true });

                try {
                    const data = get().settings;
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `postlio-export-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                } finally {
                    set({ isSaving: false });
                }
            },

            deleteAccount: async () => {
                set({ isSaving: true });
                // TODO: Implement actual account deletion via API
                await new Promise((resolve) => setTimeout(resolve, 2000));
                console.log('Account deletion requested');
                set({ isSaving: false });
            },

            // Save
            saveSettings: async () => {
                set({ isSaving: true });
                // TODO: Implement actual save via API
                await new Promise((resolve) => setTimeout(resolve, 500));
                set({ isSaving: false, hasUnsavedChanges: false });
            },

            resetToDefaults: () => {
                set({
                    settings: {
                        profile: defaultProfile,
                        ai: defaultAIPreferences,
                        notifications: defaultNotifications,
                        appearance: defaultAppearance,
                    },
                    hasUnsavedChanges: true,
                });
            },

            // Helpers
            setSaving: (saving) => set({ isSaving: saving }),
        }),
        {
            name: 'postlio-settings',
            partialize: (state) => ({
                settings: state.settings,
                activeSection: state.activeSection,
            }),
        }
    )
);