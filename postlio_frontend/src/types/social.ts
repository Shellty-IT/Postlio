/**
 * Typy dla integracji Social Media.
 * Obsługuje zarówno konta firmowe (auto-publish) jak i osobiste (manual publish).
 */

// ==================== Enums ====================

export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin';

/**
 * Typy kont social media.
 *
 * FIRMOWE (supports_auto_publish=true):
 * - facebook_page, instagram_business, instagram_creator, linkedin_company
 *
 * OSOBISTE (supports_auto_publish=false):
 * - facebook_personal, instagram_personal, linkedin_personal
 */
export type AccountType =
// Facebook
    | 'facebook_page'
    | 'facebook_personal'
    // Instagram
    | 'instagram_business'
    | 'instagram_creator'
    | 'instagram_personal'
    // LinkedIn
    | 'linkedin_company'
    | 'linkedin_personal'
    | 'linkedin_profile';  // Alias dla linkedin_personal (kompatybilność)

export type ConnectionStatus = 'connected' | 'disconnected' | 'expired' | 'error';

export type PublishMethod = 'auto' | 'share_dialog' | 'manual_copy';

// ==================== Account Type Sets ====================

export const BUSINESS_ACCOUNT_TYPES: AccountType[] = [
    'facebook_page',
    'instagram_business',
    'instagram_creator',
    'linkedin_company',
];

export const PERSONAL_ACCOUNT_TYPES: AccountType[] = [
    'facebook_personal',
    'instagram_personal',
    'linkedin_personal',
    'linkedin_profile',
];

// ==================== Account Capabilities ====================

export interface AccountCapabilities {
    platform: SocialPlatform;
    is_business: boolean;
    supports_auto_publish: boolean;
    supports_autopilot: boolean;
    supports_images: boolean;
    supports_videos: boolean;
    supports_links: boolean;
    supports_scheduling: boolean;
    supports_share_dialog: boolean;
    supports_deeplink: boolean;
    max_text_length: number;
    max_hashtags?: number;
    requires_image: boolean;
    display_name: string;
    description: string;
    icon: string;
    publish_method: PublishMethod;
}

export const ACCOUNT_CAPABILITIES: Record<AccountType, AccountCapabilities> = {
    // === FACEBOOK ===
    facebook_page: {
        platform: 'facebook',
        is_business: true,
        supports_auto_publish: true,
        supports_autopilot: true,
        supports_images: true,
        supports_videos: true,
        supports_links: true,
        supports_scheduling: true,
        supports_share_dialog: false,
        supports_deeplink: true,
        max_text_length: 63206,
        requires_image: false,
        display_name: 'Strona Facebook',
        description: 'Pełny dostęp do automatycznej publikacji',
        icon: 'facebook-page',
        publish_method: 'auto',
    },
    facebook_personal: {
        platform: 'facebook',
        is_business: false,
        supports_auto_publish: false,
        supports_autopilot: false,
        supports_images: true,
        supports_videos: true,
        supports_links: true,
        supports_scheduling: false,
        supports_share_dialog: true,
        supports_deeplink: true,
        max_text_length: 63206,
        requires_image: false,
        display_name: 'Profil Facebook',
        description: 'Publikacja przez okno udostępniania',
        icon: 'facebook-profile',
        publish_method: 'share_dialog',
    },

    // === INSTAGRAM ===
    instagram_business: {
        platform: 'instagram',
        is_business: true,
        supports_auto_publish: true,
        supports_autopilot: true,
        supports_images: true,
        supports_videos: true,
        supports_links: false,
        supports_scheduling: true,
        supports_share_dialog: false,
        supports_deeplink: true,
        max_text_length: 2200,
        max_hashtags: 30,
        requires_image: true,
        display_name: 'Instagram Business',
        description: 'Pełny dostęp do automatycznej publikacji',
        icon: 'instagram-business',
        publish_method: 'auto',
    },
    instagram_creator: {
        platform: 'instagram',
        is_business: true,
        supports_auto_publish: true,
        supports_autopilot: true,
        supports_images: true,
        supports_videos: true,
        supports_links: false,
        supports_scheduling: true,
        supports_share_dialog: false,
        supports_deeplink: true,
        max_text_length: 2200,
        max_hashtags: 30,
        requires_image: true,
        display_name: 'Instagram Creator',
        description: 'Pełny dostęp do automatycznej publikacji',
        icon: 'instagram-creator',
        publish_method: 'auto',
    },
    instagram_personal: {
        platform: 'instagram',
        is_business: false,
        supports_auto_publish: false,
        supports_autopilot: false,
        supports_images: true,
        supports_videos: true,
        supports_links: false,
        supports_scheduling: false,
        supports_share_dialog: false,
        supports_deeplink: true,
        max_text_length: 2200,
        max_hashtags: 30,
        requires_image: true,
        display_name: 'Instagram (osobiste)',
        description: 'Kopiuj treść i opublikuj ręcznie w aplikacji',
        icon: 'instagram-personal',
        publish_method: 'manual_copy',
    },

    // === LINKEDIN ===
    linkedin_company: {
        platform: 'linkedin',
        is_business: true,
        supports_auto_publish: true,
        supports_autopilot: true,
        supports_images: true,
        supports_videos: false,
        supports_links: true,
        supports_scheduling: true,
        supports_share_dialog: false,
        supports_deeplink: true,
        max_text_length: 3000,
        requires_image: false,
        display_name: 'Strona firmowa LinkedIn',
        description: 'Pełny dostęp do automatycznej publikacji',
        icon: 'linkedin-company',
        publish_method: 'auto',
    },
    linkedin_personal: {
        platform: 'linkedin',
        is_business: false,
        supports_auto_publish: false,
        supports_autopilot: false,
        supports_images: true,
        supports_videos: false,
        supports_links: true,
        supports_scheduling: false,
        supports_share_dialog: true,
        supports_deeplink: true,
        max_text_length: 3000,
        requires_image: false,
        display_name: 'Profil LinkedIn',
        description: 'Publikacja przez okno udostępniania',
        icon: 'linkedin-profile',
        publish_method: 'share_dialog',
    },
    // Alias dla kompatybilności wstecznej
    linkedin_profile: {
        platform: 'linkedin',
        is_business: false,
        supports_auto_publish: false,
        supports_autopilot: false,
        supports_images: true,
        supports_videos: false,
        supports_links: true,
        supports_scheduling: false,
        supports_share_dialog: true,
        supports_deeplink: true,
        max_text_length: 3000,
        requires_image: false,
        display_name: 'Profil LinkedIn',
        description: 'Publikacja przez okno udostępniania',
        icon: 'linkedin-profile',
        publish_method: 'share_dialog',
    },
};

