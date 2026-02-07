// src/app/(dashboard)/saved-posts/page.tsx
'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SavedPostsList } from '@/components/saved-posts';
import { ManualPublishModal } from '@/components/common';
import { createManualPublishData } from '@/components/creator/manual-publish-utils';
import type { ManualPublishData } from '@/types/autopilot';
import { usePosts, useDeletePost, useDuplicatePost, useBulkPostsAction, useBrands } from '@/hooks';
import type { Post } from '@/types/post';
import type { Platform } from '@/types';

function getPostPlatforms(post: Post): Platform[] {
    if (post.platforms && post.platforms.length > 0) {
        return post.platforms;
    }
    return post.platform ? [post.platform] : ['facebook'];
}

export default function SavedPostsPage() {
    const router = useRouter();

    const [publishModalData, setPublishModalData] = useState<ManualPublishData | null>(null);
    const [publishModalPlatforms, setPublishModalPlatforms] = useState<Platform[]>([]);
    const [publishModalPostId, setPublishModalPostId] = useState<number | null>(null);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

    const { data: postsData, isLoading: isLoadingPosts } = usePosts();
    const { data: brandsData } = useBrands();

    const deletePost = useDeletePost();
    const duplicatePost = useDuplicatePost();
    const bulkAction = useBulkPostsAction();

    const posts = postsData?.posts || [];
    const brands = brandsData?.brands || [];

    const handleEdit = useCallback((post: Post) => {
        sessionStorage.setItem('editPost', JSON.stringify(post));
        router.push('/creator?mode=edit');
    }, [router]);

    const handleSchedule = useCallback((post: Post) => {
        sessionStorage.setItem('schedulePost', JSON.stringify(post));
        router.push('/calendar?action=schedule');
    }, [router]);

    const handlePublish = useCallback((post: Post) => {
        const hashtagsFromContent = post.content?.match(/#\w+/g)?.map(h => h.slice(1)) || [];
        const hashtags = post.hashtags?.length ? post.hashtags : hashtagsFromContent;

        const platforms = getPostPlatforms(post);
        const primaryPlatform = platforms[0];

        const publishData = createManualPublishData({
            id: typeof post.id === 'string' ? parseInt(post.id, 10) : post.id,
            post_id: typeof post.id === 'string' ? parseInt(post.id, 10) : post.id,
            content: post.content || '',
            hashtags,
            image_url: post.image_url || null,
            platform: primaryPlatform,
        });

        setPublishModalData(publishData);
        setPublishModalPlatforms(platforms);
        setPublishModalPostId(typeof post.id === 'string' ? parseInt(post.id, 10) : post.id);
        setIsPublishModalOpen(true);
    }, []);

    const handleDelete = useCallback(async (post: Post) => {
        try {
            await deletePost.mutateAsync(String(post.id));
        } catch {
            // Error handled in hook
        }
    }, [deletePost]);

    const handleDuplicate = useCallback(async (post: Post) => {
        try {
            await duplicatePost.mutateAsync(String(post.id));
        } catch {
            // Error handled in hook
        }
    }, [duplicatePost]);

    const handleBulkDelete = useCallback(async (postIds: (string | number)[]) => {
        try {
            await bulkAction.mutateAsync({
                post_ids: postIds.map(String),
                action: 'delete',
            });
        } catch {
            // Error handled in hook
        }
    }, [bulkAction]);

    const handleBulkSchedule = useCallback((postIds: (string | number)[]) => {
        sessionStorage.setItem('bulkSchedulePostIds', JSON.stringify(postIds.map(String)));
        router.push('/calendar?action=bulk-schedule');
    }, [router]);

    const handleClosePublishModal = useCallback((open: boolean) => {
        setIsPublishModalOpen(open);
        if (!open) {
            setPublishModalData(null);
            setPublishModalPlatforms([]);
            setPublishModalPostId(null);
        }
    }, []);

    const handlePlatformPublished = useCallback((postId?: number, platform?: Platform) => {
        console.log(`Platform ${platform} marked as published for post ${postId}`);
    }, []);

    const handleAllPublished = useCallback(() => {
        toast.success('Wszystkie platformy opublikowane! 🎉');
        setPublishModalData(null);
        setPublishModalPlatforms([]);
        setPublishModalPostId(null);
    }, []);

    return (
        <div className="space-y-4 sm:space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col xs:flex-row xs:items-center justify-between gap-3"
            >
                <div>
                    <h2 className="text-lg sm:text-xl font-semibold">Materiały</h2>
                    <p className="text-sm text-muted-foreground hidden sm:block">
                        Zarządzaj zapisanymi postami
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        <span className="hidden xs:inline">Eksportuj</span>
                    </Button>
                    <Button
                        onClick={() => router.push('/creator')}
                        size="sm"
                        className="gap-2 bg-gradient-to-r from-primary to-violet-500"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden xs:inline">Nowy post</span>
                    </Button>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-4"
            >
                {[
                    {
                        label: 'Wszystkie',
                        value: posts.length,
                        color: 'bg-primary/10 text-primary'
                    },
                    {
                        label: 'Szkice',
                        value: posts.filter(p => p.status === 'draft').length,
                        color: 'bg-muted text-muted-foreground'
                    },
                    {
                        label: 'Zaplanowane',
                        value: posts.filter(p => p.status === 'scheduled').length,
                        color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    },
                    {
                        label: 'Opublikowane',
                        value: posts.filter(p => p.status === 'published').length,
                        color: 'bg-green-500/10 text-green-600 dark:text-green-400'
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className={`rounded-lg sm:rounded-xl p-3 sm:p-4 ${stat.color}`}
                    >
                        <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                        <div className="text-xs sm:text-sm opacity-80">{stat.label}</div>
                    </div>
                ))}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <SavedPostsList
                    posts={posts}
                    isLoading={isLoadingPosts}
                    brands={brands}
                    onEdit={handleEdit}
                    onSchedule={handleSchedule}
                    onPublish={handlePublish}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onBulkDelete={handleBulkDelete}
                    onBulkSchedule={handleBulkSchedule}
                />
            </motion.div>

            <ManualPublishModal
                open={isPublishModalOpen}
                onOpenChange={handleClosePublishModal}
                data={publishModalData}
                platforms={publishModalPlatforms}
                postId={publishModalPostId || undefined}
                onMarkAsPublished={handlePlatformPublished}
                onAllPublished={handleAllPublished}
            />
        </div>
    );
}