/**
 * API client dla Social Media integration.
 * Obsługuje zarówno konta firmowe (auto-publish) jak i osobiste (manual publish).
 */

import { apiClient } from './client';
import type {
    SocialPlatform,
    AccountType,
    ConnectionStatus,
    PublishMethod,
    AccountCapabilities,
    ConnectedAccount,
    ListAccountsResponse,
    OAuthInitResponse,
    OAuthCallbackResponse,
    PublishPostRequest,
    PublishPostResponse,
    RefreshTokenResponse,
    PlatformInfo,
    ManualPublishInfo,
    UserCapabilities,
    FacebookPageInfo,
    InstagramAccountInfo,
} from '@/types';

import {
    ACCOUNT_CAPABILITIES,
    BUSINESS_ACCOUNT_TYPES,
    PERSONAL_ACCOUNT_TYPES,
    PLATFORMS,
} from '@/types';

// Re-export types for convenience
export type {
    SocialPlatform,
    AccountType,
    ConnectionStatus,
    PublishMethod,
    AccountCapabilities,
    ConnectedAccount,
    ListAccountsResponse,
    OAuthInitResponse,
    OAuthCallbackResponse,
    PublishPostRequest,
    PublishPostResponse,
    RefreshTokenResponse,
    PlatformInfo,
    ManualPublishInfo,
    FacebookPageInfo,
    InstagramAccountInfo,
};

// Re-export constants
export {
    ACCOUNT_CAPABILITIES,
    BUSINESS_ACCOUNT_TYPES,
    PERSONAL_ACCOUNT_TYPES,
    PLATFORMS,
};

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

export async function getUserCapabilities(): Promise<UserCapabilities> {
    return apiClient.get<UserCapabilities>('/social/capabilities');
}

// ==================== Helper Functions ====================

export function getCapabilities(accountType: AccountType): AccountCapabilities {
    return ACCOUNT_CAPABILITIES[accountType];
}

export function isBusinessAccount(accountType: AccountType): boolean {
    return BUSINESS_ACCOUNT_TYPES.includes(accountType);
}

export function isPersonalAccount(accountType: AccountType): boolean {
    return PERSONAL_ACCOUNT_TYPES.includes(accountType);
}

export function supportsAutoPublish(accountType: AccountType): boolean {
    return ACCOUNT_CAPABILITIES[accountType]?.supports_auto_publish ?? false;
}

export function supportsAutopilot(accountType: AccountType): boolean {
    return ACCOUNT_CAPABILITIES[accountType]?.supports_autopilot ?? false;
}

export function requiresImage(accountType: AccountType): boolean {
    return ACCOUNT_CAPABILITIES[accountType]?.requires_image ?? false;
}

export function supportsShareDialog(accountType: AccountType): boolean {
    return ACCOUNT_CAPABILITIES[accountType]?.supports_share_dialog ?? false;
}

export function getPublishMethod(accountType: AccountType): PublishMethod {
    return ACCOUNT_CAPABILITIES[accountType]?.publish_method ?? 'manual_copy';
}

