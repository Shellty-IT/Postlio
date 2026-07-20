// src/components/calendar/post-card.tsx
/**
 * Karta posta w kalendarzu
 *
 * ✅ NAPRAWIONE: Obsługa platforms[] + legacy platform
 */

'use client';

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Image from 'next/image';
import {
    Clock,
    Sparkles,
    CheckCircle,
    AlertCircle,
    Pencil,
    MoreHorizontal,
    Trash2,
    Copy,
    ExternalLink,
    Send,
    Zap,
    Hand,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ScheduledPost, getPrimaryPlatformFromScheduledPost } from '@/types/calendar';
import type { Platform } from '@/types';
import type { PostStatus } from '@/types/post';
import { useCalendarStore } from '@/store/calendar-store';

interface PostCardProps {
    post: ScheduledPost;
    compact?: boolean;
}

const platformConfig: Record<Platform, { color: string; bgColor: string }> = {
    facebook: { color: '#1877F2', bgColor: 'rgba(24, 119, 242, 0.1)' },
    instagram: { color: '#E4405F', bgColor: 'rgba(228, 64, 95, 0.1)' },
    linkedin: { color: '#0A66C2', bgColor: 'rgba(10, 102, 194, 0.1)' },
};

const statusConfig: Record<PostStatus, {
    icon: typeof Clock;
    color: string;
    label: string;
}> = {
    draft: { icon: Pencil, color: 'text-muted-foreground', label: 'Szkic' },
    scheduled: { icon: Clock, color: 'text-warning', label: 'Zaplanowany' },
    publishing: { icon: Send, color: 'text-blue-500', label: 'Publikowanie...' },
    published: { icon: CheckCircle, color: 'text-success', label: 'Opublikowany' },
    failed: { icon: AlertCircle, color: 'text-destructive', label: 'Błąd' },
};

export const PostCard = memo(function PostCard({ post, compact = false }: PostCardProps) {
    const { selectPost, openScheduleModal, setDragging } = useCalendarStore();
    const [isHovered, setIsHovered] = useState(false);

    // Bezpieczne pobranie statusu z fallbackiem
    const postStatus = (post.status in statusConfig ? post.status : 'draft') as PostStatus;
    const StatusIcon = statusConfig[postStatus].icon;

    // Obsługa platform - używamy helper function
    const primaryPlatform = getPrimaryPlatformFromScheduledPost(post);
    const platformStyle = platformConfig[primaryPlatform];

    // Wszystkie platformy do wyświetlenia
    const allPlatforms = post.platforms && post.platforms.length > 0
        ? post.platforms
        : (post.platform ? [post.platform] : ['facebook']);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('application/json', JSON.stringify(post));
        e.dataTransfer.effectAllowed = 'move';
        setDragging(true);
    };

    const handleDragEnd = () => {
        setDragging(false);
    };

    const handleClick = () => {
        selectPost(post);
        openScheduleModal();
    };

    if (compact) {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
            >
                <div
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onClick={handleClick}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className={cn(
                        "relative rounded-[8px] border-l-2 px-2 py-1 text-xs cursor-pointer",
                        "transition-all duration-200 hover:brightness-110"
                    )}
                    style={{
                        backgroundColor: platformStyle.bgColor,
                        borderLeftColor: platformStyle.color,
                    }}
                >
                    <div className="flex items-center gap-1.5">
                        {/* AI Badge */}
                        {post.aiGenerated && (
                            <Sparkles className="h-3 w-3 text-accent flex-shrink-0" />
                        )}

                        {/* Tryb publikacji: auto vs ręcznie (Etap 4) */}
                        {post.requiresManualPublish ? (
                            <Hand className="h-3 w-3 text-amber-400 flex-shrink-0" />
                        ) : (
                            <Zap className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                        )}

                        {/* Title */}
                        <span className="truncate font-medium">
                            {post.title || post.content?.slice(0, 30)}
                        </span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{format(new Date(post.scheduledAt), 'HH:mm')}</span>
                    </div>

                    {/* Hover preview tooltip */}
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "absolute z-50 left-full ml-2 top-0 w-64 p-3",
                                "glass-card-strong shadow-xl pointer-events-none"
                            )}
                        >
                            <p className="text-sm line-clamp-3">{post.content}</p>
                            {post.imageUrl && (
                                <div className="mt-2 rounded-md overflow-hidden relative h-20">
                                    <Image
                                        src={post.imageUrl}
                                        alt="Post preview"
                                        fill
                                        className="object-cover"
                                        sizes="256px"
                                        unoptimized
                                    />
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </motion.div>
        );
    }

    // Full card view
    return (
        <motion.div layout>
            <div
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                className={cn(
                    "glass-card-interactive p-3",
                    "cursor-grab active:cursor-grabbing"
                )}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                        {/* Platform badges - wyświetl wszystkie platformy */}
                        <div className="flex items-center gap-1">
                            {allPlatforms.map((platform) => {
                                const config = platformConfig[platform as Platform];
                                if (!config) return null;
                                return (
                                    <div
                                        key={platform}
                                        className="w-6 h-6 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: config.color }}
                                    >
                                        <span className="text-[10px] text-white font-bold uppercase">
                                            {platform[0]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* AI Badge */}
                        {post.aiGenerated && (
                            <Tooltip>
                                <TooltipTrigger>
                                    <div className="flex items-center gap-1 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 px-1.5 py-0.5">
                                        <Sparkles className="h-3 w-3 text-accent" />
                                        <span className="text-[10px] font-medium text-[#c3ccff]">
                                            AI
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>Wygenerowany przez AI</TooltipContent>
                            </Tooltip>
                        )}

                        {/* Tryb publikacji: auto vs ręcznie (Etap 4) */}
                        <Tooltip>
                            <TooltipTrigger>
                                <div
                                    className={cn(
                                        'flex items-center gap-1 rounded-full px-1.5 py-0.5',
                                        post.requiresManualPublish
                                            ? 'bg-amber-400/15 text-amber-400'
                                            : 'bg-emerald-400/15 text-emerald-400'
                                    )}
                                >
                                    {post.requiresManualPublish ? (
                                        <Hand className="h-3 w-3" />
                                    ) : (
                                        <Zap className="h-3 w-3" />
                                    )}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {post.requiresManualPublish
                                    ? 'Wymaga ręcznej publikacji'
                                    : 'Publikacja automatyczna'}
                            </TooltipContent>
                        </Tooltip>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1 hover:bg-muted rounded-md">
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleClick}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edytuj
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplikuj
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Podgląd
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Usuń
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Content */}
                <p className="text-sm line-clamp-2 mb-2">{post.content}</p>

                {/* Image preview */}
                {post.imageUrl && (
                    <div className="rounded-md overflow-hidden mb-2 relative h-24">
                        <Image
                            src={post.imageUrl}
                            alt="Post image"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 300px"
                            unoptimized
                        />
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <StatusIcon className={cn("h-3.5 w-3.5", statusConfig[postStatus].color)} />
                        <span>{statusConfig[postStatus].label}</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{format(new Date(post.scheduledAt), 'HH:mm')}</span>
                    </div>
                </div>

                {/* Brand badge */}
                {post.brandName && (
                    <div className="mt-2 pt-2 border-t border-white/[0.06]">
                        <span className="text-xs text-muted-foreground">
                            Marka: <span className="font-medium text-foreground">{post.brandName}</span>
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
});