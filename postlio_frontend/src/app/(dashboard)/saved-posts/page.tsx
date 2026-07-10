// src/app/(dashboard)/saved-posts/page.tsx
'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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

    const handlePlatformPublished = useCallback((_postId?: number, _platform?: Platform) => {
    }, []);

    const handleAllPublished = useCallback(() => {
        toast.success('Wszystkie platformy opublikowane! 🎉');
        setPublishModalData(null);
        setPublishModalPlatforms([]);
        setPublishModalPostId(null);
    }, []);

    const stats = [
        {
            label: 'Wszystkie',
            value: posts.length,
            highlight: false,
        },
        {
            label: 'Szkice',
            value: posts.filter(p => p.status === 'draft').length,
            highlight: true,
        },
        {
            label: 'Zaplanowane',
            value: posts.filter(p => p.status === 'scheduled').length,
            highlight: false,
        },
        {
            label: 'Opublikowane',
            value: posts.filter(p => p.status === 'published').length,
            highlight: false,
        },
    ];

    return (
        <div className="space-y-4 sm:space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col xs:flex-row xs:items-end justify-between gap-3"
            >
                <div>
                    <h2 className="text-xl sm:text-[26px] font-semibold tracking-tight">Materiały</h2>
                    <p className="text-sm text-muted-foreground mt-1.5 hidden sm:block">
                        Zarządzaj zapisanymi postami i szkicami
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2 rounded-[11px] border-white/10 bg-white/[0.03] hover:bg-white/[0.06]">
                        <Download className="h-4 w-4" />
                        <span className="hidden xs:inline">Eksportuj</span>
                    </Button>
                    <button
                        onClick={() => router.push('/creator')}
                        className="btn-gradient px-4 py-2.5 text-sm"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden xs:inline">Nowy post</span>
                    </button>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card flex items-stretch gap-0 p-2"
            >
                {stats.map((stat, index) => (
                    <div key={stat.label} className="flex items-stretch">
                        {index > 0 && (
                            <div className="flex items-center px-0.5 xs:px-1">
                                <div className="h-9 w-px bg-white/[0.07]" />
                            </div>
                        )}
                        <div
                            className={cn(
                                'flex flex-1 flex-col gap-1 sm:gap-1.5 px-3 py-3 sm:px-5 sm:py-4',
                                stat.highlight && 'rounded-[14px] bg-warning/[0.05]'
                            )}
                        >
                            <span className={cn('text-[11px] sm:text-[12.5px] font-medium', stat.highlight ? 'text-warning' : 'text-muted-foreground')}>
                                {stat.label}
                            </span>
                            <span className="text-lg sm:text-[28px] font-semibold tracking-tight">{stat.value}</span>
                        </div>
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