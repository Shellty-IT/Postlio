// src/store/auth-store.ts
/**
 * Auth Store - Zustand
 * Zarządzanie stanem autoryzacji użytkownika z obsługą onboardingu i capabilities
 *
 * ✅ ZAKTUALIZOWANE: checkAuth weryfikuje token z backendem
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TokenManager } from '@/lib/api/client';
import type { User, UserCapabilities, AccessLevel, ConnectedAccount, SocialPlatform } from '@/types';
import { DEFAULT_CAPABILITIES } from '@/types';

// ============================================================
// TYPY
// ============================================================

interface AuthState {
    // Stan użytkownika
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;

    // Capabilities (możliwości użytkownika)
    capabilities: UserCapabilities;
    connectedAccounts: ConnectedAccount[];

    // Onboarding
    showOnboarding: boolean;
    onboardingStep: 'welcome' | 'connect' | 'success' | 'completed';

    // Social Login / OAuth
    pendingSocialLogin: {
        platform: SocialPlatform;
        isLogin: boolean; // true = login, false = connect account
        context: 'onboarding' | 'settings' | 'login';
    } | null;

    // Ostatnio podłączone konto (do wyświetlenia w success)
    lastConnectedAccount: ConnectedAccount | null;

    // Akcje - User
    setUser: (user: User | null) => void;
    setIsAuthenticated: (value: boolean) => void;
    setIsLoading: (value: boolean) => void;
    setIsInitialized: (value: boolean) => void;
    login: (user: User, skipOnboarding?: boolean) => void;
    logout: () => void;
    reset: () => void;
    checkAuth: () => Promise<void>;

    // Akcje - Capabilities
    setCapabilities: (capabilities: UserCapabilities) => void;
    setConnectedAccounts: (accounts: ConnectedAccount[]) => void;
    addConnectedAccount: (account: ConnectedAccount) => void;
    updateAccessLevel: () => void;

    // Akcje - Onboarding
    setShowOnboarding: (show: boolean) => void;
    setOnboardingStep: (step: 'welcome' | 'connect' | 'success' | 'completed') => void;
    completeOnboarding: () => void;
    skipOnboarding: () => void;

    // Akcje - Social Login
    startSocialLogin: (platform: SocialPlatform, isLogin: boolean, context: 'onboarding' | 'settings' | 'login') => void;
    clearPendingSocialLogin: () => void;
    setLastConnectedAccount: (account: ConnectedAccount | null) => void;

    // Gettery pomocnicze
    hasBusinessAccount: () => boolean;
    canUseAutopilot: () => boolean;
    canAutoPublish: () => boolean;
    getAccessLevel: () => AccessLevel;
}

// ============================================================
// INITIAL STATE
// ============================================================

const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    capabilities: DEFAULT_CAPABILITIES,
    connectedAccounts: [],
    showOnboarding: false,
    onboardingStep: 'welcome' as const,
    pendingSocialLogin: null,
    lastConnectedAccount: null,
};

const FULL_ACCESS_EMAILS = new Set(['test@wp.pl']);

// ============================================================
// HELPER: Extract unique platforms from accounts
// ============================================================

function getUniquePlatforms(
    accounts: ConnectedAccount[],
    filter?: (acc: ConnectedAccount) => boolean
): SocialPlatform[] {
    const platformSet = new Set<SocialPlatform>();

    for (const acc of accounts) {
        if (!filter || filter(acc)) {
            platformSet.add(acc.platform);
        }
    }

    return Array.from(platformSet);
}

function hasFullAccessOverride(user: User | null): boolean {
    return FULL_ACCESS_EMAILS.has(user?.email?.trim().toLowerCase() ?? '');
}

function buildFullAccessCapabilities(accounts: ConnectedAccount[] = []): UserCapabilities {
    const activeAccounts = accounts.filter((acc) => acc.is_active);

    return {
        access_level: 'full',
        can_use_creator: true,
        can_use_materials: true,
        can_use_brands: true,
        can_use_calendar: true,
        can_use_autopilot: true,
        can_auto_publish: true,
        connected_platforms: getUniquePlatforms(activeAccounts),
        business_platforms: getUniquePlatforms(activeAccounts, (acc) => acc.is_business_account),
        personal_platforms: getUniquePlatforms(activeAccounts, (acc) => !acc.is_business_account),
        calendar_lock_message: undefined,
        autopilot_lock_message: undefined,
    };
}

// ============================================================
// STORE
// ============================================================

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Stan początkowy
            ...initialState,

            // === AKCJE USER ===

            setUser: (user) => {
                const { connectedAccounts } = get();
                set({
                    user,
                    capabilities: hasFullAccessOverride(user)
                        ? buildFullAccessCapabilities(connectedAccounts)
                        : get().capabilities,
                });
            },

            setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

            setIsLoading: (isLoading) => set({ isLoading }),

            setIsInitialized: (isInitialized) => set({ isInitialized }),

            login: (user, skipOnboarding = false) => {
                const needsOnboarding = user.needs_onboarding && !skipOnboarding;

                set({
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                    isInitialized: true,
                    capabilities: hasFullAccessOverride(user)
                        ? buildFullAccessCapabilities(get().connectedAccounts)
                        : get().capabilities,
                    showOnboarding: needsOnboarding,
                    onboardingStep: needsOnboarding ? 'welcome' : 'completed',
                });
            },

            logout: () => {
                TokenManager.clearAccessToken();
                set({
                    ...initialState,
                    isInitialized: true,
                });
            },

            reset: () => set(initialState),

            /**
             * Weryfikuje sesję z backendem. Access token żyje tylko w pamięci,
             * więc po każdym przeładowaniu strony ta funkcja próbuje cichego
             * odświeżenia przez httpOnly refresh cookie - nie ma jak sprawdzić
             * to synchronicznie z samego JS.
             */
            checkAuth: async () => {
                set({ isLoading: true });

                try {
                    const { authApi } = await import('@/lib/api/auth');
                    const user = await authApi.verifySession();

                    if (user) {
                        // Token valid - ustaw użytkownika
                        const needsOnboarding = user.needs_onboarding;
                        set({
                            user,
                            isAuthenticated: true,
                            isLoading: false,
                            isInitialized: true,
                            capabilities: hasFullAccessOverride(user)
                                ? buildFullAccessCapabilities(get().connectedAccounts)
                                : get().capabilities,
                            showOnboarding: needsOnboarding,
                            onboardingStep: needsOnboarding ? 'welcome' : 'completed',
                        });
                    } else {
                        // Token invalid - wyloguj
                        set({
                            user: null,
                            isAuthenticated: false,
                            isLoading: false,
                            isInitialized: true,
                            capabilities: DEFAULT_CAPABILITIES,
                            connectedAccounts: [],
                        });
                    }
                } catch (error) {
                    console.error('Auth check failed:', error);
                    // Błąd weryfikacji - wyloguj dla bezpieczeństwa
                    TokenManager.clearAccessToken();
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        isInitialized: true,
                        capabilities: DEFAULT_CAPABILITIES,
                        connectedAccounts: [],
                    });
                }
            },

            // === AKCJE CAPABILITIES ===

            setCapabilities: (capabilities) => {
                const { user, connectedAccounts } = get();
                set({
                    capabilities: hasFullAccessOverride(user)
                        ? buildFullAccessCapabilities(connectedAccounts)
                        : capabilities,
                });
            },

            setConnectedAccounts: (accounts) => {
                set({ connectedAccounts: accounts });
                get().updateAccessLevel();
            },

            addConnectedAccount: (account) => {
                const { connectedAccounts } = get();
                // Sprawdź czy konto już istnieje (update) lub dodaj nowe
                const existingIndex = connectedAccounts.findIndex(
                    (acc) => acc.id === account.id ||
                        (acc.platform === account.platform && acc.platform_user_id === account.platform_user_id)
                );

                let newAccounts: ConnectedAccount[];
                if (existingIndex >= 0) {
                    newAccounts = [...connectedAccounts];
                    newAccounts[existingIndex] = account;
                } else {
                    newAccounts = [...connectedAccounts, account];
                }

                set({
                    connectedAccounts: newAccounts,
                    lastConnectedAccount: account,
                });
                get().updateAccessLevel();
            },

            updateAccessLevel: () => {
                const { connectedAccounts, user } = get();

                if (hasFullAccessOverride(user)) {
                    set({ capabilities: buildFullAccessCapabilities(connectedAccounts) });
                    return;
                }

                if (!connectedAccounts || connectedAccounts.length === 0) {
                    set({
                        capabilities: {
                            ...DEFAULT_CAPABILITIES,
                            access_level: 'demo',
                        },
                    });
                    return;
                }

                const activeAccounts = connectedAccounts.filter((acc) => acc.is_active);

                const hasBusinessAccount = activeAccounts.some(
                    (acc) => acc.is_business_account
                );

                const hasPersonalAccount = activeAccounts.some(
                    (acc) => !acc.is_business_account
                );

                const accessLevel: AccessLevel = hasBusinessAccount
                    ? 'full'
                    : hasPersonalAccount
                        ? 'limited'
                        : 'demo';

                const connectedPlatforms = getUniquePlatforms(activeAccounts);
                const businessPlatforms = getUniquePlatforms(activeAccounts, (acc) => acc.is_business_account);
                const personalPlatforms = getUniquePlatforms(activeAccounts, (acc) => !acc.is_business_account);

                set({
                    capabilities: {
                        access_level: accessLevel,
                        can_use_creator: true,
                        can_use_materials: true,
                        can_use_brands: true,
                        can_use_calendar: accessLevel !== 'demo',
                        can_use_autopilot: accessLevel === 'full',
                        can_auto_publish: accessLevel === 'full',
                        connected_platforms: connectedPlatforms,
                        business_platforms: businessPlatforms,
                        personal_platforms: personalPlatforms,
                        calendar_lock_message: accessLevel === 'demo'
                            ? 'Podłącz konto social media aby korzystać z kalendarza'
                            : undefined,
                        autopilot_lock_message: accessLevel !== 'full'
                            ? 'Podłącz konto firmowe aby korzystać z Autopilota'
                            : undefined,
                    },
                });
            },

            // === AKCJE ONBOARDING ===

            setShowOnboarding: (show) => set({ showOnboarding: show }),

            setOnboardingStep: (step) => set({ onboardingStep: step }),

            completeOnboarding: async () => {
                const { user } = get();
                if (!user) return;

                try {
                    // Wywołaj API
                    const { authApi } = await import('@/lib/api/auth');
                    const updatedUser = await authApi.completeOnboarding(false);

                    set({
                        user: updatedUser,
                        showOnboarding: false,
                        onboardingStep: 'completed',
                    });
                } catch (error) {
                    console.error('Failed to complete onboarding:', error);
                    // Lokalny fallback
                    set({
                        user: {
                            ...user,
                            onboarding_completed_at: new Date().toISOString(),
                            onboarding_skipped: false,
                            needs_onboarding: false,
                        },
                        showOnboarding: false,
                        onboardingStep: 'completed',
                    });
                }
            },

            skipOnboarding: async () => {
                const { user } = get();
                if (!user) return;

                try {
                    // Wywołaj API
                    const { authApi } = await import('@/lib/api/auth');
                    const updatedUser = await authApi.completeOnboarding(true);

                    set({
                        user: updatedUser,
                        showOnboarding: false,
                        onboardingStep: 'completed',
                    });
                } catch (error) {
                    console.error('Failed to skip onboarding:', error);
                    // Lokalny fallback
                    set({
                        user: {
                            ...user,
                            onboarding_skipped: true,
                            needs_onboarding: false,
                        },
                        showOnboarding: false,
                        onboardingStep: 'completed',
                    });
                }
            },

            // === AKCJE SOCIAL LOGIN ===

            startSocialLogin: (platform, isLogin, context) => {
                set({
                    pendingSocialLogin: { platform, isLogin, context },
                });
                // Zapisz też w sessionStorage dla callback
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('oauth_context', context);
                    sessionStorage.setItem('oauth_is_login', String(isLogin));
                }
            },

            clearPendingSocialLogin: () => {
                set({ pendingSocialLogin: null });
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('oauth_context');
                    sessionStorage.removeItem('oauth_is_login');
                }
            },

            setLastConnectedAccount: (account) => {
                set({ lastConnectedAccount: account });
            },

            // === GETTERY ===

            hasBusinessAccount: () => {
                const { capabilities } = get();
                return capabilities.access_level === 'full';
            },

            canUseAutopilot: () => {
                const { capabilities } = get();
                return capabilities.can_use_autopilot;
            },

            canAutoPublish: () => {
                const { capabilities } = get();
                return capabilities.can_auto_publish;
            },

            getAccessLevel: () => {
                const { capabilities } = get();
                return capabilities.access_level;
            },
        }),
        {
            name: 'postlio-auth',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                capabilities: state.capabilities,
                connectedAccounts: state.connectedAccounts,
                onboardingStep: state.onboardingStep,
            }),
        }
    )
);

export default useAuthStore;
