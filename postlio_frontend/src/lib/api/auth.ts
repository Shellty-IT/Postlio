// src/lib/api/auth.ts
/**
 * Auth API Layer
 */

import { apiClient, TokenManager } from './client';
import type { User } from '@/types';

// ============================================================
// TYPY
// ============================================================

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface AuthResponse extends AuthTokens {
    user: User;
}

export interface OnboardingCompleteRequest {
    skipped: boolean;
}

// ============================================================
// API FUNCTIONS
// ============================================================

/**
 * Logowanie użytkownika
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
    const tokens = await apiClient.post<AuthTokens>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
    }, {
        skipAuth: true,
    });

    TokenManager.setTokens(tokens.access_token, tokens.refresh_token);
    const user = await getMe();

    return {
        ...tokens,
        user,
    };
}

/**
 * Rejestracja nowego użytkownika
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
    await apiClient.post<User>('/auth/register', data, {
        skipAuth: true,
    });

    return login({
        email: data.email,
        password: data.password,
    });
}

/**
 * Wylogowanie użytkownika
 */
export function logout(): void {
    TokenManager.clearTokens();

    if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
}

/**
 * Pobieranie danych zalogowanego użytkownika
 */
export async function getMe(): Promise<User> {
    return apiClient.get<User>('/auth/me');
}

/**
 * Sprawdzenie czy użytkownik jest zalogowany
 */
export function isAuthenticated(): boolean {
    return TokenManager.hasTokens();
}

/**
 * Odświeżenie tokenu
 */
export async function refreshToken(): Promise<AuthTokens | null> {
    const refreshTokenValue = TokenManager.getRefreshToken();

    if (!refreshTokenValue) {
        return null;
    }

    try {
        const tokens = await apiClient.post<AuthTokens>(
            '/auth/refresh',
            { refresh_token: refreshTokenValue },
            { skipAuth: true }
        );

        TokenManager.setTokens(tokens.access_token, tokens.refresh_token);
        return tokens;
    } catch {
        TokenManager.clearTokens();
        return null;
    }
}

/**
 * Ukończenie lub pominięcie onboardingu
 */
export async function completeOnboarding(skipped: boolean): Promise<User> {
    return apiClient.post<User>('/auth/onboarding', { skipped });
}

// ============================================================
// EXPORT ZBIORCZY
// ============================================================

export const authApi = {
    login,
    register,
    logout,
    getMe,
    isAuthenticated,
    refreshToken,
    completeOnboarding,
};

export default authApi;