// src/lib/api/posts.ts
/**
 * Posts API Layer
 *
 * CRUD operacje na postach + scheduling.
 */

import { apiClient } from './client';
import type { Post, Platform, PostStatus } from '@/types';

// ============================================================
// TYPY
// ============================================================

export interface CreatePostRequest {
    content: string;
    platforms: Platform[];
    brand_id?: string;
    scheduled_at?: string; // ISO date string
    media_urls?: string[];
    hashtags?: string[];
    status?: PostStatus;
    ai_generated?: boolean;
    ai_provider?: string;
}

export interface UpdatePostRequest {
    content?: string;
    platforms?: Platform[];
    scheduled_at?: string | null;
    media_urls?: string[];
    hashtags?: string[];
    status?: PostStatus;
}

export interface PostsListParams {
    page?: number;
    limit?: number;
    status?: PostStatus;
    platform?: Platform;
    brand_id?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
}

export interface PostsListResponse {
    posts: Post[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export interface SchedulePostRequest {
    post_id: string;
    scheduled_at: string;
    platforms: Platform[];
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

export interface CalendarEvent {
    id: string;
    post_id: string;
    title: string;
    date: string;
    time: string;
    platforms: Platform[];
    status: PostStatus;
    preview?: string;
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
    return apiClient.post<Post>('/posts', data);
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
 * Usuń post
 */
export async function deletePost(id: string): Promise<void> {
    return apiClient.delete(`/posts/${id}`);
}

/**
 * Zaplanuj post
 */
export async function schedulePost(
    data: SchedulePostRequest
): Promise<Post> {
    return apiClient.post<Post>(`/posts/${data.post_id}/schedule`, {
        scheduled_at: data.scheduled_at,
        platforms: data.platforms,
    });
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

// ============================================================
// EXPORT ZBIORCZY
// ============================================================

export const postsApi = {
    getPosts,
    getPost,
    createPost,
    updatePost,
    deletePost,
    schedulePost,
    publishPost,
    bulkAction,
    getCalendarEvents,
    duplicatePost,
};

export default postsApi;