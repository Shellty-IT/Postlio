// src/components/saved-posts/saved-post-card.tsx
/**
 * Karta pojedynczego zapisanego posta
 *
 * Wyświetla podgląd posta z akcjami: edycja, zaplanuj, publikuj, usuń
 *
 * ✅ NAPRAWIONE: Obsługa platforms[] + usunięty 'archived' status
 * ✅ NAPRAWIONE: forwardRef dla AnimatePresence
 */

'use client';

import { useState, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
    MoreHorizontal,
    Edit3,
    Calendar,
    Trash2,
    Hand,
    Copy,
    Image as ImageIcon,
    Sparkles,
    Facebook,
    Instagram,
    Linkedin,
    Clock,
    CheckCircle2,
    AlertCircle,
    Send,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Platform } from '@/types';
import type { Post, PostStatus } from '@/types/post';

// ============================================================
// TYPY
// ============================================================

interface SavedPostCardProps {
    post: Post;
    isSelected?: boolean;
    onSelect?: (id: string | number, selected: boolean) => void;
    onEdit?: (post: Post) => void;
    onSchedule?: (post: Post) => void;
    onPublish?: (post: Post) => void;
    onDelete?: (post: Post) => void;
    onDuplicate?: (post: Post) => void;
}

// ============================================================
// KONFIGURACJA PLATFORM
// ============================================================

const PLATFORM_CONFIG: Record<Platform, {
    icon: typeof Facebook;
    color: string;
    label: string;
    bgColor: string;
}> = {
    facebook: {
        icon: Facebook,
        color: '#1877F2',
        label: 'Facebook',
        bgColor: 'bg-[#1877F2]/10',
    },
    instagram: {
        icon: Instagram,
        color: '#E4405F',
        label: 'Instagram',
        bgColor: 'bg-[#E4405F]/10',
    },
    linkedin: {
        icon: Linkedin,
        color: '#0A66C2',
        label: 'LinkedIn',
        bgColor: 'bg-[#0A66C2]/10',
    },
};

// Statusy - zgodne z PostStatus z @/types/post (bez 'archived')
const STATUS_CONFIG: Record<PostStatus, {
    label: string;
    icon: typeof Clock;
    className: string;
}> = {
    draft: {
        label: 'Szkic',
        icon: Edit3,
        className: 'bg-warning/[0.14] text-warning',
    },
    scheduled: {
        label: 'Zaplanowany',
        icon: Clock,
        className: 'bg-primary/[0.14] text-primary',
    },
    publishing: {
        label: 'Publikowanie...',
        icon: Send,
        className: 'bg-warning/[0.14] text-warning',
    },
    published: {
        label: 'Opublikowany',
        icon: CheckCircle2,
        className: 'bg-success/[0.14] text-success',
    },
    failed: {
        label: 'Błąd',
        icon: AlertCircle,
        className: 'bg-destructive/[0.14] text-destructive',
    },
};

// ============================================================
// KOMPONENT
// ============================================================

