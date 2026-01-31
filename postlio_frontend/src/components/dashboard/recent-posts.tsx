// src/components/dashboard/recent-posts.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Post, Platform, PostStatus } from '@/types';
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

// Statusy
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
    archived: {
        label: 'Archiwum',
        icon: <FileText className="h-3.5 w-3.5" />,
        className: 'bg-muted text-muted-foreground',
    },
};

interface PostCardProps {
    post: Post;
    index: number;
}

function PostCard({ post, index }: PostCardProps) {
    const status = statusConfig[post.status];

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
                    {/* POPRAWKA: pojedyncza platforma zamiast tablicy */}
                    <span className={cn(platformColors[post.platform])}>
                        {platformIcons[post.platform]}
                    </span>

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
    // Mock data - POPRAWKA: platform zamiast platforms
    const mockPosts: Post[] = posts || [
        {
            id: '1',
            user_id: '1',
            content: 'Nowy wpis na blogu o AI w marketingu! 🚀 Sprawdźcie jak sztuczna inteligencja zmienia sposób tworzenia treści w social media...',
            platform: 'facebook',
            status: 'published',
            ai_generated: true,
            likes: 0,
            comments: 0,
            shares: 0,
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: '2',
            user_id: '1',
            content: 'Zapraszamy na webinar o automatyzacji social media! 📅 Dołącz do nas w czwartek o 18:00.',
            platform: 'instagram',
            status: 'scheduled',
            scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            ai_generated: false,
            likes: 0,
            comments: 0,
            shares: 0,
            created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
        },
        {
            id: '3',
            user_id: '1',
            content: 'Tips & tricks dla content creatorów - nowa seria postów już wkrótce! ✨',
            platform: 'linkedin',
            status: 'draft',
            ai_generated: true,
            likes: 0,
            comments: 0,
            shares: 0,
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
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