// src/components/creator/manual-publish-utils.ts
/**
 * Utility functions for manual publishing
 *
 * ✅ ROZSZERZONE: Obsługa wielu platform
 */

import type { Platform } from '@/types';
import type { ManualPublishData, MultiPlatformPublishData } from '@/types/autopilot';

// ============================================================
// TYPES
// ============================================================

interface CreateManualPublishDataParams {
    id: number;
    post_id?: number;
    content: string;
    hashtags?: string[];
    image_url: string | null;
    platform: Platform;
}

interface CreateMultiPlatformPublishDataParams {
    id: number;
    post_id?: number;
    content: string;
    hashtags?: string[];
    image_url: string | null;
    platforms: Platform[];
}

// ============================================================
// PLATFORM CONFIG
// ============================================================

const PLATFORM_LINKS: Record<Platform, string> = {
    facebook: 'https://www.facebook.com',
    instagram: 'https://www.instagram.com',
    linkedin: 'https://www.linkedin.com/feed/',
};

const PLATFORM_INSTRUCTIONS: Record<Platform, string> = {
    facebook: `1. Kliknij duży przycisk powyżej - skopiuje treść i otworzy Facebooka (lub od razu pokaże listę aplikacji)
2. Jeśli wracasz do ręcznego wklejania: wklej treść (Ctrl+V) w nowym poście
3. Dodaj zdjęcie, jeśli je pobrano
4. Opublikuj i wróć tutaj, klikając "Opublikowałem"`,

    instagram: `1. Kliknij duży przycisk powyżej - skopiuje treść i zapisze zdjęcie w galerii (Instagram wymaga zdjęcia!)
2. W aplikacji Instagram: nowy post → wybierz zapisane zdjęcie
3. Wklej skopiowany opis
4. Opublikuj i wróć tutaj, klikając "Opublikowałem"`,

    linkedin: `1. Kliknij duży przycisk powyżej - skopiuje treść i otworzy LinkedIn
2. Jeśli wracasz do ręcznego wklejania: wklej treść (Ctrl+V) w nowym poście
3. Dodaj zdjęcie, jeśli je pobrano
4. Opublikuj i wróć tutaj, klikając "Opublikowałem"`,
};

// Deeplinki do aplikacji mobilnych - na desktopie po prostu nic nie robia (cicho zawodza),
// dlatego uzywamy ich tylko gdy wykryjemy viewport mobilny.
const PLATFORM_DEEPLINKS: Record<Platform, string> = {
    facebook: 'fb://feed',
    instagram: 'instagram://camera',
    linkedin: 'linkedin://feed',
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Wybiera URL, ktory ma otworzyc przycisk "jednego klikniecia" po skopiowaniu
 * tresci: deeplink do aplikacji mobilnej na telefonie (jesli jest dostepny),
 * w przeciwnym razie Share Dialog danej platformy (Facebook/LinkedIn), a dla
 * Instagrama (ktory nie ma web share URL) - zwykla strona instagram.com.
 *
 * Wydzielone jako czysta funkcja (bez window.open/fetch), zeby dalo sie
 * przetestowac samą logikę wyboru bez mockowania DOM-u.
 */
export function resolveManualPublishTarget(params: {
    platform: Platform;
    isMobileViewport: boolean;
    shareUrl?: string;
}): string | undefined {
    const { platform, isMobileViewport, shareUrl } = params;

    if (isMobileViewport) {
        return PLATFORM_DEEPLINKS[platform];
    }

    return shareUrl ?? (platform === 'instagram' ? PLATFORM_LINKS.instagram : undefined);
}

export function getShareUrl(platform: Platform, content: string): string | undefined {
    const encodedContent = encodeURIComponent(content);

    switch (platform) {
        case 'facebook':
            return `https://www.facebook.com/sharer/sharer.php?quote=${encodedContent}`;
        case 'linkedin':
            return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://postlio.app')}&summary=${encodedContent}`;
        case 'instagram':
            // Instagram nie ma web share URL
            return undefined;
        default:
            return undefined;
    }
}

function formatHashtags(hashtags: string[]): string[] {
    return hashtags.map(h => h.startsWith('#') ? h : `#${h}`);
}

function createFullContent(content: string, hashtags: string[]): string {
    const formattedHashtags = formatHashtags(hashtags);
    const hashtagsString = formattedHashtags.join(' ');
    return hashtagsString ? `${content}\n\n${hashtagsString}` : content;
}

// ============================================================
// SINGLE PLATFORM (backward compatibility)
// ============================================================

/**
 * Tworzy dane dla modalu ręcznej publikacji - JEDNA platforma
 */
export function createManualPublishData(params: CreateManualPublishDataParams): ManualPublishData {
    const { id, post_id, content, hashtags = [], image_url, platform } = params;

    const hashtagsFormatted = formatHashtags(hashtags);
    const hashtagsString = hashtagsFormatted.join(' ');
    const fullContent = createFullContent(content, hashtags);

    return {
        item_id: id,
        post_id,
        content,
        full_content: fullContent,
        hashtags: hashtagsFormatted,
        hashtags_string: hashtagsString,
        image_url,
        platform,
        platform_link: PLATFORM_LINKS[platform],
        instructions: PLATFORM_INSTRUCTIONS[platform],
        share_url: getShareUrl(platform, fullContent),
    };
}

// ============================================================
// MULTI-PLATFORM
// ============================================================

/**
 * Tworzy dane dla modalu ręcznej publikacji - WIELE platform
 */
export function createMultiPlatformPublishData(params: CreateMultiPlatformPublishDataParams): MultiPlatformPublishData {
    const { id, post_id, content, hashtags = [], image_url, platforms } = params;

    const platformData: MultiPlatformPublishData['platformData'] = {} as MultiPlatformPublishData['platformData'];

    for (const platform of platforms) {
        const hashtagsFormatted = formatHashtags(hashtags);
        const hashtagsString = hashtagsFormatted.join(' ');
        const fullContent = createFullContent(content, hashtags);

        platformData[platform] = {
            content,
            full_content: fullContent,
            hashtags: hashtagsFormatted,
            hashtags_string: hashtagsString,
            image_url,
            platform_link: PLATFORM_LINKS[platform],
            instructions: PLATFORM_INSTRUCTIONS[platform],
            share_url: getShareUrl(platform, fullContent),
            status: 'pending',
        };
    }

    return {
        item_id: id,
        post_id,
        platforms,
        platformData,
        image_url,
    };
}

/**
 * Sprawdza czy wszystkie platformy zostały opublikowane
 */
export function areAllPlatformsPublished(data: MultiPlatformPublishData): boolean {
    return data.platforms.every(platform =>
        data.platformData[platform]?.status === 'published'
    );
}

/**
 * Zwraca liczbę opublikowanych platform
 */
export function getPublishedPlatformsCount(data: MultiPlatformPublishData): number {
    return data.platforms.filter(platform =>
        data.platformData[platform]?.status === 'published'
    ).length;
}

/**
 * Zwraca platformy, które jeszcze nie zostały opublikowane
 */
export function getPendingPlatforms(data: MultiPlatformPublishData): Platform[] {
    return data.platforms.filter(platform =>
        data.platformData[platform]?.status === 'pending'
    );
}