// src/lib/api/auth.ts

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

// OAuth Login types
export interface OAuthLoginInitResponse {
    authorization_url: string;
    state: string;
}

export interface OAuthLoginCallbackRequest {
    platform: string;
    code: string;
    state: string;
}

export interface OAuthLoginResponse {
    success: boolean;
    access_token?: string;
    refresh_token?: string;
    user?: User;
    is_new_user?: boolean;
    error?: string;
    error_description?: string;
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
 * Weryfikacja sesji z backendem
 */
export async function verifySession(): Promise<User | null> {
    if (!TokenManager.hasTokens()) {
        return null;
    }

    try {
        const user = await getMe();
        return user;
    } catch {
        TokenManager.clearTokens();
        return null;
    }
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
// OAUTH LOGIN FUNCTIONS
// ============================================================

/**
 * Inicjalizacja OAuth login (Facebook/Google)
 * NIE wymaga autoryzacji
 */
export async function initOAuthLogin(platform: 'facebook' | 'google'): Promise<OAuthLoginInitResponse> {
    return apiClient.post<OAuthLoginInitResponse>(
        `/auth/oauth/${platform}/init`,
        {},
        { skipAuth: true }
    );
}

/**
 * Callback OAuth login
 * NIE wymaga autoryzacji
 */
export async function handleOAuthLoginCallback(
    platform: string,
    code: string,
    state: string
): Promise<OAuthLoginResponse> {
    return apiClient.post<OAuthLoginResponse>(
        `/auth/oauth/${platform}/callback`,
        { platform, code, state },
        { skipAuth: true }
    );
}

/**
 * Pełny flow OAuth login - inicjalizacja + redirect
 */
export async function startOAuthLogin(platform: 'facebook' | 'google'): Promise<void> {
    const response = await initOAuthLogin(platform);

    // Zapisz state w sessionStorage
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('oauth_login_state', response.state);
        sessionStorage.setItem('oauth_login_platform', platform);
    }

    // Redirect do providera
    window.location.href = response.authorization_url;
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
    verifySession,
    refreshToken,
    completeOnboarding,
    // OAuth Login
    initOAuthLogin,
    handleOAuthLoginCallback,
    startOAuthLogin,
};

export default authApi;