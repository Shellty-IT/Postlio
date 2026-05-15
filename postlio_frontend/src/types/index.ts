// src/types/index.ts
/**
 * Postlio - Definicje TypeScript
 * Centralne miejsce dla wszystkich typów aplikacji.
 */

// ============================================================
// IMPORT POST TYPES (do użycia w tym pliku)
// ============================================================

import type { Post, PostStatus } from './post';

// ============================================================
// RE-EXPORT USER TYPES
// ============================================================

export type {
    User,
    AccessLevel,
    UserCapabilities,
    LoginRequest,
    RegisterRequest,
    SocialLoginRequest,
    AuthTokens,
    AuthResponse,
    OnboardingCompleteRequest,
    SocialLoginConfig,
} from './user';

export {
    ACCESS_LEVEL_INFO,
    DEFAULT_CAPABILITIES,
    SOCIAL_LOGIN_CONFIG,
} from './user';

// ============================================================
// RE-EXPORT SOCIAL TYPES
// ============================================================

export type {
    SocialPlatform,
    AccountType,
    ConnectionStatus,
    PublishMethod,
    AccountCapabilities,
    PlatformInfo,
    FacebookPageInfo,
    InstagramAccountInfo,
    ConnectedAccount,
    ListAccountsResponse,
    OAuthInitResponse,
    OAuthCallbackResponse,
    PublishPostRequest,
    PublishPostResponse,
    RefreshTokenResponse,
    ManualPublishInfo,
} from './social';

export {
    BUSINESS_ACCOUNT_TYPES,
    PERSONAL_ACCOUNT_TYPES,
    ACCOUNT_CAPABILITIES,
    PLATFORMS,
    isBusinessAccountType,
    isPersonalAccountType,
    getAccountCapabilities,
    getPlatformColor,
    getPlatformName,
    getAccountTypeLabel,
} from './social';

// ============================================================
// RE-EXPORT BRAND TYPES
// ============================================================

export type {
    Brand,
    BrandVoiceDNA,
    BrandFormData,
    PersonalityTrait,
    CommunicationStyle,
    EmojiUsage,
    ApiBrand,
    ApiBrandVoiceDNA,
    ApiBrandsListResponse,
    ApiAnalyzeVoiceResponse,
} from './brand';

export {
    transformApiBrandToFrontend,
    transformBrandToApi,
    transformApiVoiceDNAToFrontend,
    transformVoiceDNAToApi,
    PERSONALITY_TRAITS,
    COMMUNICATION_STYLES,
    INDUSTRIES,
    DEFAULT_VOICE_DNA,
} from './brand';

// ============================================================
// RE-EXPORT POST TYPES
// ============================================================

export type {
    Post,
    PostStatus,
    CalendarEvent,
    PlatformStatusDetail,
    PlatformStatuses,
} from './post';

export {
    isFullyPublished,
    getUnpublishedPlatforms,
    getOverallStatus,
} from './post';

// ============================================================
// PODSTAWOWE ENUMY
// ============================================================

// Platform - alias dla SocialPlatform (kompatybilność wsteczna)
export type Platform = 'facebook' | 'instagram' | 'linkedin';

export type UserRole = 'user' | 'admin' | 'premium';

// AI Providers
export type TextProvider = 'gemini' | 'groq';
export type ImageProvider = 'pollinations' | 'gemini' | 'huggingface' | 'clipdrop';
export type AIProvider = TextProvider | ImageProvider;

export type ContentType = 'post' | 'story' | 'reel' | 'article';

// ============================================================
// AI PROVIDER DEFINITIONS
// ============================================================

export interface ProviderInfo {
    id: string;
    name: string;
    description: string;
    isFree: boolean;
    isAvailable?: boolean;
    models?: ModelInfo[];
}

export interface ModelInfo {
    id: string;
    name: string;
    description: string;
    aliases?: string[];
}

export const TEXT_PROVIDERS: ProviderInfo[] = [
    {
        id: 'gemini',
        name: 'Gemini (Google)',
        description: 'Rozumie polski, szybki, wysoka jakość.',
        isFree: true,
    },
    {
        id: 'groq',
        name: 'Groq (Llama 3.3)',
        description: 'Bardzo szybki, darmowy.',
        isFree: true,
    },
];

// Zaktualizuj IMAGE_PROVIDERS w src/types/index.ts

