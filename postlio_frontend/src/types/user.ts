/**
 * Typy dla użytkownika i onboardingu.
 */

import type { SocialPlatform, AccountType } from './social';

// ==================== User ====================

export interface User {
    id: number;
    email: string;
    full_name?: string;
    avatar_url?: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    updated_at?: string;

    // Trial & Onboarding
    trial_ends_at?: string;
    is_trial_active: boolean;
    trial_days_remaining: number;
    onboarding_completed_at?: string;
    onboarding_skipped: boolean;
    needs_onboarding: boolean;

    // Social Login
    social_login_provider?: SocialPlatform;
    social_login_id?: string;
}

// ==================== Access Level ====================

export type AccessLevel = 'full' | 'limited' | 'demo';

export const ACCESS_LEVEL_INFO: Record<AccessLevel, {
    label: string;
    description: string;
    color: string;
    badgeVariant: 'default' | 'secondary' | 'outline';
}> = {
    full: {
        label: 'Pełny dostęp',
        description: 'Wszystkie funkcje dostępne, w tym Autopilot AI',
        color: 'green',
        badgeVariant: 'default',
    },
    limited: {
        label: 'Ograniczony dostęp',
        description: 'Konto osobiste - ręczna publikacja',
        color: 'yellow',
        badgeVariant: 'secondary',
    },
    demo: {
        label: 'Tryb demo',
        description: 'Bez podłączonego konta social media',
        color: 'gray',
        badgeVariant: 'outline',
    },
};

// ==================== User Capabilities ====================

export interface UserCapabilities {
    // Poziom dostępu
    access_level: AccessLevel;

    // Funkcje
    can_use_creator: boolean;      // Zawsze true
    can_use_materials: boolean;    // Zawsze true
    can_use_brands: boolean;       // Zawsze true
    can_use_calendar: boolean;     // Wymaga jakiegokolwiek konta
    can_use_autopilot: boolean;    // Wymaga konta firmowego
    can_auto_publish: boolean;     // Wymaga konta firmowego

    // Szczegóły
    connected_platforms: SocialPlatform[];
    business_platforms: SocialPlatform[];
    personal_platforms: SocialPlatform[];

    // Komunikaty dla UI
    calendar_lock_message?: string;
    autopilot_lock_message?: string;
}

// ==================== Default Capabilities ====================

export const DEFAULT_CAPABILITIES: UserCapabilities = {
    access_level: 'demo',
    can_use_creator: true,
    can_use_materials: true,
    can_use_brands: true,
    can_use_calendar: false,
    can_use_autopilot: false,
    can_auto_publish: false,
    connected_platforms: [],
    business_platforms: [],
    personal_platforms: [],
    calendar_lock_message: 'Podłącz konto social media aby korzystać z kalendarza',
    autopilot_lock_message: 'Podłącz konto firmowe aby korzystać z Autopilota',
};

// ==================== Auth ====================

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    full_name?: string;
}

export interface SocialLoginRequest {
    provider: SocialPlatform;
    access_token: string;
    // Dodatkowe dane z OAuth
    user_id?: string;
    email?: string;
    name?: string;
    avatar_url?: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface AuthResponse {
    tokens: AuthTokens;
    user: User;
    // Dla social login - info o podłączonym koncie
    connected_account?: {
        platform: SocialPlatform;
        account_type: AccountType;
        account_name: string;
        is_business_account: boolean;
    };
    // Czy pominąć onboarding (np. przy social login)
    skip_onboarding: boolean;
}

export interface OnboardingCompleteRequest {
    skipped: boolean;
}

// ==================== Social Login Config ====================

export interface SocialLoginConfig {
    platform: SocialPlatform;
    enabled: boolean;
    app_id?: string;
    permissions: string[];
}

export const SOCIAL_LOGIN_CONFIG: Record<SocialPlatform, SocialLoginConfig> = {
    facebook: {
        platform: 'facebook',
        enabled: true,
        permissions: [
            'public_profile',
            'email',
            'pages_show_list',
            'pages_read_engagement',
            'pages_manage_posts',
        ],
    },
    instagram: {
        platform: 'instagram',
        enabled: false, // Instagram logowanie przez Facebook
        permissions: [],
    },
    linkedin: {
        platform: 'linkedin',
        enabled: false, // Na razie wyłączone
        permissions: [],
    },
};