// src/store/auth-store.ts
/**
 * Auth Store - Zustand
 *
 * Zarządzanie stanem autoryzacji użytkownika
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TokenManager } from '@/lib/api/client';
import type { User } from '@/types';

// ============================================================
// TYPY
// ============================================================

interface AuthState {
    // Stan
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;

    // Akcje
    setUser: (user: User | null) => void;
    setIsAuthenticated: (value: boolean) => void;
    setIsLoading: (value: boolean) => void;
    login: (user: User) => void;
    logout: () => void;
    reset: () => void;
    checkAuth: () => void;
}

// ============================================================
// INITIAL STATE
// ============================================================

const initialState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
};

// ============================================================
// STORE
// ============================================================

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            // Stan początkowy
            ...initialState,

            // Akcje
            setUser: (user) => set({ user }),

            setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

            setIsLoading: (isLoading) => set({ isLoading }),

            login: (user) => set({
                user,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
            }),

            logout: () => {
                TokenManager.clearTokens();
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            },

            reset: () => set(initialState),

            checkAuth: () => {
                const hasTokens = TokenManager.hasTokens();

                if (hasTokens) {
                    // Mamy tokeny - użytkownik może być zalogowany
                    // User zostanie pobrany przez useUser hook
                    set({
                        isAuthenticated: true,
                        isInitialized: true,
                    });
                } else {
                    // Brak tokenów - na pewno niezalogowany
                    set({
                        user: null,
                        isAuthenticated: false,
                        isInitialized: true,
                    });
                }
            },
        }),
        {
            name: 'postlio-auth',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

export default useAuthStore;