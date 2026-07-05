/**
 * Tests for auth store (Zustand).
 *
 * Testuje store autoryzacji z persist middleware.
 */
import { act } from '@testing-library/react';
import { useAuthStore } from '@/store/auth-store';
import type { User } from '@/types';

// Mock TokenManager
jest.mock('@/lib/api/client', () => ({
    TokenManager: {
        clearTokens: jest.fn(),
        hasTokens: jest.fn(() => false),
        getAccessToken: jest.fn(() => null),
        setTokens: jest.fn(),
    },
}));

import { TokenManager } from '@/lib/api/client';

// Mock user data - must match User type exactly
const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    full_name: 'Test User',
    is_active: true,
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_trial_active: true,
    trial_days_remaining: 14,
    onboarding_skipped: false,
    needs_onboarding: false,
};

// Helper to reset store
const resetStore = () => {
    useAuthStore.getState().logout();
    useAuthStore.setState({ isInitialized: false });
};

describe('useAuthStore', () => {
    // Reset store before each test
    beforeEach(() => {
        act(() => {
            resetStore();
        });
        jest.clearAllMocks();
    });

    describe('initial state', () => {
        it('should have null user initially', () => {
            resetStore();
            const { user } = useAuthStore.getState();
            expect(user).toBeNull();
        });

        it('should not be authenticated initially', () => {
            resetStore();
            const { isAuthenticated } = useAuthStore.getState();
            expect(isAuthenticated).toBe(false);
        });

        it('should not be loading initially', () => {
            resetStore();
            const { isLoading } = useAuthStore.getState();
            expect(isLoading).toBe(false);
        });

        it('should not be initialized initially', () => {
            resetStore();
            const { isInitialized } = useAuthStore.getState();
            expect(isInitialized).toBe(false);
        });
    });

    describe('setUser', () => {
        it('should set user correctly', () => {
            act(() => {
                useAuthStore.getState().setUser(mockUser);
            });

            const { user } = useAuthStore.getState();
            expect(user).toEqual(mockUser);
        });

        it('should allow setting user to null', () => {
            act(() => {
                useAuthStore.getState().setUser(mockUser);
            });

            act(() => {
                useAuthStore.getState().setUser(null);
            });

            const { user } = useAuthStore.getState();
            expect(user).toBeNull();
        });
    });

    describe('setIsAuthenticated', () => {
        it('should set isAuthenticated to true', () => {
            act(() => {
                useAuthStore.getState().setIsAuthenticated(true);
            });

            expect(useAuthStore.getState().isAuthenticated).toBe(true);
        });

        it('should set isAuthenticated to false', () => {
            act(() => {
                useAuthStore.getState().setIsAuthenticated(true);
            });

            act(() => {
                useAuthStore.getState().setIsAuthenticated(false);
            });

            expect(useAuthStore.getState().isAuthenticated).toBe(false);
        });
    });

    describe('setIsLoading', () => {
        it('should set loading state', () => {
            act(() => {
                useAuthStore.getState().setIsLoading(true);
            });

            expect(useAuthStore.getState().isLoading).toBe(true);

            act(() => {
                useAuthStore.getState().setIsLoading(false);
            });

            expect(useAuthStore.getState().isLoading).toBe(false);
        });
    });

    describe('login', () => {
        it('should set user and authentication state', () => {
            act(() => {
                useAuthStore.getState().login(mockUser);
            });

            const state = useAuthStore.getState();
            expect(state.user).toEqual(mockUser);
            expect(state.isAuthenticated).toBe(true);
            expect(state.isLoading).toBe(false);
            expect(state.isInitialized).toBe(true);
        });

        it('should set isInitialized to true', () => {
            act(() => {
                useAuthStore.getState().login(mockUser);
            });

            expect(useAuthStore.getState().isInitialized).toBe(true);
        });
    });

    describe('logout', () => {
        it('should clear user and authentication state', () => {
            // First login
            act(() => {
                useAuthStore.getState().login(mockUser);
            });

            // Then logout
            act(() => {
                useAuthStore.getState().logout();
            });

            const state = useAuthStore.getState();
            expect(state.user).toBeNull();
            expect(state.isAuthenticated).toBe(false);
            expect(state.isLoading).toBe(false);
        });

        it('should call TokenManager.clearTokens', () => {
            act(() => {
                useAuthStore.getState().login(mockUser);
            });

            act(() => {
                useAuthStore.getState().logout();
            });

            expect(TokenManager.clearTokens).toHaveBeenCalled();
        });
    });

    describe('checkAuth', () => {
        it('should set isAuthenticated true when tokens exist', () => {
            (TokenManager.hasTokens as jest.Mock).mockReturnValue(true);

            act(() => {
                useAuthStore.getState().checkAuth();
            });

            const state = useAuthStore.getState();
            expect(state.isAuthenticated).toBe(true);
            expect(state.isInitialized).toBe(true);
        });

        it('should set isAuthenticated false when no tokens', () => {
            (TokenManager.hasTokens as jest.Mock).mockReturnValue(false);

            act(() => {
                useAuthStore.getState().checkAuth();
            });

            const state = useAuthStore.getState();
            expect(state.isAuthenticated).toBe(false);
            expect(state.isInitialized).toBe(true);
            expect(state.user).toBeNull();
        });

        it('should always set isInitialized to true', () => {
            (TokenManager.hasTokens as jest.Mock).mockReturnValue(false);

            act(() => {
                useAuthStore.getState().checkAuth();
            });

            expect(useAuthStore.getState().isInitialized).toBe(true);
        });
    });

    describe('state transitions', () => {
        it('should handle full login flow', () => {
            resetStore();

            // Start unauthenticated
            expect(useAuthStore.getState().isAuthenticated).toBe(false);

            // Set loading
            act(() => {
                useAuthStore.getState().setIsLoading(true);
            });
            expect(useAuthStore.getState().isLoading).toBe(true);

            // Login
            act(() => {
                useAuthStore.getState().login(mockUser);
            });

            const state = useAuthStore.getState();
            expect(state.user).toEqual(mockUser);
            expect(state.isAuthenticated).toBe(true);
            expect(state.isLoading).toBe(false);
        });

        it('should handle full logout flow', () => {
            // Login first
            act(() => {
                useAuthStore.getState().login(mockUser);
            });

            // Logout
            act(() => {
                useAuthStore.getState().logout();
            });

            const state = useAuthStore.getState();
            expect(state.user).toBeNull();
            expect(state.isAuthenticated).toBe(false);
        });
    });
});

describe('auth store selectors', () => {
    beforeEach(() => {
        act(() => {
            useAuthStore.getState().logout();
            useAuthStore.setState({ isInitialized: false });
        });
    });

    it('should provide access to user', () => {
        act(() => {
            useAuthStore.getState().setUser(mockUser);
        });

        const user = useAuthStore.getState().user;
        expect(user?.email).toBe('test@example.com');
    });

    it('should provide access to isAuthenticated', () => {
        act(() => {
            useAuthStore.getState().setIsAuthenticated(true);
        });

        expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
});