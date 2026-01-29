// src/hooks/useAuth.ts
/**
 * Hook do zarządzania autoryzacją
 *
 * Obsługuje: login, register, logout, dane użytkownika
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authApi, ApiException } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import type { LoginRequest, RegisterRequest } from '@/lib/api';

// ============================================================
// QUERY KEYS
// ============================================================

export const authKeys = {
    all: ['auth'] as const,
    user: () => [...authKeys.all, 'user'] as const,
};

// ============================================================
// HOOK: useUser
// ============================================================

/**
 * Pobiera dane aktualnie zalogowanego użytkownika
 */
export function useUser() {
    const { setUser, setIsAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: authKeys.user(),
        queryFn: async () => {
            const user = await authApi.getMe();
            setUser(user);
            setIsAuthenticated(true);
            return user;
        },
        enabled: authApi.isAuthenticated(),
        staleTime: 5 * 60 * 1000, // 5 minut
        retry: (failureCount, error) => {
            // Nie ponawiaj przy 401
            if (error instanceof ApiException && error.status === 401) {
                return false;
            }
            return failureCount < 2;
        },
    });
}

// ============================================================
// HOOK: useLogin
// ============================================================

/**
 * Mutacja do logowania
 */
export function useLogin() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { login: authLogin, setIsLoading } = useAuthStore();

    return useMutation({
        mutationFn: async (credentials: LoginRequest) => {
            setIsLoading(true);
            return authApi.login(credentials);
        },
        onSuccess: (data) => {
            // Użyj login z auth store
            authLogin(data.user);
            setIsLoading(false);

            // Invalidate queries żeby pobrać świeże dane
            queryClient.invalidateQueries({ queryKey: authKeys.user() });

            toast.success('Zalogowano pomyślnie!', {
                description: `Witaj, ${data.user.full_name || data.user.email}!`,
            });

            // Przekieruj na podstawie onboarding
            if (data.user.needs_onboarding) {
                router.push('/onboarding');
            } else {
                router.push('/dashboard');
            }
        },
        onError: (error: Error) => {
            setIsLoading(false);

            let message = 'Wystąpił błąd podczas logowania';

            if (error instanceof ApiException) {
                switch (error.status) {
                    case 401:
                        message = 'Nieprawidłowy email lub hasło';
                        break;
                    case 422:
                        message = 'Sprawdź poprawność danych';
                        break;
                    case 429:
                        message = 'Zbyt wiele prób. Spróbuj za chwilę.';
                        break;
                    default:
                        message = error.message;
                }
            }

            toast.error('Błąd logowania', { description: message });
        },
    });
}

// ============================================================
// HOOK: useRegister
// ============================================================

/**
 * Mutacja do rejestracji
 */
export function useRegister() {
    const queryClient = useQueryClient();
    const router = useRouter();
    const { login: authLogin, setIsLoading } = useAuthStore();

    return useMutation({
        mutationFn: async (data: RegisterRequest) => {
            setIsLoading(true);
            return authApi.register(data);
        },
        onSuccess: (data) => {
            // Użyj login z auth store - obsługuje onboarding
            authLogin(data.user);
            setIsLoading(false);

            queryClient.invalidateQueries({ queryKey: authKeys.user() });

            toast.success('Konto utworzone!', {
                description: 'Witaj w Postlio!',
            });

            // Przekieruj na podstawie onboarding
            if (data.user.needs_onboarding) {
                router.push('/onboarding');
            } else {
                router.push('/dashboard');
            }
        },
        onError: (error: Error) => {
            setIsLoading(false);

            let message = 'Wystąpił błąd podczas rejestracji';

            if (error instanceof ApiException) {
                switch (error.status) {
                    case 400:
                        message = 'Konto z tym adresem email już istnieje';
                        break;
                    case 409:
                        message = 'Konto z tym adresem email już istnieje';
                        break;
                    case 422:
                        message = 'Sprawdź poprawność danych';
                        break;
                    default:
                        message = error.message;
                }
            }

            toast.error('Błąd rejestracji', { description: message });
        },
    });
}

// ============================================================
// HOOK: useLogout
// ============================================================

/**
 * Funkcja wylogowania
 */
export function useLogout() {
    const queryClient = useQueryClient();
    const { reset } = useAuthStore();

    return () => {
        // Wyczyść store
        reset();

        // Wyczyść cache React Query
        queryClient.clear();

        // Wyloguj przez API (czyści tokeny i przekierowuje)
        authApi.logout();

        toast.success('Wylogowano', {
            description: 'Do zobaczenia!',
        });
    };
}

// ============================================================
// HOOK: useAuth (kombinowany)
// ============================================================

/**
 * Główny hook auth - łączy wszystkie funkcjonalności
 */
export function useAuth() {
    const user = useUser();
    const login = useLogin();
    const register = useRegister();
    const logout = useLogout();
    const { isAuthenticated, isLoading, isInitialized } = useAuthStore();

    return {
        // Stan
        user: user.data,
        isAuthenticated,
        isLoading: isLoading || user.isLoading,
        isInitialized,
        isError: user.isError,
        error: user.error,

        // Akcje
        login: login.mutate,
        loginAsync: login.mutateAsync,
        isLoginPending: login.isPending,

        register: register.mutate,
        registerAsync: register.mutateAsync,
        isRegisterPending: register.isPending,

        logout,

        // Refetch user
        refetchUser: user.refetch,
    };
}

export default useAuth;