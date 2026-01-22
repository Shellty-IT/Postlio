// src/lib/api/social.ts
/**
 * API client dla Social Media integration.
 * Tylko oficjalnie wspierane typy kont.
 */

import { apiClient } from './client';

// ==================== Types ====================

export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin';

export type AccountType =
    | 'facebook_page'        // Strony Facebook
    | 'instagram_business'   // Konta biznesowe Instagram
    | 'instagram_creator'    // Konta twórców Instagram
    | 'linkedin_profile'     // Profile LinkedIn
    | 'linkedin_company';    // Strony firmowe LinkedIn

export type ConnectionStatus = 'connected' | 'disconnected' | 'expired' | 'error';

// ==================== Account Info ====================

export interface AccountCapabilities {
    supportsImages: boolean;
    supportsVideos: boolean;
    supportsLinks: boolean;
    supportsScheduling: boolean;
    maxTextLength: number;
    maxHashtags?: number;
    requiresImage: boolean;
    description: string;
}

export const ACCOUNT_CAPABILITIES: Record<AccountType, AccountCapabilities> = {
    facebook_page: {
        supportsImages: true,
        supportsVideos: true,
        supportsLinks: true,
        supportsScheduling: true,
        maxTextLength: 63206,
        requiresImage: false,
        description: 'Strona Facebook',
    },
    instagram_business: {
        supportsImages: true,
        supportsVideos: true,
        supportsLinks: false,
        supportsScheduling: true,
        maxTextLength: 2200,
        maxHashtags: 30,
        requiresImage: true, // Instagram wymaga obrazka!
        description: 'Konto biznesowe Instagram',
    },
    instagram_creator: {
        supportsImages: true,
        supportsVideos: true,
        supportsLinks: false,
        supportsScheduling: true,
        maxTextLength: 2200,
        maxHashtags: 30,
        requiresImage: true,
        description: 'Konto twórcy Instagram',
    },
    linkedin_profile: {
        supportsImages: true,
        supportsVideos: false,
        supportsLinks: true,
        supportsScheduling: true,
        maxTextLength: 3000,
        requiresImage: false,
        description: 'Profil LinkedIn',
    },
    linkedin_company: {
        supportsImages: true,
        supportsVideos: false,
        supportsLinks: true,
        supportsScheduling: true,
        maxTextLength: 3000,
        requiresImage: false,
        description: 'Strona firmowa LinkedIn',
    },
};

// ==================== Platform-specific ====================

export interface FacebookPageInfo {
    id: string;
    name: string;
    category?: string;
    fan_count?: number;
    picture_url?: string;
    has_access_token: boolean;
}

export interface InstagramAccountInfo {
    id: string;
    username: string;
    account_type: string;
    followers_count?: number;
    media_count?: number;
    profile_picture_url?: string;
    connected_page_id?: string;
}

// ==================== Connected Account ====================

export interface ConnectedAccount {
    id: number;
    platform: SocialPlatform;
    account_type: AccountType;

    platform_user_id: string;
    platform_username?: string;
    avatar_url?: string;

    is_active: boolean;
    status: ConnectionStatus;
    connected_at: string;
    expires_at?: string;

    permissions: string[];

    // Platform-specific
    pages?: FacebookPageInfo[];
    instagram_accounts?: InstagramAccountInfo[];

    // Capabilities
    supports_images: boolean;
    supports_videos: boolean;
    supports_links: boolean;
    max_text_length: number;
    requires_image: boolean;
}

export interface ListAccountsResponse {
    accounts: ConnectedAccount[];
    total: number;
}

// ==================== OAuth ====================

export interface OAuthInitResponse {
    authorization_url: string;
    state: string;
}

export interface OAuthCallbackResponse {
    success: boolean;
    platform: SocialPlatform;
    account_id?: string;
    account_name?: string;
    account_type?: AccountType;
    error?: string;
    error_description?: string;
}

// ==================== Publishing ====================

export interface PublishPostRequest {
    account_id: number;
    content: string;
    image_url?: string;
    link_url?: string;
    page_id?: string;
    instagram_account_id?: string;
    scheduled_for?: string;
}

export interface PublishPostResponse {
    success: boolean;
    platform: SocialPlatform;
    post_id?: string;
    post_url?: string;
    published_at?: string;
    error?: string;
    error_code?: string;
}

export interface RefreshTokenResponse {
    success: boolean;
    expires_at?: string;
    error?: string;
}

export interface PlatformInfo {
    platform: string;
    name: string;
    is_configured: boolean;
}

// ==================== API Functions ====================

export async function getConnectedAccounts(): Promise<ListAccountsResponse> {
    return apiClient.get<ListAccountsResponse>('/social/accounts');
}

export async function getAccount(accountId: number): Promise<ConnectedAccount> {
    return apiClient.get<ConnectedAccount>(`/social/accounts/${accountId}`);
}

export async function initOAuth(platform: SocialPlatform): Promise<OAuthInitResponse> {
    return apiClient.post<OAuthInitResponse>('/social/oauth/init', { platform });
}

export async function handleOAuthCallback(
    platform: SocialPlatform,
    code: string,
    state: string
): Promise<OAuthCallbackResponse> {
    return apiClient.post<OAuthCallbackResponse>('/social/oauth/callback', {
        platform,
        code,
        state,
    });
}

export async function disconnectAccount(accountId: number): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/social/accounts/${accountId}`);
}

export async function refreshAccountToken(accountId: number): Promise<RefreshTokenResponse> {
    return apiClient.post<RefreshTokenResponse>(`/social/accounts/${accountId}/refresh`);
}

export async function publishPost(request: PublishPostRequest): Promise<PublishPostResponse> {
    return apiClient.post<PublishPostResponse>('/social/publish', request);
}

export async function getAvailablePlatforms(): Promise<PlatformInfo[]> {
    return apiClient.get<PlatformInfo[]>('/social/platforms');
}

// ==================== Helpers ====================

export function getCapabilities(accountType: AccountType): AccountCapabilities {
    return ACCOUNT_CAPABILITIES[accountType];
}

export function requiresImage(accountType: AccountType): boolean {
    return ACCOUNT_CAPABILITIES[accountType]?.requiresImage ?? false;
}

export function getPlatformColor(platform: SocialPlatform): string {
    const colors: Record<SocialPlatform, string> = {
        facebook: '#1877F2',
        instagram: '#E4405F',
        linkedin: '#0A66C2',
    };
    return colors[platform];
}

export function getPlatformName(platform: SocialPlatform): string {
    const names: Record<SocialPlatform, string> = {
        facebook: 'Facebook',
        instagram: 'Instagram',
        linkedin: 'LinkedIn',
    };
    return names[platform];
}

export function getAccountTypeLabel(accountType: AccountType): string {
    const labels: Record<AccountType, string> = {
        facebook_page: 'Strona Facebook',
        instagram_business: 'Instagram Business',
        instagram_creator: 'Instagram Creator',
        linkedin_profile: 'Profil LinkedIn',
        linkedin_company: 'Strona firmowa LinkedIn',
    };
    return labels[accountType];
}