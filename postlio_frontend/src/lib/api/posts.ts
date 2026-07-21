// src/lib/api/posts.ts
/**
 * Posts API Layer
 *
 * CRUD operacje na postach + scheduling.
 * Obsługa wielu platform na post.
 */

import { apiClient } from './client';
import type { Post, PostStatus, CalendarEvent } from '@/types/post';
import type { Platform } from '@/types';

// ============================================================
// TYPY REQUEST
// ============================================================

/**
 * Request do tworzenia posta - WIELE PLATFORM
 */
export interface CreatePostRequest {
    content: string;
    platforms: Platform[];                        // ← ZMIANA: array
    brand_id?: number;
    image_url?: string;
    image_prompt?: string;
    scheduled_at?: string;
    ai_generated?: boolean;
    ai_model?: string;
    generation_params?: Record<string, unknown>;
}

/**
 * Request do aktualizacji posta
 */
export interface UpdatePostRequest {
    content?: string;
    platforms?: Platform[];                       // ← ZMIANA: array
    brand_id?: number;
    image_url?: string;
    image_prompt?: string;
    status?: PostStatus;
    scheduled_at?: string | null;
    platform_statuses?: Record<string, {
        status: string;
        published_at?: string | null;
        platform_post_id?: string | null;
    }>;
}

/**
 * Request do aktualizacji statusu platformy
 */
export interface UpdatePlatformStatusRequest {
    platform: Platform;
    status: 'draft' | 'published' | 'failed';
    platform_post_id?: string;
}

export interface PostsListParams {
    page?: number;
    limit?: number;
    offset?: number;
    status?: PostStatus;
    platform?: Platform;
    brand_id?: number;
    from_date?: string;
    to_date?: string;
    search?: string;
}

export interface PostsListResponse {
    posts: Post[];
    count: number;
}

export interface SchedulePostRequest {
    scheduled_at: string;
}

export interface BulkActionRequest {
    post_ids: string[];
    action: 'delete' | 'archive' | 'schedule' | 'publish';
    scheduled_at?: string;
}

export interface CalendarEventsParams {
    start_date: string;
    end_date: string;
    brand_id?: string;
}

// ============================================================
// API FUNCTIONS
// ============================================================

/**
 * Pobierz listę postów
 */
export async function getPosts(
    params?: PostsListParams
): Promise<PostsListResponse> {
    const searchParams = new URLSearchParams();

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });
    }

    const query = searchParams.toString();
    return apiClient.get<PostsListResponse>(`/posts${query ? `?${query}` : ''}`);
}

/**
 * Pobierz pojedynczy post
 */
export async function getPost(id: string): Promise<Post> {
    return apiClient.get<Post>(`/posts/${id}`);
}

/**
 * Utwórz nowy post
 */
export async function createPost(data: CreatePostRequest): Promise<Post> {
    return apiClient.post<Post>('/posts/', data);
}

/**
 * Aktualizuj post
 */
export async function updatePost(
    id: string,
    data: UpdatePostRequest
): Promise<Post> {
    return apiClient.patch<Post>(`/posts/${id}`, data);
}

/**
 * Aktualizuj status platformy
 */
export async function updatePlatformStatus(
    postId: string,
    data: UpdatePlatformStatusRequest
): Promise<Post> {
    return apiClient.patch<Post>(`/posts/${postId}/platform-status`, data);
}

/**
 * Usuń post
 */
export async function deletePost(id: string): Promise<void> {
    return apiClient.delete(`/posts/${id}`);
}

/**
 * Zaplanuj post
 */
export async function schedulePost(
    postId: string,
    data: SchedulePostRequest
): Promise<Post> {
    return apiClient.post<Post>(`/posts/${postId}/schedule`, data);
}

/**
 * Opublikuj post natychmiast
 */
export async function publishPost(id: string): Promise<Post> {
    return apiClient.post<Post>(`/posts/${id}/publish`);
}

/**
 * Akcje bulk na postach
 */
export async function bulkAction(data: BulkActionRequest): Promise<void> {
    return apiClient.post('/posts/bulk', data);
}

/**
 * Pobierz eventy do kalendarza
 */
export async function getCalendarEvents(
    params: CalendarEventsParams
): Promise<CalendarEvent[]> {
    const searchParams = new URLSearchParams({
        start_date: params.start_date,
        end_date: params.end_date,
    });

    if (params.brand_id) {
        searchParams.append('brand_id', params.brand_id);
    }

    return apiClient.get<CalendarEvent[]>(`/posts/calendar?${searchParams}`);
}

/**
 * Duplikuj post
 */
export async function duplicatePost(id: string): Promise<Post> {
    return apiClient.post<Post>(`/posts/${id}/duplicate`);
}

export interface LinkPreview {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    site_name?: string;
}

/**
 * Pobierz metadane Open Graph dla URL wklejonego w edytorze.
 */
export async function getLinkPreview(url: string): Promise<LinkPreview> {
    const searchParams = new URLSearchParams({ url });
    return apiClient.get<LinkPreview>(`/posts/link-preview?${searchParams}`);
}

// ============================================================
// EXPORT ZBIORCZY
// ============================================================

export const postsApi = {
    getPosts,
    getPost,
    createPost,
    updatePost,
    updatePlatformStatus,
    deletePost,
    schedulePost,
    publishPost,
    bulkAction,
    getCalendarEvents,
    duplicatePost,
    getLinkPreview,
};

export default postsApi;