export const IMAGE_PROVIDERS: ProviderInfo[] = [
    {
        id: 'pollinations',
        name: 'Pollinations AI',
        description: 'Szybki z auto-ulepszaniem. Obsługuje polski!',
        isFree: false, // Wymaga API key
        models: [
            {
                id: 'flux',
                name: 'Flux',
                description: 'Wysoka jakość, szczegółowe obrazy',
            },
            {
                id: 'nanobanana',
                name: 'Nanobanana',
                description: 'Szybki, lżejszy model',
            },
        ],
    },
    {
        id: 'huggingface',
        name: 'HuggingFace',
        description: 'Stable Diffusion XL. Wysoka jakość.',
        isFree: true,
        models: [
            {
                id: 'stabilityai/stable-diffusion-xl-base-1.0',
                name: 'Stable Diffusion XL',
                description: 'Wysokiej jakości obrazy',
            },
        ],
    },
];

// ============================================================
// USER PREFERENCES
// ============================================================

export interface UserPreferences {
    default_platform?: Platform;
    default_brand_id?: string;
    default_text_provider?: TextProvider;
    default_image_provider?: ImageProvider;
    language?: string;
    timezone?: string;
    notifications_enabled?: boolean;
    autopilot_enabled?: boolean;
}

// ============================================================
// SOCIAL ACCOUNTS (zachowane dla kompatybilności)
// ============================================================

export interface SocialAccount {
    id: string;
    user_id: string;
    brand_id?: string;
    platform: Platform;
    platform_user_id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    access_token?: string;
    refresh_token?: string;
    token_expires_at?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ============================================================
// POSTS - LEGACY (dla kompatybilności wstecznej)
// ============================================================

export interface PostMedia {
    id: string;
    url: string;
    type: 'image' | 'video' | 'gif';
    alt_text?: string;
    width?: number;
    height?: number;
    thumbnail_url?: string;
}

export interface PostAnalytics {
    impressions?: number;
    reach?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    clicks?: number;
    engagement_rate?: number;
}

// Legacy Post interface - używa zaimportowanego PostStatus
export interface LegacyPost {
    id: number | string;
    user_id: number | string;
    brand_id?: number | null;
    content: string;
    platform: Platform;
    status: PostStatus;  // ✅ Teraz działa - PostStatus jest zaimportowany na górze
    scheduled_at?: string | null;
    published_at?: string | null;
    image_url?: string | null;
    image_prompt?: string | null;
    platform_post_id?: string | null;
    ai_generated: boolean;
    ai_model?: string | null;
    ai_provider?: string | null;
    generation_params?: Record<string, unknown> | null;
    likes: number;
    comments: number;
    shares: number;
    created_at: string;
    updated_at: string;
    hashtags?: string[];
    media?: PostMedia[];
    analytics?: PostAnalytics;
    ai_prompt?: string;
}

export function postToPlatformsArray(post: Post): Platform[] {
    if ('platforms' in post && Array.isArray(post.platforms) && post.platforms.length > 0) {
        return post.platforms;
    }
    if ('platform' in post && post.platform) {
        return [post.platform];
    }
    return ['facebook'];
}

export function platformsToSingle(platforms: Platform[]): Platform {
    return platforms[0] || 'facebook';
}

// ============================================================
// CALENDAR & SCHEDULING
// ============================================================

export interface ScheduleSlot {
    id: string;
    brand_id: string;
    day_of_week: number;
    time: string;
    platforms: Platform[];
    is_active: boolean;
}

export interface AutopilotSettings {
    brand_id: string;
    is_enabled: boolean;
    posts_per_day: number;
    preferred_times: string[];
    content_types: ContentType[];
    platforms: Platform[];
    auto_approve: boolean;
    content_pillars: string[];
}

// ============================================================
// AI GENERATION
// ============================================================

export interface GenerationHistory {
    id: string;
    user_id: string;
    brand_id?: string;
    type: 'text' | 'image';
    prompt: string;
    result: string;
    provider: string;
    model?: string;
    platform?: Platform;
    tokens_used?: number;
    generation_time?: number;
    rating?: number;
    used_in_post?: string;
    created_at: string;
}

// ============================================================
// UI TYPES
// ============================================================

export interface NavItem {
    title: string;
    href: string;
    icon: string;
    badge?: string | number;
    disabled?: boolean;
    external?: boolean;
    children?: NavItem[];
    requiresAuth?: boolean;
    requiresBusinessAccount?: boolean;
}

export interface BreadcrumbItem {
    title: string;
    href?: string;
}

export interface SelectOption {
    value: string;
    label: string;
    icon?: string;
    disabled?: boolean;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    message?: string;
}

export interface ApiErrorResponse {
    success: false;
    error: string;
    code?: string;
    details?: Record<string, unknown>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;