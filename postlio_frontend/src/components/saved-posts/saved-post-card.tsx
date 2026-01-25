// src/components/saved-posts/saved-post-card.tsx
/**
 * Karta pojedynczego zapisanego posta
 *
 * Wyświetla podgląd posta z akcjami: edycja, zaplanuj, publikuj, usuń
 */

'use client';

import { useState } from 'react';
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
} from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import type { Post, Platform, PostStatus } from '@/types';

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

const STATUS_CONFIG: Record<PostStatus, {
    label: string;
    icon: typeof Clock;
    className: string;
}> = {
    draft: {
        label: 'Szkic',
        icon: Edit3,
        className: 'bg-muted text-muted-foreground',
    },
    scheduled: {
        label: 'Zaplanowany',
        icon: Clock,
        className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    published: {
        label: 'Opublikowany',
        icon: CheckCircle2,
        className: 'bg-green-500/10 text-green-600 dark:text-green-400',
    },
    failed: {
        label: 'Błąd',
        icon: AlertCircle,
        className: 'bg-red-500/10 text-red-600 dark:text-red-400',
    },
    archived: {
        label: 'Zarchiwizowany',
        icon: Copy,
        className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
    },
};

// ============================================================
// KOMPONENT
// ============================================================

export function SavedPostCard({
                                  post,
                                  isSelected = false,
                                  onSelect,
                                  onEdit,
                                  onSchedule,
                                  onPublish,
                                  onDelete,
                                  onDuplicate,
                              }: SavedPostCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    const platformConfig = PLATFORM_CONFIG[post.platform];
    const statusConfig = STATUS_CONFIG[post.status];
    const PlatformIcon = platformConfig.icon;
    const StatusIcon = statusConfig.icon;

    // Skrócona treść do podglądu (max 150 znaków)
    const truncatedContent = post.content.length > 150
        ? `${post.content.slice(0, 150)}...`
        : post.content;

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
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -2 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className={cn(
                'group relative rounded-xl border bg-card transition-all duration-200',
                'hover:shadow-lg hover:border-primary/20',
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
                <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={post.image_url}
                        alt="Post thumbnail"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Platform badge on image */}
                    <div className="absolute bottom-2 left-2">
                        <div
                            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-white text-xs font-medium backdrop-blur-sm"
                            style={{ backgroundColor: `${platformConfig.color}CC` }}
                        >
                            <PlatformIcon className="h-3.5 w-3.5" />
                            {platformConfig.label}
                        </div>
                    </div>

                    {/* AI badge */}
                    {post.ai_generated && (
                        <div className="absolute bottom-2 right-2">
                            <div className="flex items-center gap-1 rounded-full bg-violet-500/90 px-2 py-1 text-white text-xs font-medium backdrop-blur-sm">
                                <Sparkles className="h-3 w-3" />
                                AI
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // Placeholder when no image
                <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted/50">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                    </div>

                    {/* Platform badge */}
                    <div className="absolute bottom-2 left-2">
                        <div
                            className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', platformConfig.bgColor)}
                            style={{ color: platformConfig.color }}
                        >
                            <PlatformIcon className="h-3.5 w-3.5" />
                            {platformConfig.label}
                        </div>
                    </div>

                    {post.ai_generated && (
                        <div className="absolute bottom-2 right-2">
                            <Badge variant="secondary" className="bg-violet-500/10 text-violet-600 dark:text-violet-400">
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI
                            </Badge>
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Status & Date */}
                <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className={cn('text-xs', statusConfig.className)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                    </Badge>

                    <span className="text-xs text-muted-foreground">
            {formattedDate}
          </span>
                </div>

                {/* Post content preview */}
                <p className="text-sm text-foreground/80 line-clamp-3 min-h-[3.75rem]">
                    {truncatedContent}
                </p>

                {/* Scheduled date if exists */}
                {scheduledDate && post.status === 'scheduled' && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Zaplanowano: {scheduledDate}</span>
                    </div>
                )}

                {/* Hashtags preview */}
                {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {post.hashtags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="text-xs text-primary/70 hover:text-primary cursor-default"
                            >
                #{tag}
              </span>
                        ))}
                        {post.hashtags.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                +{post.hashtags.length - 3}
              </span>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1">
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => onEdit?.(post)}
                                    >
                                        <Edit3 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edytuj</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => onSchedule?.(post)}
                                    >
                                        <Calendar className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Zaplanuj</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950"
                                        onClick={() => onPublish?.(post)}
                                    >
                                        <Hand className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Opublikuj ręcznie</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {/* More options dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
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

export default SavedPostCard;