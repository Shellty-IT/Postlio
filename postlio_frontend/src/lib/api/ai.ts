// src/lib/api/ai.ts
/**
 * AI API Layer
 *
 * Komunikacja z endpointami AI.
 * Obsługuje wielu providerów text i image.
 */

import { apiClient } from './client';

// ============================================================
// ENUMS (dopasowane do backendu)
// ============================================================

export type TextProvider = 'gemini' | 'groq';
export type ImageProvider = 'pollinations' | 'huggingface';

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

export interface ProviderInfo {
    name: string;
    display_name?: string;
    available: boolean;
    is_free?: boolean;
    models: string[];
    is_default: boolean;
    description?: string;
}

export interface ProvidersResponse {
    text_providers: ProviderInfo[];
    image_providers: ProviderInfo[];
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
// API FUNCTIONS
// ============================================================

/**
 * Pobierz listę dostępnych providerów AI
 */
export async function getProviders(): Promise<ProvidersResponse> {
    return apiClient.get<ProvidersResponse>('/ai/providers');
}

/**
 * Generuj tekst posta
 */
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

/**
 * Generuj obraz
 */
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

/**
 * Ulepsz istniejący tekst
 */
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

/**
 * Generuj wariacje tekstu
 */
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

/**
 * Chat z AI (tryb Kreator)
 */
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
// EXPORT ZBIORCZY
// ============================================================

export const aiApi = {
    getProviders,
    generateText,
    generateImage,
    improveText,
    generateVariations,
    chat,
};

export default aiApi;