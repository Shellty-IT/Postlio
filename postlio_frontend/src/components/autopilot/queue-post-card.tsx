// src/components/autopilot/queue-post-card.tsx
'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    Check,
    X,
    MoreVertical,
    Eye,
    Edit3,
    Trash2,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Image as ImageIcon,
    Facebook,
    Instagram,
    Linkedin,
    ExternalLink,
    Copy,
    MessageSquare,
    Loader2,
    Send,
    AlertTriangle,
    RefreshCw,
    LinkIcon,
    Hand,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import {
    useApproveQueueItem,
    useRejectQueueItem,
    useDeleteQueueItem,
    useUpdateQueueItem,
    usePublishQueueItem,
} from '@/hooks/useAutopilot';
import { ManualPublishModal } from '@/components/common/manual-publish-modal';
import { createManualPublishData } from '@/components/creator/manual-publish-utils';
import type { BackendQueueItem, BackendQueueStatus, ManualPublishData } from '@/types/autopilot';
import type { Platform } from '@/types';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { toast } from 'sonner';

interface QueuePostCardProps {
    post: BackendQueueItem;
    onPreview?: (post: BackendQueueItem) => void;
}

const STATUS_CONFIG: Record<BackendQueueStatus, {
    label: string;
    color: string;
    bgColor: string;
    icon?: React.ReactNode;
}> = {
    pending: {
        label: 'Do przeglądu',
        color: '#F59E0B',
        bgColor: 'rgba(245, 158, 11, 0.1)'
    },
    approved: {
        label: 'Zatwierdzony',
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        icon: <Check className="h-3 w-3" />
    },
    scheduled: {
        label: 'Zaplanowany',
        color: '#3B82F6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        icon: <Clock className="h-3 w-3" />
    },
    published: {
        label: 'Opublikowany',
        color: '#22C55E',
        bgColor: 'rgba(34, 197, 94, 0.1)',
        icon: <ExternalLink className="h-3 w-3" />
    },
    failed: {
        label: 'Błąd',
        color: '#EF4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        icon: <AlertTriangle className="h-3 w-3" />
    },
    rejected: {
        label: 'Odrzucony',
        color: '#6B7280',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        icon: <X className="h-3 w-3" />
    },
};

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
    facebook: <Facebook className="h-4 w-4" />,
    instagram: <Instagram className="h-4 w-4" />,
    linkedin: <Linkedin className="h-4 w-4" />,
};

const PLATFORM_COLORS: Record<Platform, string> = {
    facebook: '#1877F2',
    instagram: '#E4405F',
    linkedin: '#0A66C2',
};

