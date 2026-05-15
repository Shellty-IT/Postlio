// src/lib/api/ai.ts

import { apiClient } from './client';

// ============================================================
// ENUMS
// ============================================================

export type TextProvider = 'gemini' | 'groq';
export type ImageProvider = 'pollinations' | 'huggingface';
export type VideoProvider = 'pollinations';

export type Platform = 'facebook' | 'instagram' | 'linkedin';

export type Category =
    | 'fitness'
    | 'health'
    | 'beauty'
    | 'cooking'
    | 'business'
    | 'technology'
    | 'travel'
    | 'lifestyle'
    | 'education'
    | 'entertainment';

export type Tone =
    | 'professional'
    | 'casual'
    | 'humorous'
    | 'inspirational'
    | 'educational'
    | 'friendly';

export type ImageStyle =
    | 'realistic'
    | 'artistic'
    | 'cartoon'
    | 'minimalist'
    | 'vibrant'
    | 'professional';

// ============================================================
// PROVIDER INFO
// ============================================================

export interface VideoModelInfo {
    id: string;
    name: string;
}

export interface ProviderInfo {
    name: string;
    display_name?: string;
    available: boolean;
    is_free?: boolean;
    models: string[];
    models_detailed?: VideoModelInfo[];
    is_default: boolean;
    description?: string;
}

export interface ProvidersResponse {
    text_providers: ProviderInfo[];
    image_providers: ProviderInfo[];
    video_providers?: ProviderInfo[];
}

// ============================================================
// TEXT GENERATION
// ============================================================

export interface TextGenerationRequest {
    topic: string;
    platform: Platform;
    provider?: TextProvider;
    model?: string;
    category?: Category;
    tone?: Tone;
    language?: string;
    include_hashtags?: boolean;
    include_emoji?: boolean;
    max_length?: number;
}

export interface GeneratedTextContent {
    content: string;
    platform: string;
    provider: string;
    model?: string;
    hashtags?: string[];
}

export interface TextGenerationResponse {
    success: boolean;
    data: GeneratedTextContent;
    tokens_used?: number;
}

// ============================================================
// VARIATIONS
// ============================================================

export interface VariationsRequest {
    content: string;
    platform: Platform;
    provider?: TextProvider;
    model?: string;
    variations_count?: number;
}

export interface VariationsResponse {
    success: boolean;
    variations: string[];
    provider: string;
}

// ============================================================
// IMPROVE TEXT
// ============================================================

export interface ImproveRequest {
    content: string;
    platform: Platform;
    provider?: TextProvider;
    model?: string;
    instructions?: string;
}

export interface ImproveResponse {
    success: boolean;
    content: string;
    provider: string;
}

// ============================================================
// CHAT
// ============================================================

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatRequest {
    messages: ChatMessage[];
    provider?: TextProvider;
    model?: string;
    category?: Category;
    platform?: Platform;
}

export interface ChatResponse {
    success: boolean;
    message: string;
    provider: string;
}

// ============================================================
// IMAGE GENERATION
// ============================================================

export interface ImageGenerationRequest {
    prompt: string;
    provider?: ImageProvider;
    model?: string;
    style?: ImageStyle;
    width?: number;
    height?: number;
}

export interface GeneratedImageContent {
    image_url?: string;
    image_data?: string;
    prompt: string;
    prompt_translated?: string;
    prompt_enhanced?: string;
    provider: string;
    model?: string;
    width?: number;
    height?: number;
}

export interface ImageGenerationResponse {
    success: boolean;
    data?: GeneratedImageContent;
    error?: string;
}

// ============================================================
// VIDEO GENERATION
// ============================================================

export interface VideoGenerationRequest {
    prompt: string;
    provider?: VideoProvider;
    model?: string;
    width?: number;
    height?: number;
    duration?: number;
    reference_image?: string;
}

export interface GeneratedVideoContent {
    video_data?: string;
    mime_type?: string;
    prompt: string;
    prompt_translated?: string;
    provider: string;
    model?: string;
    model_display_name?: string;
    width?: number;
    height?: number;
    duration?: number;
    size_bytes?: number;
    has_reference_image: boolean;
}

export interface VideoGenerationResponse {
    success: boolean;
    data?: GeneratedVideoContent;
    error?: string;
}

// ============================================================
// API FUNCTIONS
// ============================================================

export async function getProviders(): Promise<ProvidersResponse> {
    return apiClient.get<ProvidersResponse>('/ai/providers');
}

export async function generateText(
    request: TextGenerationRequest
): Promise<TextGenerationResponse> {
    return apiClient.post<TextGenerationResponse>('/ai/generate/text', {
        topic: request.topic,
        platform: request.platform,
        provider: request.provider,
        model: request.model,
        category: request.category,
        tone: request.tone || 'professional',
        language: request.language || 'pl',
        include_hashtags: request.include_hashtags ?? true,
        include_emoji: request.include_emoji ?? true,
        max_length: request.max_length,
    });
}

export async function generateImage(
    request: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
    return apiClient.post<ImageGenerationResponse>('/ai/generate/image', {
        prompt: request.prompt,
        provider: request.provider,
        model: request.model,
        style: request.style,
        width: request.width || 1024,
        height: request.height || 1024,
    }, {
        timeout: 120000,
    });
}

export async function generateVideo(
    request: VideoGenerationRequest
): Promise<VideoGenerationResponse> {
    return apiClient.post<VideoGenerationResponse>('/ai/generate/video', {
        prompt: request.prompt,
        provider: request.provider,
        model: request.model,
        width: request.width || 848,
        height: request.height || 480,
        duration: request.duration || 5,
        reference_image: request.reference_image,
    }, {
        timeout: 240000,
    });
}

export async function improveText(
    request: ImproveRequest
): Promise<ImproveResponse> {
    return apiClient.post<ImproveResponse>('/ai/improve', {
        content: request.content,
        platform: request.platform,
        provider: request.provider,
        model: request.model,
        instructions: request.instructions,
    });
}

export async function generateVariations(
    request: VariationsRequest
): Promise<VariationsResponse> {
    return apiClient.post<VariationsResponse>('/ai/generate/variations', {
        content: request.content,
        platform: request.platform,
        provider: request.provider,
        model: request.model,
        variations_count: request.variations_count || 3,
    });
}

export async function chat(request: ChatRequest): Promise<ChatResponse> {
    return apiClient.post<ChatResponse>('/ai/chat', {
        messages: request.messages,
        provider: request.provider,
        model: request.model,
        category: request.category,
        platform: request.platform,
    });
}

// ============================================================
// EXPORT
// ============================================================

export const aiApi = {
    getProviders,
    generateText,
    generateImage,
    generateVideo,
    improveText,
    generateVariations,
    chat,
};

export default aiApi;