export function getAccountTypeLabel(accountType: AccountType): string {
    return ACCOUNT_CAPABILITIES[accountType]?.display_name ?? accountType;
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

export function getPlatformIcon(platform: SocialPlatform): string {
    const icons: Record<SocialPlatform, string> = {
        facebook: 'Facebook',
        instagram: 'Instagram',
        linkedin: 'Linkedin',
    };
    return icons[platform];
}

export function generateShareDialogUrl(
    platform: SocialPlatform,
    content: string,
    linkUrl?: string
): string | null {
    const encodedContent = encodeURIComponent(content.slice(0, 500));

    switch (platform) {
        case 'facebook': {
            let fbUrl = `https://www.facebook.com/sharer/sharer.php?quote=${encodedContent}`;
            if (linkUrl) {
                fbUrl += `&u=${encodeURIComponent(linkUrl)}`;
            }
            return fbUrl;
        }

        case 'linkedin': {
            let liUrl = `https://www.linkedin.com/sharing/share-offsite/?text=${encodedContent}`;
            if (linkUrl) {
                liUrl += `&url=${encodeURIComponent(linkUrl)}`;
            }
            return liUrl;
        }

        case 'instagram':
            return null;

        default:
            return null;
    }
}

export function generateDeeplink(platform: SocialPlatform): string {
    const deeplinks: Record<SocialPlatform, string> = {
        facebook: 'fb://feed',
        instagram: 'instagram://camera',
        linkedin: 'linkedin://feed',
    };
    return deeplinks[platform];
}

export function generateWebUrl(platform: SocialPlatform): string {
    const urls: Record<SocialPlatform, string> = {
        facebook: 'https://www.facebook.com',
        instagram: 'https://www.instagram.com',
        linkedin: 'https://www.linkedin.com/feed',
    };
    return urls[platform];
}

export function generateManualPublishInstructions(
    platform: SocialPlatform,
    hasImage: boolean = false
): string[] {
    switch (platform) {
        case 'facebook':
            return [
                "1. Kliknij 'Otwórz Facebook' lub skopiuj treść",
                "2. Wklej treść w nowy post",
                ...(hasImage ? ["3. Dodaj pobrane zdjęcie"] : []),
                `${hasImage ? '4' : '3'}. Opublikuj post`,
            ];

        case 'instagram':
            return [
                ...(hasImage ? ["0. Pobierz zdjęcie z aplikacji Postlio"] : []),
                "1. Skopiuj treść posta",
                "2. Otwórz aplikację Instagram",
                "3. Utwórz nowy post i wybierz zdjęcie",
                "4. Wklej skopiowaną treść jako opis",
                "5. Opublikuj post",
            ];

        case 'linkedin':
            return [
                "1. Kliknij 'Otwórz LinkedIn' lub skopiuj treść",
                "2. Wklej treść w nowy post",
                ...(hasImage ? ["3. Dodaj pobrane zdjęcie"] : []),
                `${hasImage ? '4' : '3'}. Opublikuj post`,
            ];

        default:
            return ["Skopiuj treść i opublikuj ręcznie na platformie."];
    }
}

export function generateManualPublishInfo(
    platform: SocialPlatform,
    accountType: AccountType,
    content: string,
    hashtags?: string[],
    imageUrl?: string,
    linkUrl?: string
): ManualPublishInfo {
    const hashtagsString = hashtags?.length
        ? hashtags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ')
        : undefined;

    const fullContent = hashtagsString
        ? `${content}\n\n${hashtagsString}`
        : content;

    return {
        platform,
        account_type: accountType,
        content: fullContent,
        hashtags: hashtagsString,
        share_dialog_url: generateShareDialogUrl(platform, fullContent, linkUrl) ?? undefined,
        deeplink_url: generateDeeplink(platform),
        web_url: generateWebUrl(platform),
        instructions: generateManualPublishInstructions(platform, !!imageUrl),
    };
}

export function computeAccessLevel(accounts: ConnectedAccount[]): 'full' | 'limited' | 'demo' {
    if (!accounts || accounts.length === 0) {
        return 'demo';
    }

    const hasBusinessAccount = accounts.some(
        account => account.is_active && account.is_business_account
    );

    if (hasBusinessAccount) {
        return 'full';
    }

    const hasPersonalAccount = accounts.some(
        account => account.is_active && !account.is_business_account
    );

    if (hasPersonalAccount) {
        return 'limited';
    }

    return 'demo';
}

export function getUpgradeMessage(platform: SocialPlatform): string {
    const messages: Record<SocialPlatform, string> = {
        facebook: 'Autopilot wymaga Strony Facebook. Podłącz stronę, którą zarządzasz.',
        instagram: 'Autopilot wymaga konta Instagram Business lub Creator połączonego ze Stroną Facebook.',
        linkedin: 'Autopilot wymaga Strony firmowej LinkedIn.',
    };
    return messages[platform];
}

export function getBusinessAccountTypesForPlatform(platform: SocialPlatform): AccountType[] {
    const mapping: Record<SocialPlatform, AccountType[]> = {
        facebook: ['facebook_page'],
        instagram: ['instagram_business', 'instagram_creator'],
        linkedin: ['linkedin_company'],
    };
    return mapping[platform] ?? [];
}

export function getPersonalAccountTypeForPlatform(platform: SocialPlatform): AccountType {
    const mapping: Record<SocialPlatform, AccountType> = {
        facebook: 'facebook_personal',
        instagram: 'instagram_personal',
        linkedin: 'linkedin_personal',
    };
    return mapping[platform];
}