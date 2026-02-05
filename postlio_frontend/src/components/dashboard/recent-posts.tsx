// src/components/dashboard/recent-posts.tsx

'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePosts, useDeletePost } from '@/hooks/usePosts';
import type { Platform } from '@/types';
import type { Post, PostStatus } from '@/types/post';
import {
    MoreHorizontal,
    ExternalLink,
    Edit2,
    Trash2,
    Facebook,
    Instagram,
    Linkedin,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    Send,
    Sparkles,
    Plus,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

// ============================================================
// KONFIGURACJA
// ============================================================

const platformIcons: Record<Platform, React.ReactNode> = {
    facebook: <Facebook className="h-4 w-4" />,
    instagram: <Instagram className="h-4 w-4" />,
    linkedin: <Linkedin className="h-4 w-4" />,
};

const platformColors: Record<Platform, string> = {
    facebook: 'text-[#1877F2]',
    instagram: 'text-[#E4405F]',
    linkedin: 'text-[#0A66C2]',
};

const statusConfig: Record<PostStatus, { label: string; icon: React.ReactNode; className: string }> = {
    draft: {
        label: 'Szkic',
        icon: <FileText className="h-3.5 w-3.5" />,
        className: 'bg-muted text-muted-foreground',
    },
    scheduled: {
        label: 'Zaplanowany',
        icon: <Clock className="h-3.5 w-3.5" />,
        className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    publishing: {
        label: 'Publikowanie...',
        icon: <Send className="h-3.5 w-3.5" />,
        className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    published: {
        label: 'Opublikowany',
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    },
    failed: {
        label: 'Błąd',
        icon: <XCircle className="h-3.5 w-3.5" />,
        className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    },
};

// ============================================================
// KOMPONENT KARTY POSTA
// ============================================================

interface PostCardProps {
    post: Post;
    index: number;
    onEdit: (post: Post) => void;
    onDelete: (post: Post) => void;
}

function PostCard({ post, index, onEdit, onDelete }: PostCardProps) {
    const postStatus = (post.status in statusConfig ? post.status : 'draft') as PostStatus;
    const status = statusConfig[postStatus];

    const allPlatforms = post.platforms && post.platforms.length > 0
        ? post.platforms
        : (post.platform ? [post.platform] : ['facebook']);

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={cn(
                'group flex gap-4 p-4 rounded-xl border bg-card',
                'transition-all duration-200',
                'hover:shadow-md hover:border-primary/20'
            )}
        >
            {/* Thumbnail */}
            {post.image_url && (
                <div className="hidden sm:block w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={post.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Platform & Status */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-1">
                        {allPlatforms.map((platform) => (
                            <span
                                key={platform}
                                className={cn(platformColors[platform as Platform])}
                            >
                                {platformIcons[platform as Platform]}
                            </span>
                        ))}
                    </div>

                    <Badge variant="outline" className={cn('text-xs', status.className)}>
                        {status.icon}
                        <span className="ml-1">{status.label}</span>
                    </Badge>

                    {post.ai_generated && (
                        <Badge variant="outline" className="text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI
                        </Badge>
                    )}
                </div>

                {/* Content text */}
                <p className="text-sm line-clamp-2 mb-2 text-foreground/80">
                    {post.content || 'Brak treści'}
                </p>

                {/* Meta */}
                <p className="text-xs text-muted-foreground">
                    {post.scheduled_at
                        ? `Zaplanowano ${formatDistanceToNow(new Date(post.scheduled_at), { addSuffix: true, locale: pl })}`
                        : `Utworzono ${formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: pl })}`}
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-start">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(post)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edytuj
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href={`/saved-posts`}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Podgląd
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onDelete(post)}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Usuń
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </motion.div>
    );
}

// ============================================================
// SKELETON LOADER
// ============================================================

function PostCardSkeleton() {
    return (
        <div className="flex gap-4 p-4 rounded-xl border bg-card">
            <Skeleton className="hidden sm:block w-16 h-16 rounded-lg shrink-0" />
            <div className="flex-1 space-y-3">
                <div className="flex gap-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-32" />
            </div>
        </div>
    );
}

// ============================================================
// KOMPONENT GŁÓWNY
// ============================================================

export function RecentPosts() {
    const router = useRouter();
    const [postToDelete, setPostToDelete] = useState<Post | null>(null);

    // Pobierz ostatnie posty z API
    const { data, isLoading, isError } = usePosts({ limit: 5 });
    const deletePost = useDeletePost();

    const posts = data?.posts || [];

    const handleEdit = (post: Post) => {
        router.push(`/creator?edit=${post.id}`);
    };

    const handleDelete = (post: Post) => {
        setPostToDelete(post);
    };

    const confirmDelete = async () => {
        if (postToDelete) {
            await deletePost.mutateAsync(String(postToDelete.id));
            setPostToDelete(null);
        }
    };

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Ostatnie posty</h2>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/saved-posts">
                            Zobacz wszystkie
                        </Link>
                    </Button>
                </div>

                <div className="space-y-3">
                    {isLoading ? (
                        // Loading state
                        <>
                            <PostCardSkeleton />
                            <PostCardSkeleton />
                            <PostCardSkeleton />
                        </>
                    ) : isError ? (
                        // Error state
                        <div className="text-center py-8 text-muted-foreground">
                            <XCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>Nie udało się załadować postów</p>
                            <Button variant="link" asChild className="mt-2">
                                <Link href="/creator">Stwórz nowy post</Link>
                            </Button>
                        </div>
                    ) : posts.length > 0 ? (
                        // Posts list
                        posts.map((post, index) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                index={index}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))
                    ) : (
                        // Empty state
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-12 px-4"
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
                                <FileText className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-1">Brak postów</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Stwórz swój pierwszy post z pomocą AI
                            </p>
                            <Button asChild>
                                <Link href="/creator">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Utwórz post
                                </Link>
                            </Button>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Delete confirmation dialog */}
            <AlertDialog open={!!postToDelete} onOpenChange={() => setPostToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Usunąć post?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ta akcja jest nieodwracalna. Post zostanie trwale usunięty.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deletePost.isPending ? 'Usuwanie...' : 'Usuń'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}