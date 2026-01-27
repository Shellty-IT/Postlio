/**
 * API client dla użytkownika i onboardingu.
 */

import { apiClient } from './client';
import type {
    User,
    UserCapabilities,
    OnboardingCompleteRequest,
    SocialLoginRequest,
    AuthResponse,
    AuthTokens,
} from '@/types';

// ==================== Auth API ====================

export async function login(email: string, password: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', { email, password });
}

export async function register(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/register', {
        email,
        password,
        full_name: fullName,
    });
}

export async function socialLogin(request: SocialLoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/social-login', request);
}

export async function refreshToken(refreshToken: string): Promise<AuthTokens> {
    return apiClient.post<AuthTokens>('/auth/refresh', { refresh_token: refreshToken });
}

export async function logout(): Promise<void> {
    return apiClient.post('/auth/logout', {});
}

// ==================== User API ====================

export async function getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/users/me');
}

export async function updateUser(data: Partial<User>): Promise<User> {
    return apiClient.patch<User>('/users/me', data);
}

// ==================== Onboarding API ====================

export async function completeOnboarding(request: OnboardingCompleteRequest): Promise<User> {
    return apiClient.post<User>('/users/onboarding/complete', request);
}

export async function skipOnboarding(): Promise<User> {
    return apiClient.post<User>('/users/onboarding/complete', { skipped: true });
}

// ==================== Capabilities API ====================

export async function getUserCapabilities(): Promise<UserCapabilities> {
    return apiClient.get<UserCapabilities>('/users/capabilities');
}

// ==================== Trial API ====================

export interface TrialStatus {
    is_active: boolean;
    days_remaining: number;
    ends_at?: string;
}

export async function getTrialStatus(): Promise<TrialStatus> {
    return apiClient.get<TrialStatus>('/users/trial-status');
}