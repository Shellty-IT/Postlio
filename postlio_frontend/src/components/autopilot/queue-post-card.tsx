// src/components/autopilot/queue-post-card.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    Check,
    X,
    RefreshCw,
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
import { useAutopilotStore } from '@/store/autopilot-store';
import {
    type QueuedPost,
    STATUS_CONFIG,
    CONTENT_TYPE_LABELS,
} from '@/types/autopilot';
import type { Platform } from '@/types';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

interface QueuePostCardProps {
    post: QueuedPost;
    onPreview?: (post: QueuedPost) => void;
}

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

    const { approvePost, rejectPost, regeneratePost, deleteQueuedPost } = useAutopilotStore();

    const statusConfig = STATUS_CONFIG[post.status];
    const contentTypeConfig = CONTENT_TYPE_LABELS[post.contentType];
    const isActionable = post.status === 'pending_review';
    const isGenerating = post.status === 'generating';

    const handleApprove = () => {
        approvePost(post.id);
    };

    const handleReject = () => {
        if (showRejectInput && rejectReason) {
            rejectPost(post.id, rejectReason);
            setShowRejectInput(false);
            setRejectReason('');
        } else {
            setShowRejectInput(true);
        }
    };

    const handleRegenerate = () => {
        regeneratePost(post.id);
    };

    const handleCopyContent = () => {
        navigator.clipboard.writeText(post.content);
    };

    const truncatedContent = post.content.length > 150
        ? post.content.substring(0, 150) + '...'
        : post.content;

    return (
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
                    isGenerating && 'animate-pulse'
                )}
            >
                {/* Header */}
                <div className="flex items-start gap-3 p-4">
                    {/* Image Preview */}
                    {post.imageUrl ? (
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                            <Image
                                src={post.imageUrl}
                                alt="Post preview"
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

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                        {/* Badges Row */}
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            {/* Status Badge */}
                            <Badge
                                variant="outline"
                                style={{
                                    backgroundColor: statusConfig.bgColor,
                                    borderColor: statusConfig.color,
                                    color: statusConfig.color,
                                }}
                                className="text-xs"
                            >
                                {isGenerating && <RefreshCw className="mr-1 h-3 w-3 animate-spin" />}
                                {statusConfig.label}
                            </Badge>

                            {/* Content Type Badge */}
                            <Badge variant="secondary" className="text-xs">
                                {contentTypeConfig.label}
                            </Badge>

                            {/* Platforms */}
                            <div className="flex items-center gap-1">
                                {post.platforms.map((platform) => (
                                    <TooltipProvider key={platform}>
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
                                ))}
                            </div>
                        </div>

                        {/* Content Preview */}
                        <div className="mb-2">
                            {isEditing ? (
                                <Textarea
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="min-h-[100px] text-sm"
                                />
                            ) : (
                                <p className="text-sm text-foreground/90">
                                    {isExpanded ? post.content : truncatedContent}
                                </p>
                            )}
                        </div>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(post.scheduledFor), 'dd MMM yyyy', { locale: pl })}
              </span>
                            <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                                {format(new Date(post.scheduledFor), 'HH:mm')}
              </span>
                            <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                                {post.generatedBy.toUpperCase()}
              </span>
                            {post.topic && (
                                <span className="truncate text-violet-500">#{post.topic}</span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-start gap-1">
                        {/* Expand Button */}
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

                        {/* More Actions */}
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
                                <DropdownMenuItem onClick={handleRegenerate}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Regeneruj
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => deleteQueuedPost(post.id)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Usuń
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            {/* Reject Reason Input */}
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
                                        <Button size="sm" variant="destructive" onClick={handleReject}>
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

                            {/* Variations */}
                            {post.variations && post.variations.length > 0 && (
                                <div className="border-t p-4">
                                    <h4 className="mb-2 text-sm font-medium">Wersje per platforma</h4>
                                    <div className="space-y-2">
                                        {post.variations.map((variation) => (
                                            <div
                                                key={variation.id}
                                                className="rounded-lg bg-muted/50 p-3 text-sm"
                                            >
                                                <div className="mb-1 flex items-center gap-2">
                          <span style={{ color: PLATFORM_COLORS[variation.platform] }}>
                            {PLATFORM_ICONS[variation.platform]}
                          </span>
                                                    <span className="font-medium capitalize">
                            {variation.platform}
                          </span>
                                                    <span className="text-xs text-muted-foreground">
                            ({variation.characterCount} znaków)
                          </span>
                                                </div>
                                                <p className="text-muted-foreground">{variation.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Additional Meta */}
                            <div className="flex flex-wrap items-center justify-between gap-4 border-t bg-muted/30 px-4 py-3">
                                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>
                    Wygenerowano:{' '}
                      {formatDistanceToNow(new Date(post.generatedAt), {
                          addSuffix: true,
                          locale: pl,
                      })}
                  </span>
                                    {post.reviewedAt && (
                                        <span>
                      Przejrzano:{' '}
                                            {formatDistanceToNow(new Date(post.reviewedAt), {
                                                addSuffix: true,
                                                locale: pl,
                                            })}
                    </span>
                                    )}
                                    {post.engagementScore && (
                                        <span className="text-green-500">
                      Engagement: {post.engagementScore.toFixed(1)}%
                    </span>
                                    )}
                                </div>

                                {post.publishedAt && (
                                    <Button size="sm" variant="outline" className="h-7 text-xs">
                                        <ExternalLink className="mr-1.5 h-3 w-3" />
                                        Zobacz post
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action Buttons for Pending Review */}
                {isActionable && !showRejectInput && (
                    <div className="flex items-center gap-2 border-t bg-muted/30 p-3">
                        <Button
                            size="sm"
                            className="flex-1 bg-green-600 text-white hover:bg-green-700"
                            onClick={handleApprove}
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Zatwierdź
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                            onClick={handleReject}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Odrzuć
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleRegenerate}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </Card>
        </motion.div>
    );
}