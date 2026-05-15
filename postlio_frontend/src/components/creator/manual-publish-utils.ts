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
    facebook: `1. Skopiuj treść posta (przycisk powyżej)
2. Kliknij "Udostępnij na Facebook" lub otwórz Facebook ręcznie
3. Kliknij "Napisz post" lub "Co słychać?"
4. Wklej skopiowaną treść (Ctrl+V / Cmd+V)
5. Jeśli jest zdjęcie - dodaj je (przycisk "Zdjęcie/Wideo")
6. Kliknij "Opublikuj"
7. Wróć tutaj i kliknij "Opublikowałem"`,

    instagram: `1. Pobierz zdjęcie (przycisk powyżej) - Instagram wymaga zdjęcia!
2. Skopiuj treść posta
3. Otwórz aplikację Instagram na telefonie
4. Kliknij + (nowy post) na dole ekranu
5. Wybierz pobrane zdjęcie z galerii
6. Kliknij "Dalej", dodaj filtry jeśli chcesz
7. Wklej skopiowany opis
8. Kliknij "Udostępnij"
9. Wróć tutaj i kliknij "Opublikowałem"`,

    linkedin: `1. Skopiuj treść posta (przycisk powyżej)
2. Kliknij "Udostępnij na LinkedIn" lub otwórz LinkedIn ręcznie
3. Kliknij "Rozpocznij post"
4. Wklej skopiowaną treść (Ctrl+V / Cmd+V)
5. Jeśli jest zdjęcie - kliknij ikonę obrazka i dodaj
6. Kliknij "Opublikuj"
7. Wróć tutaj i kliknij "Opublikowałem"`,
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getShareUrl(platform: Platform, content: string): string | undefined {
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