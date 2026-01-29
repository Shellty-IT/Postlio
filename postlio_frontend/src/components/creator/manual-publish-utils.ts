// src/components/creator/manual-publish-utils.ts
/**
 * Utility functions for manual publishing
 */

import type { Platform } from '@/types';
import type { ManualPublishData } from '@/types/autopilot';

interface CreateManualPublishDataParams {
    id: number;
    content: string;
    hashtags?: string[];
    image_url: string | null;
    platform: Platform;
}

/**
 * Tworzy dane dla modalu ręcznej publikacji
 */
export function createManualPublishData(params: CreateManualPublishDataParams): ManualPublishData {
    const { id, content, hashtags = [], image_url, platform } = params;

    // Przygotuj hashtagi jako string
    const hashtagsFormatted = hashtags.map(h => h.startsWith('#') ? h : `#${h}`);
    const hashtagsString = hashtagsFormatted.join(' ');

    // Pełna treść z hashtagami
    const fullContent = hashtagsString
        ? `${content}\n\n${hashtagsString}`
        : content;

    // Linki do platform
    const platformLinks: Record<Platform, string> = {
        facebook: 'https://www.facebook.com',
        instagram: 'https://www.instagram.com',
        linkedin: 'https://www.linkedin.com/feed/',
    };

    // Share URL (dla Facebook i LinkedIn)
    const getShareUrl = (): string | undefined => {
        if (platform === 'facebook') {
            return `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(fullContent)}`;
        }
        if (platform === 'linkedin') {
            return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://postlio.app')}&summary=${encodeURIComponent(fullContent)}`;
        }
        return undefined;
    };

    // Instrukcje per platforma
    const getInstructions = (): string => {
        switch (platform) {
            case 'facebook':
                return '1. Skopiuj treść posta\n2. Otwórz Facebook\n3. Kliknij "Napisz post"\n4. Wklej treść\n5. Dodaj zdjęcie (jeśli jest)\n6. Opublikuj';
            case 'instagram':
                return '1. Pobierz zdjęcie\n2. Otwórz aplikację Instagram\n3. Kliknij + (nowy post)\n4. Wybierz pobrane zdjęcie\n5. Wklej opis\n6. Opublikuj';
            case 'linkedin':
                return '1. Skopiuj treść posta\n2. Otwórz LinkedIn\n3. Kliknij "Rozpocznij post"\n4. Wklej treść\n5. Dodaj zdjęcie (jeśli jest)\n6. Opublikuj';
            default:
                return '1. Skopiuj treść\n2. Otwórz platformę\n3. Wklej i opublikuj';
        }
    };

    return {
        item_id: id,
        content,
        full_content: fullContent,
        hashtags: hashtagsFormatted,
        hashtags_string: hashtagsString,
        image_url,
        platform,
        platform_link: platformLinks[platform],
        instructions: getInstructions(),
        share_url: getShareUrl(),
    };
}