export const SavedPostCard = forwardRef<HTMLDivElement, SavedPostCardProps>(
    function SavedPostCard(
        {
            post,
            isSelected = false,
            onSelect,
            onEdit,
            onSchedule,
            onPublish,
            onDelete,
            onDuplicate,
        },
        ref
    ) {
        const [isHovered, setIsHovered] = useState(false);

        // Wszystkie platformy do wyświetlenia
        const allPlatforms = post.platforms && post.platforms.length > 0
            ? post.platforms
            : (post.platform ? [post.platform] : ['facebook']);

        // Bezpieczne pobranie statusu z fallbackiem
        const postStatus = (post.status in STATUS_CONFIG ? post.status : 'draft') as PostStatus;
        const statusConfig = STATUS_CONFIG[postStatus];
        const StatusIcon = statusConfig.icon;

        // Skrócona treść do podglądu (max 150 znaków)
        const truncatedContent = post.content && post.content.length > 150
            ? `${post.content.slice(0, 150)}...`
            : (post.content || '');

        // Formatowanie daty
        const formattedDate = format(new Date(post.created_at), 'd MMM yyyy, HH:mm', { locale: pl });
        const scheduledDate = post.scheduled_at
            ? format(new Date(post.scheduled_at), 'd MMM yyyy, HH:mm', { locale: pl })
            : null;

        // Handler dla checkbox - z prawidłowym typem
        const handleCheckedChange = (checked: boolean | 'indeterminate') => {
            if (typeof checked === 'boolean') {
                onSelect?.(post.id, checked);
            }
        };

        return (
            <motion.div
                ref={ref}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className={cn(
                    'glass-card-interactive group relative flex flex-col overflow-hidden',
                    isSelected && 'ring-2 ring-primary border-primary'
                )}
            >
                {/* Checkbox selection */}
                {onSelect && (
                    <div className={cn(
                        'absolute top-3 left-3 z-10 transition-opacity duration-200',
                        isHovered || isSelected ? 'opacity-100' : 'opacity-0'
                    )}>
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={handleCheckedChange}
                            className="bg-background"
                        />
                    </div>
                )}

                {/* Image thumbnail */}
                {post.image_url ? (
                    <div className="relative aspect-video w-full overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={post.image_url}
                            alt="Post thumbnail"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Platform badges on image */}
                        <div className="absolute bottom-2.5 left-2.5 flex gap-1">
                            {allPlatforms.map((platform) => {
                                const config = PLATFORM_CONFIG[platform as Platform];
                                if (!config) return null;
                                const Icon = config.icon;
                                return (
                                    <div
                                        key={platform}
                                        className="flex h-6 items-center gap-1 rounded-[7px] px-2 text-white text-xs font-semibold shadow-[0_4px_12px_-3px_rgba(0,0,0,0.5)] backdrop-blur-sm"
                                        style={{ backgroundColor: `${config.color}CC` }}
                                    >
                                        <Icon className="h-3 w-3" />
                                        {allPlatforms.length === 1 && config.label}
                                    </div>
                                );
                            })}
                        </div>

                        {/* AI badge */}
                        {post.ai_generated && (
                            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-[8px] bg-gradient-to-br from-primary to-accent px-2.5 py-1 text-[10.5px] font-semibold text-white shadow-[0_4px_12px_-3px_rgba(0,0,0,0.5)]">
                                <Sparkles className="h-3 w-3" />
                                AI
                            </div>
                        )}
                    </div>
                ) : (
                    // Placeholder when no image
                    <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/15 to-accent/15">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ImageIcon className="h-9 w-9 text-muted-foreground/40" />
                        </div>

                        {/* Platform badges */}
                        <div className="absolute bottom-2.5 left-2.5 flex gap-1">
                            {allPlatforms.map((platform) => {
                                const config = PLATFORM_CONFIG[platform as Platform];
                                if (!config) return null;
                                const Icon = config.icon;
                                return (
                                    <div
                                        key={platform}
                                        className="flex h-6 items-center gap-1 rounded-[7px] px-2 text-white text-xs font-semibold shadow-[0_4px_12px_-3px_rgba(0,0,0,0.5)]"
                                        style={{ backgroundColor: config.color }}
                                    >
                                        <Icon className="h-3 w-3" />
                                        {allPlatforms.length === 1 && config.label}
                                    </div>
                                );
                            })}
                        </div>

                        {post.ai_generated && (
                            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-[8px] bg-gradient-to-br from-primary to-accent px-2.5 py-1 text-[10.5px] font-semibold text-white shadow-[0_4px_12px_-3px_rgba(0,0,0,0.5)]">
                                <Sparkles className="h-3 w-3" />
                                AI
                            </div>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="flex flex-1 flex-col gap-2.5 p-3.5">
                    {/* Status & Date */}
                    <div className="flex items-center justify-between gap-2">
                        <Badge variant="secondary" className={cn('text-xs rounded-[7px] border-0', statusConfig.className)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                        </Badge>

                        <span className="text-[11.5px] text-muted-foreground/80">
                            {formattedDate}
                        </span>
                    </div>

                    {/* Post content preview */}
                    <p className="text-[13.5px] leading-relaxed text-foreground/80 line-clamp-2 min-h-[2.5rem]">
                        {truncatedContent}
                    </p>

                    {/* Scheduled date if exists */}
                    {scheduledDate && post.status === 'scheduled' && (
                        <div className="flex items-center gap-1.5 text-xs text-primary">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Zaplanowano: {scheduledDate}</span>
                        </div>
                    )}

                    {/* Hashtags preview */}
                    {post.hashtags && post.hashtags.length > 0 && (
                        <div className="text-[11px] text-primary/70 truncate">
                            {post.hashtags.slice(0, 3).map(tag => `#${tag}`).join(' ')}
                            {post.hashtags.length > 3 && ` +${post.hashtags.length - 3}`}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-auto flex items-center gap-1.5 border-t border-white/[0.05] pt-2.5">
                        <button
                            type="button"
                            onClick={() => onEdit?.(post)}
                            className="flex-1 rounded-[8px] border border-white/[0.08] py-1.5 text-[11.5px] text-[#c7cad2] transition-colors hover:bg-white/[0.05]"
                        >
                            Edytuj
                        </button>
                        <button
                            type="button"
                            onClick={() => onSchedule?.(post)}
                            className="flex-1 rounded-[8px] border border-primary/25 py-1.5 text-[11.5px] font-semibold text-primary transition-colors hover:bg-primary/10"
                        >
                            Zaplanuj
                        </button>

                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => onPublish?.(post)}
                                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] border border-white/[0.08] text-accent transition-colors hover:bg-accent/10"
                                    >
                                        <Hand className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Opublikuj ręcznie</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => onDuplicate?.(post)}
                                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] border border-white/[0.08] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Duplikuj</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* More options dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] border border-white/[0.08] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
                                >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => onEdit?.(post)}>
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Edytuj
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDuplicate?.(post)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplikuj
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onSchedule?.(post)}>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Zaplanuj
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onDelete?.(post)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Usuń
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </motion.div>
        );
    }
);

export default SavedPostCard;