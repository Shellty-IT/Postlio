// src/lib/api/auth.ts
/**
 * Auth API Layer
 *
 * Funkcje do komunikacji z endpointami autoryzacji.
 * Obsługuje logowanie, rejestrację, odświeżanie tokenów.
 */

import { apiClient, TokenManager } from './client';
import type { User } from '@/types';

// ============================================================
// TYPY REQUESTÓW I RESPONSE
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

// ============================================================
// API FUNCTIONS
// ============================================================

/**
 * Logowanie użytkownika
 * Backend oczekuje JSON z email i password
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
    // Wysyłamy JSON z email i password
    const tokens = await apiClient.post<AuthTokens>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
    }, {
        skipAuth: true,
    });

    // Zapisz tokeny
    TokenManager.setTokens(tokens.access_token, tokens.refresh_token);

    // Pobierz dane użytkownika
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
    // Rejestracja
    await apiClient.post<User>('/auth/register', data, {
        skipAuth: true,
    });

    // Automatyczne logowanie po rejestracji
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

    // Przekierowanie do strony logowania
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
 * Odświeżenie tokenu (używane wewnętrznie przez client.ts)
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
};

export default authApi;