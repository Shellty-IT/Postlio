// src/types/index.ts
/**
 * Postlio - Definicje TypeScript
 * Centralne miejsce dla wszystkich typów aplikacji.
 */

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
// PODSTAWOWE ENUMY
// ============================================================

export type Platform = 'facebook' | 'instagram' | 'linkedin';

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'archived';

export type UserRole = 'user' | 'admin' | 'premium';

// AI Providers - ZAKTUALIZOWANE
export type TextProvider = 'gemini' | 'groq';
export type ImageProvider = 'pollinations' | 'gemini' | 'huggingface' | 'clipdrop';
export type AIProvider = TextProvider | ImageProvider;

export type ContentType = 'post' | 'story' | 'reel' | 'article';

// ============================================================
// AI PROVIDER DEFINITIONS - ZAKTUALIZOWANE
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

export const IMAGE_PROVIDERS: ProviderInfo[] = [
    {
        id: 'pollinations',
        name: 'Pollinations AI',
        description: 'Darmowy, szybki. Auto-tłumaczenie PL→EN.',
        isFree: true,
    },
    {
        id: 'gemini',
        name: 'Gemini (Google)',
        description: 'Rozumie polski! Dwa modele do wyboru.',
        isFree: true,
        models: [
            {
                id: 'gemini-2.0-flash-exp-image-generation',
                name: 'Nano Banana',
                description: 'Szybki, eksperymentalny',
                aliases: ['nano-banana', 'flash'],
            },
            {
                id: 'imagen-3.0-generate-002',
                name: 'Nano Banana Pro',
                description: 'Najwyższa jakość, fotorealizm',
                aliases: ['nano-banana-pro', 'pro'],
            },
        ],
    },
    {
        id: 'huggingface',
        name: 'HuggingFace FLUX',
        description: 'Wysokiej jakości. Auto-tłumaczenie PL→EN.',
        isFree: true,
    },
    // ClipDrop ukryty bo płatny - odkomentuj jeśli chcesz pokazać
    // {
    //     id: 'clipdrop',
    //     name: 'ClipDrop (Płatny)',
    //     description: 'Stability AI. Wymaga płatnej subskrypcji.',
    //     isFree: false,
    // },
];

// ============================================================
// USER
// ============================================================

export interface User {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    preferences?: UserPreferences;
}

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
// SOCIAL ACCOUNTS
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
// POSTS
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

export interface Post {
    id: string;
    user_id: string;
    brand_id?: string;
    content: string;
    platforms: Platform[];
    status: PostStatus;
    scheduled_at?: string;
    published_at?: string;
    media?: PostMedia[];
    hashtags?: string[];
    analytics?: PostAnalytics;
    ai_generated: boolean;
    ai_provider?: string;
    ai_prompt?: string;
    created_at: string;
    updated_at: string;
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