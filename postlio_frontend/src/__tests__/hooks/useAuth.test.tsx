/**
 * Tests for useAuth hook.
 *
 * Testuje hooki autoryzacji z React Query.
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// ============================================================
// MOCKS - MUST BE BEFORE IMPORTS OF TESTED MODULES
// ============================================================

// Mock sonner
jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock authApi - ApiException MUSI być zdefiniowane wewnątrz factory
jest.mock('@/lib/api', () => {
    // Define ApiException INSIDE the mock factory to avoid hoisting issues
    class MockApiException extends Error {
        status: number;
        code?: string;
        details?: Record<string, unknown>;

        constructor(error: { message: string; status: number; code?: string; details?: Record<string, unknown> }) {
            super(error.message);
            this.name = 'ApiException';
            this.status = error.status;
            this.code = error.code;
            this.details = error.details;
        }
    }

    return {
        authApi: {
            login: jest.fn(),
            register: jest.fn(),
            logout: jest.fn(),
            getMe: jest.fn(),
            isAuthenticated: jest.fn(() => true),
        },
        ApiException: MockApiException,
    };
});

// Mock TokenManager
jest.mock('@/lib/api/client', () => ({
    TokenManager: {
        clearAccessToken: jest.fn(),
        hasAccessToken: jest.fn(() => false),
        getAccessToken: jest.fn(() => null),
        setAccessToken: jest.fn(),
    },
}));

// ============================================================
// IMPORTS AFTER MOCKS
// ============================================================

import { toast } from 'sonner';
import { useAuth, useUser, useLogin, useRegister, useLogout } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth-store';
import { authApi, ApiException } from '@/lib/api';
import type { User } from '@/types';

// ============================================================
// TEST DATA
// ============================================================

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

const mockLoginResponse = {
    access_token: 'mock-token',
    token_type: 'bearer',
    user: mockUser,
};

// Helper to reset store
const resetAuthStore = () => {
    useAuthStore.getState().logout();
    useAuthStore.setState({ isInitialized: false });
};

// Wrapper with providers
function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });

    return function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    };
}

// Helper to create ApiException (get it from the mock)
const createApiException = (message: string, status: number) => {
    return new (ApiException as any)({ message, status });
};

// ============================================================
// TESTS
// ============================================================

describe('useUser', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        act(() => {
            resetAuthStore();
        });
    });

    it('should fetch user when authenticated', async () => {
        (authApi.isAuthenticated as jest.Mock).mockReturnValue(true);
        (authApi.getMe as jest.Mock).mockResolvedValue(mockUser);

        const { result } = renderHook(() => useUser(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(mockUser);
        expect(authApi.getMe).toHaveBeenCalled();
    });

    it('should not fetch when not authenticated', async () => {
        (authApi.isAuthenticated as jest.Mock).mockReturnValue(false);

        const { result } = renderHook(() => useUser(), {
            wrapper: createWrapper(),
        });

        // Wait a bit to ensure query doesn't run
        await new Promise((r) => setTimeout(r, 100));

        expect(authApi.getMe).not.toHaveBeenCalled();
        expect(result.current.data).toBeUndefined();
    });

    it('should update store on success', async () => {
        (authApi.isAuthenticated as jest.Mock).mockReturnValue(true);
        (authApi.getMe as jest.Mock).mockResolvedValue(mockUser);

        renderHook(() => useUser(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(useAuthStore.getState().user).toEqual(mockUser);
        });

        expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
});

describe('useLogin', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        act(() => {
            resetAuthStore();
        });
    });

    it('should login successfully', async () => {
        (authApi.login as jest.Mock).mockResolvedValue(mockLoginResponse);

        const { result } = renderHook(() => useLogin(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            result.current.mutate({
                email: 'test@example.com',
                password: 'password123',
            });
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(authApi.login).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password123',
        });
        expect(toast.success).toHaveBeenCalled();
    });

    it('should update store on successful login', async () => {
        (authApi.login as jest.Mock).mockResolvedValue(mockLoginResponse);

        const { result } = renderHook(() => useLogin(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            result.current.mutate({
                email: 'test@example.com',
                password: 'password123',
            });
        });

        await waitFor(() => {
            expect(useAuthStore.getState().user).toEqual(mockUser);
        });

        expect(useAuthStore.getState().isAuthenticated).toBe(true);
        expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should handle 401 error', async () => {
        const error = createApiException('Unauthorized', 401);
        (authApi.login as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useLogin(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            result.current.mutate({
                email: 'test@example.com',
                password: 'wrongpassword',
            });
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(toast.error).toHaveBeenCalled();
    });

    it('should handle 429 rate limit error', async () => {
        const error = createApiException('Too many requests', 429);
        (authApi.login as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useLogin(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            result.current.mutate({
                email: 'test@example.com',
                password: 'password',
            });
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(toast.error).toHaveBeenCalled();
    });
});

describe('useRegister', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        act(() => {
            resetAuthStore();
        });
    });

    it('should register successfully', async () => {
        (authApi.register as jest.Mock).mockResolvedValue(mockLoginResponse);

        const { result } = renderHook(() => useRegister(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            result.current.mutate({
                email: 'new@example.com',
                password: 'password123',
                full_name: 'New User',
            });
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(toast.success).toHaveBeenCalled();
    });

    it('should handle duplicate email error', async () => {
        const error = createApiException('Email exists', 400);
        (authApi.register as jest.Mock).mockRejectedValue(error);

        const { result } = renderHook(() => useRegister(), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            result.current.mutate({
                email: 'existing@example.com',
                password: 'password123',
                full_name: 'New User',
            });
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(toast.error).toHaveBeenCalled();
    });
});

describe('useLogout', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        act(() => {
            useAuthStore.getState().login(mockUser);
        });
    });

    it('should logout successfully', () => {
        const { result } = renderHook(() => useLogout(), {
            wrapper: createWrapper(),
        });

        act(() => {
            result.current();
        });

        expect(useAuthStore.getState().user).toBeNull();
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
        expect(authApi.logout).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalled();
    });
});

describe('useAuth (combined hook)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        act(() => {
            resetAuthStore();
        });
    });

    it('should provide all auth functionality', async () => {
        (authApi.isAuthenticated as jest.Mock).mockReturnValue(true);
        (authApi.getMe as jest.Mock).mockResolvedValue(mockUser);

        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(),
        });

        // Check that all properties are available
        expect(result.current).toHaveProperty('user');
        expect(result.current).toHaveProperty('isAuthenticated');
        expect(result.current).toHaveProperty('isLoading');
        expect(result.current).toHaveProperty('isInitialized');
        expect(result.current).toHaveProperty('login');
        expect(result.current).toHaveProperty('loginAsync');
        expect(result.current).toHaveProperty('register');
        expect(result.current).toHaveProperty('registerAsync');
        expect(result.current).toHaveProperty('logout');
        expect(result.current).toHaveProperty('refetchUser');
    });

    it('should return user after fetch', async () => {
        (authApi.isAuthenticated as jest.Mock).mockReturnValue(true);
        (authApi.getMe as jest.Mock).mockResolvedValue(mockUser);

        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.user).toEqual(mockUser);
        });
    });

    it('should expose isPending states', () => {
        (authApi.login as jest.Mock).mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve(mockLoginResponse), 100))
        );

        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(),
        });

        expect(result.current.isLoginPending).toBe(false);
        expect(result.current.isRegisterPending).toBe(false);
    });
});