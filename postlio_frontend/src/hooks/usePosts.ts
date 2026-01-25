// src/hooks/usePosts.ts
/**
 * Hook do zarządzania postami
 *
 * Obsługuje: CRUD, scheduling, kalendarz, bulk actions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { postsApi, ApiException } from '@/lib/api';
import type {
    CreatePostRequest,
    UpdatePostRequest,
    PostsListParams,
    BulkActionRequest,
    CalendarEventsParams,
} from '@/lib/api';
import type { Post } from '@/types';

// ============================================================
// QUERY KEYS
// ============================================================

export const postsKeys = {
    all: ['posts'] as const,
    lists: () => [...postsKeys.all, 'list'] as const,
    list: (params?: PostsListParams) => [...postsKeys.lists(), params] as const,
    details: () => [...postsKeys.all, 'detail'] as const,
    detail: (id: string) => [...postsKeys.details(), id] as const,
    calendar: (params: CalendarEventsParams) => [...postsKeys.all, 'calendar', params] as const,
};

// ============================================================
// HOOK: usePosts
// ============================================================

/**
 * Pobiera listę postów z filtrowaniem i paginacją
 */
export function usePosts(params?: PostsListParams) {
    return useQuery({
        queryKey: postsKeys.list(params),
        queryFn: () => postsApi.getPosts(params),
        staleTime: 2 * 60 * 1000, // 2 minuty
    });
}

// ============================================================
// HOOK: usePost
// ============================================================

/**
 * Pobiera pojedynczy post
 */
export function usePost(id: string) {
    return useQuery({
        queryKey: postsKeys.detail(id),
        queryFn: () => postsApi.getPost(id),
        enabled: !!id,
    });
}

// ============================================================
// HOOK: useCalendarPosts
// ============================================================

/**
 * Pobiera posty do kalendarza
 */
export function useCalendarPosts(params: CalendarEventsParams) {
    return useQuery({
        queryKey: postsKeys.calendar(params),
        queryFn: () => postsApi.getCalendarEvents(params),
        enabled: !!params.start_date && !!params.end_date,
        staleTime: 60 * 1000, // 1 minuta
    });
}

// ============================================================
// HOOK: useCreatePost
// ============================================================

interface UseCreatePostOptions {
    onSuccess?: (post: Post) => void;
}

/**
 * Tworzenie nowego posta
 */
export function useCreatePost(options?: UseCreatePostOptions) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePostRequest) => postsApi.createPost(data),
        onSuccess: (post) => {
            // Invalidate listy postów
            void queryClient.invalidateQueries({ queryKey: postsKeys.lists() });

            const statusMessage = post.status === 'scheduled'
                ? 'zaplanowany'
                : post.status === 'draft'
                    ? 'zapisany jako szkic'
                    : 'utworzony';

            toast.success(`Post ${statusMessage}!`, {
                description: post.scheduled_at
                    ? `Publikacja: ${new Date(post.scheduled_at).toLocaleString('pl-PL')}`
                    : undefined,
            });

            options?.onSuccess?.(post);
        },
        onError: (error: Error) => {
            const message = error instanceof ApiException
                ? error.message
                : 'Nie udało się utworzyć posta';

            toast.error('Błąd tworzenia posta', { description: message });
        },
    });
}

// ============================================================
// HOOK: useUpdatePost
// ============================================================

interface UseUpdatePostOptions {
    onSuccess?: (post: Post) => void;
}

/**
 * Aktualizacja posta
 */
export function useUpdatePost(options?: UseUpdatePostOptions) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdatePostRequest }) =>
            postsApi.updatePost(id, data),
        onMutate: async ({ id, data }) => {
            // Optimistic update
            await queryClient.cancelQueries({ queryKey: postsKeys.detail(id) });

            const previousPost = queryClient.getQueryData<Post>(postsKeys.detail(id));

            if (previousPost) {
                // Konwertuj null na undefined dla scheduled_at
                const updatedData = {
                    ...data,
                    scheduled_at: data.scheduled_at === null ? undefined : data.scheduled_at,
                };

                queryClient.setQueryData<Post>(postsKeys.detail(id), {
                    ...previousPost,
                    ...updatedData,
                } as Post);
            }

            return { previousPost };
        },
        onSuccess: (post) => {
            void queryClient.invalidateQueries({ queryKey: postsKeys.lists() });
            void queryClient.invalidateQueries({ queryKey: postsKeys.detail(String(post.id)) });

            toast.success('Post zaktualizowany!');

            options?.onSuccess?.(post);
        },
        onError: (error: Error, { id }, context) => {
            // Rollback optimistic update
            if (context?.previousPost) {
                queryClient.setQueryData(postsKeys.detail(id), context.previousPost);
            }

            const message = error instanceof ApiException
                ? error.message
                : 'Nie udało się zaktualizować posta';

            toast.error('Błąd aktualizacji', { description: message });
        },
    });
}

// ============================================================
// HOOK: useDeletePost
// ============================================================

interface UseDeletePostOptions {
    onSuccess?: () => void;
}

/**
 * Usuwanie posta
 */
