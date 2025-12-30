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
    TextProviderInfo,
    ImageProviderInfo,
    ProvidersResponse,
    TextGenerationRequest,
    TextGenerationResponse,
    ImageGenerationRequest,
    ImageGenerationResponse,
    GeneratedImage,
    ChatMessage,
    ChatRequest,
    ChatResponse,
    ImproveRequest,
    ImproveResponse,
    VariationsRequest,
    VariationsResponse,
} from './ai';

// ============================================================
// POSTS TYPES
// ============================================================

export type {
    CreatePostRequest,
    UpdatePostRequest,
    PostsListParams,
    PostsListResponse,
    SchedulePostRequest,
    BulkActionRequest,
    CalendarEventsParams,
    CalendarEvent,
} from './posts';

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