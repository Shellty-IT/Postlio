// src/components/dashboard/recent-posts.tsx
/**
 * Lista ostatnich postów na dashboardzie
 *
 * ✅ NAPRAWIONE: Obsługa platforms[] + usunięty 'archived' status
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Ikony platform
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

// Statusy - zgodne z PostStatus z @/types/post
const statusConfig: Record<PostStatus, { label: string; icon: React.ReactNode; className: string }> = {
    draft: {
        label: 'Szkic',
        icon: <FileText className="h-3.5 w-3.5" />,
        className: 'bg-muted text-muted-foreground',
    },
    scheduled: {
        label: 'Zaplanowany',
        icon: <Clock className="h-3.5 w-3.5" />,
        className: 'bg-warning/10 text-warning border-warning/20',
    },
    publishing: {
        label: 'Publikowanie...',
        icon: <Send className="h-3.5 w-3.5" />,
        className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    },
    published: {
        label: 'Opublikowany',
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        className: 'bg-success/10 text-success border-success/20',
    },
    failed: {
        label: 'Błąd',
        icon: <XCircle className="h-3.5 w-3.5" />,
        className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
};

interface PostCardProps {
    post: Post;
    index: number;
}

function PostCard({ post, index }: PostCardProps) {
    // Bezpieczne pobranie statusu z fallbackiem
    const postStatus = (post.status in statusConfig ? post.status : 'draft') as PostStatus;
    const status = statusConfig[postStatus];

    // Wszystkie platformy do wyświetlenia
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
            {/* Content Preview */}
            <div className="flex-1 min-w-0">
                {/* Platform & Status */}
                <div className="flex items-center gap-2 mb-2">
                    {/* Wyświetl wszystkie platformy */}
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
                        <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">
                            AI
                        </Badge>
                    )}
                </div>

                {/* Content */}
                <p className="text-sm line-clamp-2 mb-2">{post.content}</p>

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
                        <DropdownMenuItem>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edytuj
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Podgląd
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Usuń
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </motion.div>
    );
}

interface RecentPostsProps {
    posts?: Post[];
}

export function RecentPosts({ posts }: RecentPostsProps) {
    // Mock data z platforms[]
    const mockPosts: Post[] = posts || [
        {
            id: 1,
            user_id: 1,
            brand_id: null,
            content: 'Nowy wpis na blogu o AI w marketingu! 🚀 Sprawdźcie jak sztuczna inteligencja zmienia sposób tworzenia treści w social media...',
            image_url: null,
            image_prompt: null,
            platforms: ['facebook'],
            platform_statuses: { facebook: { status: 'published', published_at: null, platform_post_id: null } },
            platform: 'facebook',
            platform_post_id: null,
            status: 'published',
            scheduled_at: null,
            published_at: null,
            ai_generated: true,
            ai_model: null,
            generation_params: null,
            likes: 0,
            comments: 0,
            shares: 0,
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            hashtags: [],
        },
        {
            id: 2,
            user_id: 1,
            brand_id: null,
            content: 'Zapraszamy na webinar o automatyzacji social media! 📅 Dołącz do nas w czwartek o 18:00.',
            image_url: null,
            image_prompt: null,
            platforms: ['instagram', 'facebook'],
            platform_statuses: {},
            platform: 'instagram',
            platform_post_id: null,
            status: 'scheduled',
            scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            published_at: null,
            ai_generated: false,
            ai_model: null,
            generation_params: null,
            likes: 0,
            comments: 0,
            shares: 0,
            created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            hashtags: [],
        },
        {
            id: 3,
            user_id: 1,
            brand_id: null,
            content: 'Tips & tricks dla content creatorów - nowa seria postów już wkrótce! ✨',
            image_url: null,
            image_prompt: null,
            platforms: ['linkedin'],
            platform_statuses: {},
            platform: 'linkedin',
            platform_post_id: null,
            status: 'draft',
            scheduled_at: null,
            published_at: null,
            ai_generated: true,
            ai_model: null,
            generation_params: null,
            likes: 0,
            comments: 0,
            shares: 0,
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            hashtags: [],
        },
    ];

    return (
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
                {mockPosts.length > 0 ? (
                    mockPosts.map((post, index) => (
                        <PostCard key={post.id} post={post} index={index} />
                    ))
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Nie masz jeszcze żadnych postów</p>
                        <Button variant="link" asChild className="mt-2">
                            <Link href="/creator">Stwórz pierwszy post</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}