export function useDeletePost(options?: UseDeletePostOptions) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => postsApi.deletePost(id),
        onSuccess: (_, id) => {
            void queryClient.invalidateQueries({ queryKey: postsKeys.lists() });
            queryClient.removeQueries({ queryKey: postsKeys.detail(id) });

            toast.success('Post usunięty');

            options?.onSuccess?.();
        },
        onError: (error: Error) => {
            const message = error instanceof ApiException
                ? error.message
                : 'Nie udało się usunąć posta';

            toast.error('Błąd usuwania', { description: message });
        },
    });
}

// ============================================================
// HOOK: useSchedulePost
// ============================================================

interface SchedulePostParams {
    postId: string;
    scheduledAt: string;
}

/**
 * Planowanie posta
 */
export function useSchedulePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, scheduledAt }: SchedulePostParams) =>
            postsApi.schedulePost(postId, { scheduled_at: scheduledAt }),
        onSuccess: (post) => {
            void queryClient.invalidateQueries({ queryKey: postsKeys.lists() });
            void queryClient.invalidateQueries({ queryKey: postsKeys.detail(String(post.id)) });

            toast.success('Post zaplanowany!', {
                description: post.scheduled_at
                    ? `Publikacja: ${new Date(post.scheduled_at).toLocaleString('pl-PL')}`
                    : undefined,
            });
        },
        onError: (error: Error) => {
            const message = error instanceof ApiException
                ? error.message
                : 'Nie udało się zaplanować posta';

            toast.error('Błąd planowania', { description: message });
        },
    });
}

// ============================================================
// HOOK: usePublishPost
// ============================================================

/**
 * Natychmiastowa publikacja posta
 */
export function usePublishPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => postsApi.publishPost(id),
        onSuccess: (post) => {
            void queryClient.invalidateQueries({ queryKey: postsKeys.lists() });
            void queryClient.invalidateQueries({ queryKey: postsKeys.detail(String(post.id)) });

            toast.success('Post opublikowany!', {
                description: `Platforma: ${post.platform}`,
            });
        },
        onError: (error: Error) => {
            const message = error instanceof ApiException
                ? error.message
                : 'Nie udało się opublikować posta';

            toast.error('Błąd publikacji', { description: message });
        },
    });
}

// ============================================================
// HOOK: useDuplicatePost
// ============================================================

/**
 * Duplikowanie posta
 */
export function useDuplicatePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => postsApi.duplicatePost(id),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: postsKeys.lists() });

            toast.success('Post zduplikowany!', {
                description: 'Utworzono kopię jako szkic',
            });
        },
        onError: (error: Error) => {
            const message = error instanceof ApiException
                ? error.message
                : 'Nie udało się zduplikować posta';

            toast.error('Błąd duplikowania', { description: message });
        },
    });
}

// ============================================================
// HOOK: useBulkPostsAction
// ============================================================

/**
 * Akcje bulk na postach
 */
export function useBulkPostsAction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: BulkActionRequest) => postsApi.bulkAction(data),
        onSuccess: (_, { action, post_ids }) => {
            void queryClient.invalidateQueries({ queryKey: postsKeys.lists() });

            const actionLabels: Record<string, string> = {
                delete: 'usunięto',
                archive: 'zarchiwizowano',
                schedule: 'zaplanowano',
                publish: 'opublikowano',
            };

            toast.success(`Posty ${actionLabels[action] || action}`, {
                description: `Liczba: ${post_ids.length}`,
            });
        },
        onError: (error: Error) => {
            const message = error instanceof ApiException
                ? error.message
                : 'Nie udało się wykonać akcji';

            toast.error('Błąd akcji zbiorczej', { description: message });
        },
    });
}

// ============================================================
// HOOK: usePostsManager (kombinowany)
// ============================================================

/**
 * Główny hook postów - do podstawowego użycia
 */
export function usePostsManager(params?: PostsListParams) {
    const posts = usePosts(params);
    const createPost = useCreatePost();
    const updatePost = useUpdatePost();
    const deletePost = useDeletePost();
    const schedulePost = useSchedulePost();
    const publishPost = usePublishPost();
    const duplicatePost = useDuplicatePost();

    return {
        // Dane
        posts: posts.data?.posts || [],
        count: posts.data?.count || 0,
        isLoading: posts.isLoading,
        isError: posts.isError,
        error: posts.error,
        refetch: posts.refetch,

        // Mutacje
        create: createPost.mutate,
        createAsync: createPost.mutateAsync,
        isCreating: createPost.isPending,

        update: updatePost.mutate,
        updateAsync: updatePost.mutateAsync,
        isUpdating: updatePost.isPending,

        delete: deletePost.mutate,
        deleteAsync: deletePost.mutateAsync,
        isDeleting: deletePost.isPending,

        schedule: schedulePost.mutate,
        scheduleAsync: schedulePost.mutateAsync,
        isScheduling: schedulePost.isPending,

        publish: publishPost.mutate,
        publishAsync: publishPost.mutateAsync,
        isPublishing: publishPost.isPending,

        duplicate: duplicatePost.mutate,
        duplicateAsync: duplicatePost.mutateAsync,
        isDuplicating: duplicatePost.isPending,
    };
}

export default usePostsManager;