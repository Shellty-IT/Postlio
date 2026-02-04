// src/types/post.ts
/**
 * Typy dla postów - obsługa wielu platform
 */

import type { Platform } from './index';

// ============================================================
// STATUS TYPES
// ============================================================

export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';

// ============================================================
// PLATFORM STATUS (per platforma)
// ============================================================

export interface PlatformStatusDetail {
    status: PostStatus;
    published_at: string | null;
    platform_post_id: string | null;
}

export type PlatformStatuses = Record<Platform, PlatformStatusDetail>;

// ============================================================
// POST
// ============================================================

export interface Post {
    id: number;
    user_id: number;
    brand_id: number | null;

    content: string;
    image_url: string | null;
    image_prompt: string | null;

    // Nowe pola - wiele platform
    platforms: Platform[];
    platform_statuses: Partial<PlatformStatuses>;

    // Legacy - dla kompatybilności wstecznej
    platform: Platform | null;
    platform_post_id: string | null;

    status: PostStatus;
    scheduled_at: string | null;
    published_at: string | null;

    ai_generated: boolean;
    ai_model: string | null;
    generation_params: Record<string, unknown> | null;

    likes: number;
    comments: number;
    shares: number;

    created_at: string;
    updated_at: string;

    // Computed
    hashtags: string[];
}

// ============================================================
// CALENDAR EVENT
// ============================================================

export interface CalendarEvent {
    id: string;
    post_id: string;
    title: string;
    date: string;
    time: string;
    platforms: Platform[];
    platform_statuses: Partial<PlatformStatuses>;
    status: PostStatus;
    preview: string | null;
    image_url: string | null;
    brand_id: number | null;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Sprawdza czy post jest w pełni opublikowany (wszystkie platformy)
 */
export function isFullyPublished(post: Post): boolean {
    if (!post.platforms || post.platforms.length === 0) return false;

    return post.platforms.every(platform =>
        post.platform_statuses[platform]?.status === 'published'
    );
}

/**
 * Zwraca listę platform, które jeszcze nie są opublikowane
 */
export function getUnpublishedPlatforms(post: Post): Platform[] {
    if (!post.platforms) return [];

    return post.platforms.filter(platform =>
        post.platform_statuses[platform]?.status !== 'published'
    );
}

/**
 * Zwraca ogólny status na podstawie statusów platform
 */
export function getOverallStatus(post: Post): PostStatus {
    if (!post.platforms || post.platforms.length === 0) {
        return post.status;
    }

    const statuses = post.platforms.map(p =>
        post.platform_statuses[p]?.status || 'draft'
    );

    if (statuses.every(s => s === 'published')) return 'published';
    if (statuses.some(s => s === 'failed')) return 'failed';
    if (statuses.some(s => s === 'publishing')) return 'publishing';
    if (statuses.some(s => s === 'scheduled')) return 'scheduled';
    return 'draft';
}