// ==================== Platform Info ====================

export interface PlatformInfo {
    platform: SocialPlatform;
    name: string;
    is_configured: boolean;
    color: string;
    icon: string;
}

export const PLATFORMS: PlatformInfo[] = [
    {
        platform: 'facebook',
        name: 'Facebook',
        is_configured: true,
        color: '#1877F2',
        icon: 'Facebook',
    },
    {
        platform: 'instagram',
        name: 'Instagram',
        is_configured: true,
        color: '#E4405F',
        icon: 'Instagram',
    },
    {
        platform: 'linkedin',
        name: 'LinkedIn',
        is_configured: true,
        color: '#0A66C2',
        icon: 'Linkedin',
    },
];

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
    is_business_account: boolean;
    supports_auto_publish: boolean;
    supports_autopilot: boolean;
    supports_images: boolean;
    supports_videos: boolean;
    supports_links: boolean;
    supports_scheduling: boolean;
    max_text_length: number;
    requires_image: boolean;
    display_name: string;
    publish_method: PublishMethod;
}

export interface ListAccountsResponse {
    accounts: ConnectedAccount[];
    total: number;
    has_business_account: boolean;
    has_personal_account: boolean;
    access_level: 'full' | 'limited' | 'demo';
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

    // Dodatkowe info o typie konta
    is_business_account: boolean;
    supports_auto_publish: boolean;
    supports_autopilot: boolean;
    display_name?: string;

    // Info dla onboardingu
    upgrade_message?: string;

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

    // Dla kont osobistych
    requires_manual_publish: boolean;
    share_dialog_url?: string;
    deeplink_url?: string;
    manual_instructions?: string[];

    error?: string;
    error_code?: string;
}

export interface RefreshTokenResponse {
    success: boolean;
    expires_at?: string;
    error?: string;
}

// ==================== Manual Publish ====================

export interface ManualPublishInfo {
    platform: SocialPlatform;
    account_type: AccountType;
    content: string;
    hashtags?: string;
    share_dialog_url?: string;
    deeplink_url?: string;
    web_url?: string;
    instructions: string[];
}

// ==================== Helper Functions ====================

export function isBusinessAccountType(accountType: AccountType): boolean {
    return BUSINESS_ACCOUNT_TYPES.includes(accountType);
}

export function isPersonalAccountType(accountType: AccountType): boolean {
    return PERSONAL_ACCOUNT_TYPES.includes(accountType);
}

export function getAccountCapabilities(accountType: AccountType): AccountCapabilities {
    return ACCOUNT_CAPABILITIES[accountType];
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
    return ACCOUNT_CAPABILITIES[accountType]?.display_name ?? accountType;
}