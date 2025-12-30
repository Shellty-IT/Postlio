// src/store/settings-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    UserSettings,
    UserProfile,
    AIPreferences,
    NotificationPreferences,
    AppearancePreferences,
    ConnectedAccount,
    SettingsSection,
} from '@/types/settings';

// ==================== DEFAULT VALUES ====================

const defaultProfile: UserProfile = {
    id: 'user-1',
    email: 'jan.kowalski@example.com',
    name: 'Jan Kowalski',
    avatar: undefined,
    company: 'Moja Firma Sp. z o.o.',
    website: 'https://mojafirma.pl',
    bio: 'Social media manager z pasją do automatyzacji.',
    timezone: 'Europe/Warsaw',
    language: 'pl',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: new Date().toISOString(),
};

const defaultAIPreferences: AIPreferences = {
    defaultTextProvider: 'gemini',
    defaultImageProvider: 'pollinations',
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

const defaultConnectedAccounts: ConnectedAccount[] = [
    {
        id: 'acc-1',
        platform: 'instagram',
        accountName: '@mojafirma',
        accountId: '123456789',
        isConnected: true,
        connectedAt: '2024-02-01T12:00:00Z',
        expiresAt: '2024-05-01T12:00:00Z',
        permissions: ['publish', 'read_insights'],
    },
    {
        id: 'acc-2',
        platform: 'facebook',
        accountName: 'Moja Firma',
        accountId: '987654321',
        isConnected: true,
        connectedAt: '2024-02-01T12:00:00Z',
        permissions: ['publish', 'read_insights', 'manage_pages'],
    },
    {
        id: 'acc-3',
        platform: 'linkedin',
        accountName: 'Jan Kowalski',
        accountId: 'jan-kowalski-123',
        isConnected: false,
        permissions: [],
    },
];

// ==================== STORE INTERFACE ====================

interface SettingsStore {
    // State
    settings: UserSettings;
    activeSection: SettingsSection;
    isSaving: boolean;
    hasUnsavedChanges: boolean;

    // Navigation
    setActiveSection: (section: SettingsSection) => void;

    // Profile
    updateProfile: (updates: Partial<UserProfile>) => void;
    updateAvatar: (avatarUrl: string) => void;

    // AI Preferences
    updateAIPreferences: (updates: Partial<AIPreferences>) => void;

    // Notifications
    updateNotifications: (updates: Partial<NotificationPreferences>) => void;

    // Appearance
    updateAppearance: (updates: Partial<AppearancePreferences>) => void;
    setTheme: (theme: AppearancePreferences['theme']) => void;

    // Connected Accounts
    connectAccount: (platform: ConnectedAccount['platform']) => Promise<void>;
    disconnectAccount: (accountId: string) => void;
    refreshAccount: (accountId: string) => Promise<void>;

    // Danger Zone
    exportData: () => Promise<void>;
    deleteAccount: () => Promise<void>;

    // Save
    saveSettings: () => Promise<void>;
    resetToDefaults: () => void;
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
                connectedAccounts: defaultConnectedAccounts,
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
            },

            // Connected Accounts
            connectAccount: async (platform) => {
                // Simulate OAuth flow
                set({ isSaving: true });
                await new Promise((resolve) => setTimeout(resolve, 1500));

                set((state) => {
                    const existingAccount = state.settings.connectedAccounts.find(
                        (a) => a.platform === platform
                    );

                    if (existingAccount) {
                        return {
                            settings: {
                                ...state.settings,
                                connectedAccounts: state.settings.connectedAccounts.map((a) =>
                                    a.platform === platform
                                        ? {
                                            ...a,
                                            isConnected: true,
                                            connectedAt: new Date().toISOString(),
                                            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                                        }
                                        : a
                                ),
                            },
                            isSaving: false,
                        };
                    }

                    const newAccount: ConnectedAccount = {
                        id: `acc-${Date.now()}`,
                        platform,
                        accountName: `Nowe konto ${platform}`,
                        accountId: `${Date.now()}`,
                        isConnected: true,
                        connectedAt: new Date().toISOString(),
                        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                        permissions: ['publish', 'read_insights'],
                    };

                    return {
                        settings: {
                            ...state.settings,
                            connectedAccounts: [...state.settings.connectedAccounts, newAccount],
                        },
                        isSaving: false,
                    };
                });
            },

            disconnectAccount: (accountId) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        connectedAccounts: state.settings.connectedAccounts.map((a) =>
                            a.id === accountId
                                ? { ...a, isConnected: false, connectedAt: undefined, expiresAt: undefined }
                                : a
                        ),
                    },
                }));
            },

            refreshAccount: async (accountId) => {
                set({ isSaving: true });
                await new Promise((resolve) => setTimeout(resolve, 1000));

                set((state) => ({
                    settings: {
                        ...state.settings,
                        connectedAccounts: state.settings.connectedAccounts.map((a) =>
                            a.id === accountId
                                ? {
                                    ...a,
                                    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                                }
                                : a
                        ),
                    },
                    isSaving: false,
                }));
            },

            // Danger Zone
            exportData: async () => {
                set({ isSaving: true });
                await new Promise((resolve) => setTimeout(resolve, 2000));

                const data = get().settings;
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `postlio-export-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);

                set({ isSaving: false });
            },

            deleteAccount: async () => {
                set({ isSaving: true });
                await new Promise((resolve) => setTimeout(resolve, 2000));
                // In real app, this would call API to delete account
                console.log('Account deletion requested');
                set({ isSaving: false });
            },

            // Save
            saveSettings: async () => {
                set({ isSaving: true });
                await new Promise((resolve) => setTimeout(resolve, 1000));
                set({ isSaving: false, hasUnsavedChanges: false });
            },

            resetToDefaults: () => {
                set({
                    settings: {
                        profile: defaultProfile,
                        ai: defaultAIPreferences,
                        notifications: defaultNotifications,
                        appearance: defaultAppearance,
                        connectedAccounts: defaultConnectedAccounts,
                    },
                    hasUnsavedChanges: true,
                });
            },
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