// src/lib/api/types.ts
// Typy dla wszystkich odpowiedzi API

// ============================================
// AUTH TYPES
// ============================================

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

export interface UserResponse {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
}

export interface AuthResponse {
    user: UserResponse;
    tokens: AuthTokens;
}

// ============================================
// AI TYPES
// ============================================

export type TextProvider = 'gemini' | 'groq';
export type ImageProvider = 'pollinations' | 'huggingface' | 'clipdrop';

export interface GenerateTextRequest {
    prompt: string;
    provider?: TextProvider;
    platform?: 'facebook' | 'instagram' | 'linkedin';
    brand_voice?: BrandVoiceSettings;
    max_length?: 'short' | 'medium' | 'long';
    creativity?: 'conservative' | 'balanced' | 'creative' | 'experimental';
}

export interface GenerateTextResponse {
    content: string;
    provider: TextProvider;
    tokens_used?: number;
    generation_time_ms: number;
}

export interface GenerateImageRequest {
    prompt: string;
    provider?: ImageProvider;
    style?: string;
    aspect_ratio?: '1:1' | '4:5' | '16:9' | '9:16';
    quality?: 'draft' | 'standard' | 'hd';
}

export interface GenerateImageResponse {
    image_url: string;
    provider: ImageProvider;
    generation_time_ms: number;
}

export interface ImproveTextRequest {
    content: string;
    instruction: string;
    provider?: TextProvider;
}

export interface ImproveTextResponse {
    improved_content: string;
    changes_made: string[];
    provider: TextProvider;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatRequest {
    messages: ChatMessage[];
    provider?: TextProvider;
    brand_voice?: BrandVoiceSettings;
}

export interface ChatResponse {
    message: ChatMessage;
    provider: TextProvider;
}

export interface GenerateVariationsRequest {
    content: string;
    count?: number;
    provider?: TextProvider;
    platforms?: ('facebook' | 'instagram' | 'linkedin')[];
}

export interface GenerateVariationsResponse {
    variations: {
        platform: string;
        content: string;
    }[];
    provider: TextProvider;
}

export interface AIProviderInfo {
    id: string;
    name: string;
    type: 'text' | 'image';
    is_available: boolean;
    description: string;
}

export interface ProvidersResponse {
    text_providers: AIProviderInfo[];
    image_providers: AIProviderInfo[];
    default_text_provider: TextProvider;
    default_image_provider: ImageProvider;
}

// ============================================
// BRAND TYPES
// ============================================

export interface ToneSettings {
    formality: number; // 0-100
    energy: number;
    humor: number;
    emotion: number;
}

export interface BrandVoiceSettings {
    tones: ToneSettings;
    personality_traits: string[];
    communication_styles: string[];
    keywords: string[];
    hashtags: string[];
    emoji_usage: 'none' | 'minimal' | 'moderate' | 'frequent';
    forbidden_words: string[];
    sample_posts: string[];
}

export interface BrandRequest {
    name: string;
    description?: string;
    industry?: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    voice_settings: BrandVoiceSettings;
    target_audience?: string;
    platforms: ('facebook' | 'instagram' | 'linkedin')[];
}

export interface BrandResponse {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    industry?: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    voice_settings: BrandVoiceSettings;
    target_audience?: string;
    platforms: string[];
    created_at: string;
    updated_at: string;
    posts_count: number;
    is_active: boolean;
}

// ============================================
// POST TYPES
// ============================================

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type Platform = 'facebook' | 'instagram' | 'linkedin';

export interface PostRequest {
    content: string;
    platforms: Platform[];
    brand_id?: string;
    image_url?: string;
    scheduled_at?: string;
    status?: PostStatus;
    hashtags?: string[];
    mentions?: string[];
}

export interface PostResponse {
    id: string;
    user_id: string;
    brand_id?: string;
    content: string;
    platforms: Platform[];
    image_url?: string;
    scheduled_at?: string;
    published_at?: string;
    status: PostStatus;
    hashtags: string[];
    mentions: string[];
    engagement?: {
        likes: number;
        comments: number;
        shares: number;
        reach: number;
    };
    created_at: string;
    updated_at: string;
    brand?: BrandResponse;
}

export interface PostsListResponse {
    posts: PostResponse[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}

export interface PostFilters {
    status?: PostStatus;
    platform?: Platform;
    brand_id?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
}

// ============================================
// AUTOPILOT TYPES
// ============================================

export interface TimeSlot {
    hour: number;
    minute: number;
}

export interface ScheduleConfigRequest {
    frequency: 'daily' | 'weekly' | 'custom';
    posts_per_day: number;
    active_days: number[]; // 0-6 (Sun-Sat)
    time_slots: TimeSlot[];
    timezone: string;
}

export interface ContentMixItem {
    category_id: string;
    percentage: number;
}

export interface AutopilotConfigRequest {
    name: string;
    brand_id: string;
    platforms: Platform[];
    schedule: ScheduleConfigRequest;
    content_mix: ContentMixItem[];
    topics: string[];
    ai_settings: {
        text_provider: TextProvider;
        image_provider: ImageProvider;
        creativity: 'conservative' | 'balanced' | 'creative' | 'experimental';
        post_length: 'short' | 'medium' | 'long';
        include_hashtags: boolean;
        include_emojis: boolean;
        include_cta: boolean;
        generate_images: boolean;
    };
    is_active: boolean;
}

export interface AutopilotConfigResponse extends AutopilotConfigRequest {
    id: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    next_generation_at?: string;
    stats: {
        total_generated: number;
        total_published: number;
        total_approved: number;
        total_rejected: number;
    };
}

export interface QueuedPostResponse {
    id: string;
    config_id: string;
    content: string;
    platforms: Platform[];
    image_url?: string;
    scheduled_at: string;
    status: 'pending' | 'approved' | 'rejected' | 'published' | 'failed';
    generated_at: string;
    category: string;
    topic?: string;
}

// ============================================
// SOCIAL ACCOUNTS TYPES
// ============================================

export interface SocialAccountResponse {
    id: string;
    platform: Platform;
    platform_user_id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    is_connected: boolean;
    connected_at: string;
    expires_at?: string;
    permissions: string[];
}

// ============================================
// COMMON TYPES
// ============================================

export interface ApiError {
    detail: string;
    code?: string;
    field?: string;
}

export interface PaginationParams {
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface SuccessResponse {
    success: boolean;
    message: string;
}