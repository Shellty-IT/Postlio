// src/lib/api/index.ts
/**
 * API Layer - Eksport zbiorczy
 */

// ============================================================
// CLIENT & UTILITIES
// ============================================================

export { apiClient, TokenManager, ApiException } from './client';
export type { ApiError, ApiResponse } from './client';

// ============================================================
// API MODULES
// ============================================================

export { authApi } from './auth';
export { aiApi } from './ai';
export { postsApi } from './posts';
export { brandsApi } from './brands';
export { autopilotApi } from './autopilot';

// Social Media API - named exports
export {
    getConnectedAccounts,
    getAccount,
    initOAuth,
    handleOAuthCallback,
    disconnectAccount,
    refreshAccountToken,
    publishPost,
    getAvailablePlatforms,
    getCapabilities,
    requiresImage,
    getPlatformColor,
    getPlatformName,
    getAccountTypeLabel,
    ACCOUNT_CAPABILITIES,
    BUSINESS_ACCOUNT_TYPES,
    PERSONAL_ACCOUNT_TYPES,
    PLATFORMS,
} from './social';

export type {
    SocialPlatform,
    AccountType,
    ConnectionStatus,
    PublishMethod,
    AccountCapabilities,
    FacebookPageInfo,
    InstagramAccountInfo,
    ConnectedAccount,
    ListAccountsResponse,
    OAuthInitResponse,
    OAuthCallbackResponse,
    PublishPostRequest,
    PublishPostResponse,
    RefreshTokenResponse,
    PlatformInfo,
    ManualPublishInfo,
} from './social';

// ============================================================
// AUTH TYPES
// ============================================================

export type {
    LoginRequest,
    RegisterRequest,
    AuthTokens,
    AuthResponse
} from './auth';

// ============================================================
// AI TYPES
// ============================================================

export type {
    ProviderInfo,
    ProvidersResponse,
    TextGenerationRequest,
    TextGenerationResponse,
    GeneratedTextContent,
    ImageGenerationRequest,
    ImageGenerationResponse,
    GeneratedImageContent,
    ChatMessage,
    ChatRequest,
    ChatResponse,
    ImproveRequest,
    ImproveResponse,
    VariationsRequest,
    VariationsResponse,
    TextProvider,
    ImageProvider,
    Platform,
    Category,
    Tone,
    ImageStyle,
} from './ai';

// ============================================================
// POSTS TYPES
// ============================================================

export type {
    CreatePostRequest,
    UpdatePostRequest,
    UpdatePlatformStatusRequest,
    PostsListParams,
    PostsListResponse,
    SchedulePostRequest,
    BulkActionRequest,
    CalendarEventsParams,
} from './posts';

// Re-export CalendarEvent from types (where it's now defined)
export type { CalendarEvent, Post, PostStatus, PlatformStatusDetail, PlatformStatuses } from '@/types/post';

// ============================================================
// BRANDS TYPES
// ============================================================

export type {
    CreateBrandRequest,
    UpdateBrandRequest,
    BrandsListResponse,
    AnalyzeBrandVoiceRequest,
    AnalyzeBrandVoiceResponse,
    BrandAnalytics,
} from './brands';