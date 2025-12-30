// src/lib/api/ai.ts
/**
 * AI API Layer
 *
 * Komunikacja z endpointami AI.
 * Obsługuje wielu providerów text i image.
 */

import { apiClient } from './client';
import type { Platform } from '@/types';

// ============================================================
// TYPY PROVIDERÓW
// ============================================================

export interface TextProviderInfo {
    id: string;
    name: string;
    description: string;
    models: string[];
    is_available: boolean;
}

export interface ImageProviderInfo {
    id: string;
    name: string;
    description: string;
    models: string[];
    supported_sizes: string[];
    is_available: boolean;
}

export interface ProvidersResponse {
    text_providers: TextProviderInfo[];
    image_providers: ImageProviderInfo[];
    default_text_provider: string;
    default_image_provider: string;
}

// ============================================================
// TYPY GENEROWANIA TEKSTU
// ============================================================

export interface TextGenerationRequest {
    prompt: string;
    platform?: Platform;
    brand_id?: string;
    tone?: string;
    language?: string;
    max_length?: number;
    provider?: string;
    model?: string;
    // Dla trybu Autopilot
    use_brand_voice?: boolean;
    content_type?: 'post' | 'story' | 'reel' | 'article';
}

export interface TextGenerationResponse {
    content: string;
    provider: string;
    model: string;
    tokens_used?: number;
    generation_time?: number;
    suggestions?: string[];
}

// ============================================================
// TYPY GENEROWANIA OBRAZÓW
// ============================================================

export interface ImageGenerationRequest {
    prompt: string;
    negative_prompt?: string;
    style?: string;
    size?: string;
    provider?: string;
    model?: string;
    num_images?: number;
    brand_id?: string;
}

export interface ImageGenerationResponse {
    images: GeneratedImage[];
    provider: string;
    model: string;
    generation_time?: number;
}

export interface GeneratedImage {
    url: string;
    base64?: string;
    width: number;
    height: number;
    prompt: string;
}

// ============================================================
// TYPY CHAT (Tryb Kreator)
// ============================================================

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatRequest {
    messages: ChatMessage[];
    platform?: Platform;
    brand_id?: string;
    provider?: string;
    context?: {
        current_draft?: string;
        post_type?: string;
        target_audience?: string;
    };
}

export interface ChatResponse {
    message: ChatMessage;
    suggestions?: string[];
    provider: string;
}

// ============================================================
// TYPY IMPROVE
// ============================================================

export interface ImproveRequest {
    content: string;
    improvement_type: 'grammar' | 'engagement' | 'seo' | 'tone' | 'shorten' | 'expand';
    platform?: Platform;
    provider?: string;
}

export interface ImproveResponse {
    original: string;
    improved: string;
    changes: string[];
    provider: string;
}

// ============================================================
// TYPY VARIATIONS
// ============================================================

export interface VariationsRequest {
    content: string;
    num_variations?: number;
    platform?: Platform;
    provider?: string;
}

export interface VariationsResponse {
    original: string;
    variations: string[];
    provider: string;
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
    return apiClient.post<TextGenerationResponse>('/ai/generate/text', request);
}

/**
 * Generuj obraz
 */
export async function generateImage(
    request: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
    return apiClient.post<ImageGenerationResponse>('/ai/generate/image', request, {
        timeout: 60000, // Obrazy mogą trwać dłużej
    });
}

/**
 * Ulepsz istniejący tekst
 */
export async function improveText(
    request: ImproveRequest
): Promise<ImproveResponse> {
    return apiClient.post<ImproveResponse>('/ai/improve', request);
}

/**
 * Generuj wariacje tekstu
 */
export async function generateVariations(
    request: VariationsRequest
): Promise<VariationsResponse> {
    return apiClient.post<VariationsResponse>('/ai/generate/variations', request);
}

/**
 * Chat z AI (tryb Kreator)
 */
export async function chat(request: ChatRequest): Promise<ChatResponse> {
    return apiClient.post<ChatResponse>('/ai/chat', request);
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