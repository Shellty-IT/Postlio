// src/lib/api/brands.ts
import { apiClient } from './client';
import type {
    Brand,
    BrandVoiceDNA,
    ApiBrand,
    ApiBrandsListResponse,
    ApiAnalyzeVoiceResponse,
} from '@/types/brand';
import {
    transformApiBrandToFrontend,
    transformApiVoiceDNAToFrontend,
    transformVoiceDNAToApi,
} from '@/types/brand';


// ============================================================
// REQUEST TYPES
// ============================================================

export interface CreateBrandRequest {
    name: string;
    description?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    industry?: string;
    targetAudience?: string;
    voiceDNA?: Partial<BrandVoiceDNA>;
}

export interface UpdateBrandRequest {
    name?: string;
    description?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    industry?: string;
    targetAudience?: string;
    voiceDNA?: Partial<BrandVoiceDNA>;
    isActive?: boolean;
}

export interface AnalyzeBrandVoiceRequest {
    sample_content: string[];
    brand_id?: number;
}

// ============================================================
// RESPONSE TYPES (frontend)
// ============================================================

export interface BrandsListResponse {
    brands: Brand[];
    total: number;
}

export interface AnalyzeBrandVoiceResponse {
    voiceDNA: BrandVoiceDNA;
    analysis: {
        toneBreakdown: Record<string, number>;
        commonPhrases: string[];
        vocabularyLevel: string;
        emojiUsageDetected: string;
        hashtagStyle: string;
    };
}

export interface BrandAnalytics {
    totalPosts: number;
    postsThisMonth: number;
    engagementRate: number;
    bestPerformingPlatform: string | null;
    suggestedPostingTimes: string[];
}

// ============================================================
// API FUNCTIONS
// ============================================================

/**
 * Pobierz listę brandów
 */
export async function getBrands(): Promise<BrandsListResponse> {
    const response = await apiClient.get<ApiBrandsListResponse>('/brands');
    return {
        brands: response.brands.map(transformApiBrandToFrontend),
        total: response.total,
    };
}

/**
 * Pobierz pojedynczy brand
 */
export async function getBrand(id: string): Promise<Brand> {
    const response = await apiClient.get<ApiBrand>(`/brands/${id}`);
    return transformApiBrandToFrontend(response);
}

/**
 * Utwórz nowy brand
 */
export async function createBrand(data: CreateBrandRequest): Promise<Brand> {
    const apiData = {
        name: data.name,
        description: data.description,
        logo_url: data.logoUrl,
        primary_color: data.primaryColor || '#8B5CF6',
        secondary_color: data.secondaryColor,
        industry: data.industry,
        target_audience: data.targetAudience,
        voice_dna: data.voiceDNA ? transformVoiceDNAToApi(data.voiceDNA) : undefined,
    };

    const response = await apiClient.post<ApiBrand>('/brands', apiData);
    return transformApiBrandToFrontend(response);
}

/**
 * Aktualizuj brand
 */
export async function updateBrand(
    id: string,
    data: UpdateBrandRequest
): Promise<Brand> {
    const apiData: Record<string, unknown> = {};

    if (data.name !== undefined) apiData.name = data.name;
    if (data.description !== undefined) apiData.description = data.description;
    if (data.logoUrl !== undefined) apiData.logo_url = data.logoUrl;
    if (data.primaryColor !== undefined) apiData.primary_color = data.primaryColor;
    if (data.secondaryColor !== undefined) apiData.secondary_color = data.secondaryColor;
    if (data.industry !== undefined) apiData.industry = data.industry;
    if (data.targetAudience !== undefined) apiData.target_audience = data.targetAudience;
    if (data.isActive !== undefined) apiData.is_active = data.isActive;
    if (data.voiceDNA !== undefined) apiData.voice_dna = transformVoiceDNAToApi(data.voiceDNA);

    const response = await apiClient.patch<ApiBrand>(`/brands/${id}`, apiData);
    return transformApiBrandToFrontend(response);
}

/**
 * Usuń brand
 */
export async function deleteBrand(id: string): Promise<void> {
    return apiClient.delete(`/brands/${id}`);
}

/**
 * Upload logo brandu
 */
export async function uploadBrandLogo(
    brandId: string,
    file: File,
    onProgress?: (percent: number) => void
): Promise<{ logoUrl: string }> {
    const response = await apiClient.upload<{ logo_url: string }>(
        `/brands/${brandId}/logo`,
        file,
        onProgress
    );
    return { logoUrl: response.logo_url };
}

/**
 * Analizuj Brand Voice na podstawie przykładowych treści
 */
export async function analyzeBrandVoice(
    data: AnalyzeBrandVoiceRequest
): Promise<AnalyzeBrandVoiceResponse> {
    const response = await apiClient.post<ApiAnalyzeVoiceResponse>(
        '/brands/analyze-voice',
        data,
        { timeout: 45000 }
    );

    return {
        voiceDNA: transformApiVoiceDNAToFrontend(response.voice_dna),
        analysis: {
            toneBreakdown: response.analysis.tone_breakdown,
            commonPhrases: response.analysis.common_phrases,
            vocabularyLevel: response.analysis.vocabulary_level,
            emojiUsageDetected: response.analysis.emoji_usage_detected,
            hashtagStyle: response.analysis.hashtag_style,
        },
    };
}

/**
 * Pobierz analityki brandu
 */
export async function getBrandAnalytics(id: string): Promise<BrandAnalytics> {
    const response = await apiClient.get<{
        total_posts: number;
        posts_this_month: number;
        engagement_rate: number;
        best_performing_platform: string | null;
        suggested_posting_times: string[];
    }>(`/brands/${id}/analytics`);

    return {
        totalPosts: response.total_posts,
        postsThisMonth: response.posts_this_month,
        engagementRate: response.engagement_rate,
        bestPerformingPlatform: response.best_performing_platform,
        suggestedPostingTimes: response.suggested_posting_times,
    };
}

/**
 * Ustaw brand jako domyślny
 */
export async function setDefaultBrand(id: string): Promise<Brand> {
    const response = await apiClient.post<ApiBrand>(`/brands/${id}/set-default`);
    return transformApiBrandToFrontend(response);
}

// ============================================================
// EXPORT ZBIORCZY
// ============================================================

export const brandsApi = {
    getBrands,
    getBrand,
    createBrand,
    updateBrand,
    deleteBrand,
    uploadBrandLogo,
    analyzeBrandVoice,
    getBrandAnalytics,
    setDefaultBrand,
};

export default brandsApi;