export function QueuePostCard({ post, onPreview }: QueuePostCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(post.content);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [manualPublishData, setManualPublishData] = useState<ManualPublishData | null>(null);
    const [showManualModal, setShowManualModal] = useState(false);

    const approveMutation = useApproveQueueItem();
    const rejectMutation = useRejectQueueItem();
    const deleteMutation = useDeleteQueueItem();
    const updateMutation = useUpdateQueueItem();
    const publishMutation = usePublishQueueItem();

    const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.pending;
    const platform = post.platform as Platform;
    const isActionable = post.status === 'pending';
    const canPublish = post.status === 'approved' && post.social_account_id;
    const canRetryPublish = post.status === 'failed' && (post.publish_attempts || 0) < 3;
    const isLoading = approveMutation.isPending || rejectMutation.isPending ||
        deleteMutation.isPending || updateMutation.isPending ||
        publishMutation.isPending;

    const handleApprove = async (publishNow: boolean = false) => {
        await approveMutation.mutateAsync({ itemId: post.id, publishNow });
    };

    const handleReject = async () => {
        if (showRejectInput) {
            await rejectMutation.mutateAsync({
                itemId: post.id,
                notes: rejectReason || undefined
            });
            setShowRejectInput(false);
            setRejectReason('');
        } else {
            setShowRejectInput(true);
        }
    };

    const handleDelete = async () => {
        await deleteMutation.mutateAsync(post.id);
    };

    const handleSaveEdit = async () => {
        await updateMutation.mutateAsync({
            itemId: post.id,
            data: { content: editedContent },
        });
        setIsEditing(false);
    };

    const handlePublish = async () => {
        try {
            const result = await publishMutation.mutateAsync({
                itemId: post.id,
                request: { publish_now: true }
            });

            if (result.requires_manual) {
                const manualData = createManualPublishData({
                    id: post.id,
                    content: post.content,
                    hashtags: post.hashtags || [],
                    image_url: post.image_url,
                    platform: post.platform as Platform,
                });
                setManualPublishData(manualData);
                setShowManualModal(true);
            }
        } catch {
        }
    };

    const handleMarkAsPublished = useCallback(async (itemId?: number) => {
        if (!itemId) return;
        try {
            await updateMutation.mutateAsync({
                itemId,
                data: { status: 'published' as BackendQueueStatus },
            });
            toast.success('Post oznaczony jako opublikowany');
        } catch {
            toast.error('Nie udało się oznaczyć jako opublikowane');
        }
    }, [updateMutation]);

    const handleOpenManualPublish = () => {
        const manualData = createManualPublishData({
            id: post.id,
            content: post.content,
            hashtags: post.hashtags || [],
            image_url: post.image_url,
            platform: post.platform as Platform,
        });
        setManualPublishData(manualData);
        setShowManualModal(true);
    };

    const handleCopyContent = () => {
        navigator.clipboard.writeText(post.content);
        toast.success('Treść skopiowana!');
    };

    const handleOpenPost = () => {
        if (post.platform_post_url) {
            window.open(post.platform_post_url, '_blank');
        }
    };

    const truncatedContent = post.content.length > 150
        ? post.content.substring(0, 150) + '...'
        : post.content;

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
            >
                <Card
                    className={cn(
                        'overflow-hidden transition-all duration-200',
                        isExpanded && 'ring-2 ring-violet-500/50',
                        isLoading && 'opacity-70',
                        post.status === 'failed' && 'ring-1 ring-red-500/30'
                    )}
                >
                    <div className="flex items-start gap-3 p-4">
                        {post.image_url ? (
                            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                                <Image
                                    src={post.image_url}
                                    alt="Podgląd zdjęcia"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                <ImageIcon className="absolute bottom-1 right-1 h-4 w-4 text-white/80" />
                            </div>
                        ) : (
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                        )}

                        <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <Badge
                                    variant="outline"
                                    style={{
                                        backgroundColor: statusConfig.bgColor,
                                        borderColor: statusConfig.color,
                                        color: statusConfig.color,
                                    }}
                                    className="text-xs"
                                >
                                    {isLoading ? (
                                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : statusConfig.icon ? (
                                        <span className="mr-1">{statusConfig.icon}</span>
                                    ) : null}
                                    {statusConfig.label}
                                </Badge>

                                {post.publish_attempts > 0 && post.status !== 'published' && (
                                    <Badge variant="outline" className="text-xs text-orange-500 border-orange-500/50">
                                        <RefreshCw className="mr-1 h-3 w-3" />
                                        Próba {post.publish_attempts}/3
                                    </Badge>
                                )}

                                {post.category && (
                                    <Badge variant="secondary" className="text-xs">
                                        {post.category}
                                    </Badge>
                                )}

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className="flex h-6 w-6 items-center justify-center rounded-full"
                                                style={{ backgroundColor: `${PLATFORM_COLORS[platform]}20` }}
                                            >
                                                <span style={{ color: PLATFORM_COLORS[platform] }}>
                                                    {PLATFORM_ICONS[platform]}
                                                </span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="capitalize">{platform}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                {post.platform_post_url && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    onClick={handleOpenPost}
                                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors"
                                                >
                                                    <LinkIcon className="h-3.5 w-3.5" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Zobacz opublikowany post</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>

                            <div className="mb-2">
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <Textarea
                                            value={editedContent}
                                            onChange={(e) => setEditedContent(e.target.value)}
                                            className="min-h-[100px] text-sm"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={handleSaveEdit}
                                                disabled={updateMutation.isPending}
                                            >
                                                {updateMutation.isPending && (
                                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                                )}
                                                Zapisz
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditedContent(post.content);
                                                }}
                                            >
                                                Anuluj
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-foreground/90">
                                        {isExpanded ? post.content : truncatedContent}
                                    </p>
                                )}
                            </div>

                            {post.hashtags && post.hashtags.length > 0 && (
                                <div className="mb-2 flex flex-wrap gap-1">
                                    {post.hashtags.slice(0, 3).map((tag, index) => (
                                        <span key={index} className="text-xs text-violet-500">
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

                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {format(new Date(post.scheduled_for), 'dd MMM yyyy', { locale: pl })}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {format(new Date(post.scheduled_for), 'HH:mm')}
                                </span>
                                {post.text_provider_used && (
                                    <span className="flex items-center gap-1">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        {post.text_provider_used.toUpperCase()}
                                    </span>
                                )}
                                {post.topic_used && (
                                    <span className="truncate text-violet-500">#{post.topic_used}</span>
                                )}
                            </div>
                        </div>

                        <div className="flex shrink-0 items-start gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onPreview?.(post)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Podgląd
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setIsEditing(!isEditing)}>
                                        <Edit3 className="mr-2 h-4 w-4" />
                                        Edytuj
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleCopyContent}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Kopiuj treść
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleOpenManualPublish}>
                                        <Hand className="mr-2 h-4 w-4" />
                                        Opublikuj ręcznie
                                    </DropdownMenuItem>
                                    {post.platform_post_url && (
                                        <DropdownMenuItem onClick={handleOpenPost}>
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            Zobacz post
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={handleDelete}
                                        disabled={deleteMutation.isPending}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Usuń
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                {post.publish_error && (
                                    <div className="border-t bg-red-50 p-4 dark:bg-red-950/50">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                                            <div>
                                                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                                    Błąd publikacji
                                                </p>
                                                <p className="text-sm text-red-700 dark:text-red-300">
                                                    {post.publish_error}
                                                </p>
                                                {post.publish_error.includes('wymaga ręcznej') && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
                                                        onClick={handleOpenManualPublish}
                                                    >
                                                        <Hand className="mr-2 h-3 w-3" />
                                                        Opublikuj ręcznie
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {showRejectInput && (
                                    <div className="border-t bg-muted/50 p-4">
                                        <label className="mb-2 block text-sm font-medium">
                                            Powód odrzucenia (opcjonalnie)
                                        </label>
                                        <Textarea
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            placeholder="Opisz dlaczego odrzucasz ten post..."
                                            className="mb-2 min-h-[60px]"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={handleReject}
                                                disabled={rejectMutation.isPending}
                                            >
                                                {rejectMutation.isPending && (
                                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                                )}
                                                Potwierdź odrzucenie
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setShowRejectInput(false)}
                                            >
                                                Anuluj
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {post.user_notes && (
                                    <div className="border-t bg-amber-50 p-4 dark:bg-amber-950">
                                        <p className="text-sm text-amber-800 dark:text-amber-200">
                                            <span className="font-medium">Notatka:</span> {post.user_notes}
                                        </p>
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center justify-between gap-4 border-t bg-muted/30 px-4 py-3">
                                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                        <span>
                                            Utworzono:{' '}
                                            {formatDistanceToNow(new Date(post.created_at), {
                                                addSuffix: true,
                                                locale: pl,
                                            })}
                                        </span>
                                        {post.edit_count > 0 && (
                                            <span>
                                                Edycje: {post.edit_count}
                                            </span>
                                        )}
                                        {post.published_at && (
                                            <span>
                                                Opublikowano:{' '}
                                                {format(new Date(post.published_at), 'dd MMM HH:mm', { locale: pl })}
                                            </span>
                                        )}
                                    </div>

                                    {post.platform_post_url && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs"
                                            onClick={handleOpenPost}
                                        >
                                            <ExternalLink className="mr-1.5 h-3 w-3" />
                                            Zobacz post
                                        </Button>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isActionable && !showRejectInput && !isEditing && (
                        <div className="flex items-center gap-2 border-t bg-muted/30 p-3">
                            <Button
                                size="sm"
                                className="flex-1 bg-green-600 text-white hover:bg-green-700"
                                onClick={() => handleApprove(false)}
                                disabled={isLoading}
                            >
                                {approveMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="mr-2 h-4 w-4" />
                                )}
                                Zatwierdź
                            </Button>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-green-500/50 text-green-600 hover:bg-green-500/10"
                                            onClick={() => handleApprove(true)}
                                            disabled={isLoading}
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Zatwierdź i opublikuj teraz</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                                onClick={handleReject}
                                disabled={isLoading}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Odrzuć
                            </Button>
                        </div>
                    )}

                    {canPublish && !isEditing && (
                        <div className="flex items-center gap-2 border-t bg-muted/30 p-3">
                            <Button
                                size="sm"
                                className="flex-1 bg-violet-600 text-white hover:bg-violet-700"
                                onClick={handlePublish}
                                disabled={isLoading}
                            >
                                {publishMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                Opublikuj teraz
                            </Button>
                            <div className="text-xs text-muted-foreground">
                                lub zostaw - opublikuje się automatycznie
                            </div>
                        </div>
                    )}

                    {post.status === 'approved' && !post.social_account_id && !isEditing && (
                        <div className="flex items-center gap-2 border-t bg-amber-50 p-3 dark:bg-amber-950/30">
                            <div className="flex-1 text-xs text-amber-700 dark:text-amber-300">
                                Brak połączonego konta. Opublikuj ręcznie:
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                                onClick={handleOpenManualPublish}
                            >
                                <Hand className="mr-2 h-4 w-4" />
                                Opublikuj ręcznie
                            </Button>
                        </div>
                    )}

                    {canRetryPublish && !isEditing && (
                        <div className="flex items-center gap-2 border-t bg-red-50 p-3 dark:bg-red-950/30">
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-red-500/50 text-red-600 hover:bg-red-500/10"
                                onClick={handlePublish}
                                disabled={isLoading}
                            >
                                {publishMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                Ponów publikację
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={handleOpenManualPublish}
                            >
                                <Hand className="mr-2 h-4 w-4" />
                                Ręcznie
                            </Button>
                        </div>
                    )}
                </Card>
            </motion.div>

            <ManualPublishModal
                open={showManualModal}
                onOpenChange={setShowManualModal}
                data={manualPublishData}
                onMarkAsPublished={handleMarkAsPublished}
            />
        </>
    );
}