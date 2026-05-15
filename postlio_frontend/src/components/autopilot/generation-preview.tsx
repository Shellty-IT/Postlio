// src/components/autopilot/generation-preview.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Copy,
    Check,
    RefreshCw,
    Edit3,
    Calendar,
    Clock,
    Sparkles,
    Image as ImageIcon,
    Facebook,
    Instagram,
    Linkedin,
    Heart,
    MessageCircle,
    Bookmark,
    MoreHorizontal,
    Send,
    Loader2,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useApproveQueueItem, useRejectQueueItem, useUpdateQueueItem } from '@/hooks/useAutopilot';
import type { BackendQueueItem, BackendQueueStatus } from '@/types/autopilot';
import type { Platform } from '@/types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

// ============================================================
// TYPY
// ============================================================

interface GenerationPreviewProps {
    post: BackendQueueItem | null;
    isOpen: boolean;
    onClose: () => void;
}

// ============================================================
// KONFIGURACJA STATUSÓW (wszystkie z BackendQueueStatus)
// ============================================================

const STATUS_CONFIG: Record<BackendQueueStatus, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Oczekuje', color: '#F59E0B', bgColor: '#FEF3C7' },
    approved: { label: 'Zatwierdzony', color: '#10B981', bgColor: '#D1FAE5' },
    rejected: { label: 'Odrzucony', color: '#EF4444', bgColor: '#FEE2E2' },
    scheduled: { label: 'Zaplanowany', color: '#3B82F6', bgColor: '#DBEAFE' },
    published: { label: 'Opublikowany', color: '#22C55E', bgColor: '#DCFCE7' },
    failed: { label: 'Błąd', color: '#EF4444', bgColor: '#FEE2E2' },
};

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
    facebook: <Facebook className="h-5 w-5" />,
    instagram: <Instagram className="h-5 w-5" />,
    linkedin: <Linkedin className="h-5 w-5" />,
};

// ============================================================
// KOMPONENT GŁÓWNY
// ============================================================

export function GenerationPreview({ post, isOpen, onClose }: GenerationPreviewProps) {
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');

    // React Query hooks
    const approveMutation = useApproveQueueItem();
    const rejectMutation = useRejectQueueItem();
    const updateMutation = useUpdateQueueItem();

    if (!post) return null;

    const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.pending;
    // BackendQueueItem ma `platform` (singular), nie `platforms`
    const platform = post.platform as Platform;
    const providerUsed = post.text_provider_used || 'AI';

    const handleCopy = () => {
        navigator.clipboard.writeText(post.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleApprove = async () => {
        await approveMutation.mutateAsync({ itemId: post.id });        onClose();
    };

    const handleReject = async () => {
        await rejectMutation.mutateAsync({ itemId: post.id });
        onClose();
    };

    const handleEdit = () => {
        setEditedContent(post.content);
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        await updateMutation.mutateAsync({
            itemId: post.id,
            data: { content: editedContent },
        });
        setIsEditing(false);
    };

    const isLoading = approveMutation.isPending || rejectMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0">
                <DialogHeader className="border-b p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <DialogTitle className="text-lg">Podgląd posta</DialogTitle>
                            <DialogDescription className="sr-only">
                                Podgląd wygenerowanego posta z możliwością zatwierdzenia lub odrzucenia
                            </DialogDescription>
                            <Badge
                                variant="outline"
                                style={{
                                    backgroundColor: statusConfig.bgColor,
                                    borderColor: statusConfig.color,
                                    color: statusConfig.color,
                                }}
                            >
                                {statusConfig.label}
                            </Badge>
                            {providerUsed && (
                                <Badge variant="secondary">
                                    {providerUsed.toUpperCase()}
                                </Badge>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid max-h-[calc(90vh-180px)] gap-6 overflow-y-auto p-6 lg:grid-cols-2">
                    {/* Left Side - Content */}
                    <div className="space-y-4">
                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(post.scheduled_for), 'dd MMMM yyyy', { locale: pl })}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                {format(new Date(post.scheduled_for), 'HH:mm')}
                            </span>
                            {providerUsed && (
                                <span className="flex items-center gap-1.5">
                                    <Sparkles className="h-4 w-4" />
                                    {providerUsed.toUpperCase()}
                                </span>
                            )}
                        </div>

                        {/* Platform */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Platforma:</span>
                            <Button
                                variant="default"
                                size="sm"
                                className="h-8 gap-1.5 bg-violet-600 hover:bg-violet-700"
                            >
                                {PLATFORM_ICONS[platform]}
                                <span className="capitalize">{platform}</span>
                            </Button>
                        </div>

                        {/* Content */}
                        <Card className="p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <h4 className="font-medium">Treść</h4>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
                                        {copied ? (
                                            <Check className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleEdit}>
                                        <Edit3 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {isEditing ? (
                                <div className="space-y-2">
                                    <Textarea
                                        value={editedContent}
                                        onChange={(e) => setEditedContent(e.target.value)}
                                        className="min-h-[200px]"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={handleSaveEdit}
                                            disabled={updateMutation.isPending}
                                        >
                                            {updateMutation.isPending && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            Zapisz
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                                            Anuluj
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                    {post.content}
                                </p>
                            )}
                        </Card>

                        {/* Hashtags */}
                        {post.hashtags && post.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {post.hashtags.map((tag, index) => (
                                    <Badge key={index} variant="secondary">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Image */}
                        {post.image_url && (
                            <Card className="overflow-hidden">
                                <div className="relative aspect-video">
                                    <Image
                                        src={post.image_url}
                                        alt="Generated"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                    <div className="absolute bottom-2 right-2">
                                        <Badge variant="secondary" className="bg-black/50 text-white">
                                            <ImageIcon className="mr-1 h-3 w-3" />
                                            {post.image_provider_used || 'AI'} Generated
                                        </Badge>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Topic */}
                        {post.topic_used && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Temat:</span>
                                <Badge variant="outline" className="text-violet-600">
                                    {post.topic_used}
                                </Badge>
                            </div>
                        )}

                        {/* Category */}
                        {post.category && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Kategoria:</span>
                                <Badge variant="outline">
                                    {post.category}
                                </Badge>
                            </div>
                        )}

                        {/* User Notes */}
                        {post.user_notes && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
                                <p className="text-sm text-amber-800 dark:text-amber-200">
                                    <span className="font-medium">Notatka:</span> {post.user_notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Side - Platform Preview */}
                    <div className="space-y-4">
                        <h4 className="font-medium">Podgląd na platformie</h4>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={platform}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {platform === 'instagram' && (
                                    <InstagramPreview post={post} />
                                )}
                                {platform === 'facebook' && (
                                    <FacebookPreview post={post} />
                                )}
                                {platform === 'linkedin' && (
                                    <LinkedInPreview post={post} />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer Actions */}
                {post.status === 'pending' && (
                    <div className="flex items-center justify-between border-t bg-muted/30 p-4">
                        <Button variant="outline" disabled={isLoading}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Regeneruj
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                                onClick={handleReject}
                                disabled={isLoading}
                            >
                                {rejectMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Odrzuć
                            </Button>
                            <Button
                                className="bg-green-600 text-white hover:bg-green-700"
                                onClick={handleApprove}
                                disabled={isLoading}
                            >
                                {approveMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="mr-2 h-4 w-4" />
                                )}
                                Zatwierdź i zaplanuj
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ============================================================
// INSTAGRAM PREVIEW
// ============================================================

function InstagramPreview({ post }: { post: BackendQueueItem }) {
    return (
        <Card className="overflow-hidden bg-white text-black dark:bg-white">
            {/* Header */}
            <div className="flex items-center gap-3 p-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-0.5">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-xs font-bold">
                        B
                    </div>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold">brand_name</p>
                    <p className="text-xs text-gray-500">Sponsored</p>
                </div>
                <MoreHorizontal className="h-5 w-5 text-gray-500" />
            </div>

            {/* Image */}
            {post.image_url ? (
                <div className="relative aspect-square w-full">
                    <Image
                        src={post.image_url}
                        alt="Post"
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </div>
            ) : (
                <div className="flex aspect-square items-center justify-center bg-gray-100">
                    <ImageIcon className="h-12 w-12 text-gray-300" />
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-4">
                    <Heart className="h-6 w-6" />
                    <MessageCircle className="h-6 w-6" />
                    <Send className="h-6 w-6" />
                </div>
                <Bookmark className="h-6 w-6" />
            </div>

            {/* Content */}
            <div className="px-3 pb-3">
                <p className="text-sm font-semibold">1,234 polubień</p>
                <p className="mt-1 text-sm">
                    <span className="font-semibold">brand_name</span>{' '}
                    {post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}
                </p>
                <p className="mt-1 text-xs text-gray-500">2 GODZINY TEMU</p>
            </div>
        </Card>
    );
}

// ============================================================
// FACEBOOK PREVIEW
// ============================================================

function FacebookPreview({ post }: { post: BackendQueueItem }) {
    return (
        <Card className="overflow-hidden bg-white text-black dark:bg-white">
            {/* Header */}
            <div className="flex items-center gap-3 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                    B
                </div>
                <div className="flex-1">
                    <p className="font-semibold">Brand Name</p>
                    <p className="text-xs text-gray-500">2 godz. · 🌍</p>
                </div>
                <MoreHorizontal className="h-5 w-5 text-gray-500" />
            </div>

            {/* Content */}
            <div className="px-3 pb-3">
                <p className="text-sm whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Image */}
            {post.image_url && (
                <div className="relative aspect-video w-full">
                    <Image
                        src={post.image_url}
                        alt="Post"
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between border-t px-3 py-2 text-sm text-gray-500">
                <span>👍 ❤️ 234</span>
                <span>45 komentarzy · 12 udostępnień</span>
            </div>

            {/* Actions */}
            <div className="flex border-t">
                {['Lubię to!', 'Skomentuj', 'Udostępnij'].map((action) => (
                    <button
                        key={action}
                        className="flex flex-1 items-center justify-center gap-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
                    >
                        {action}
                    </button>
                ))}
            </div>
        </Card>
    );
}

// ============================================================
// LINKEDIN PREVIEW
// ============================================================

function LinkedInPreview({ post }: { post: BackendQueueItem }) {
    return (
        <Card className="overflow-hidden bg-white text-black dark:bg-white">
            {/* Header */}
            <div className="flex items-center gap-3 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-white font-bold">
                    B
                </div>
                <div className="flex-1">
                    <p className="font-semibold">Brand Name</p>
                    <p className="text-xs text-gray-500">1,234 obserwujących</p>
                    <p className="text-xs text-gray-500">2 godz. · 🌍</p>
                </div>
                <MoreHorizontal className="h-5 w-5 text-gray-500" />
            </div>

            {/* Content */}
            <div className="px-4 pb-3">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
            </div>

            {/* Image */}
            {post.image_url && (
                <div className="relative aspect-video w-full">
                    <Image
                        src={post.image_url}
                        alt="Post"
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                    <span className="flex -space-x-1">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[8px] text-white">👍</span>
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">❤️</span>
                    </span>
                    156
                </span>
                <span>·</span>
                <span>23 komentarze</span>
                <span>·</span>
                <span>8 udostępnień</span>
            </div>

            {/* Actions */}
            <div className="flex border-t">
                {[
                    { icon: '👍', label: 'Lubię' },
                    { icon: '💬', label: 'Komentarz' },
                    { icon: '🔄', label: 'Udostępnij' },
                    { icon: '📤', label: 'Wyślij' },
                ].map((action) => (
                    <button
                        key={action.label}
                        className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium text-gray-500 hover:bg-gray-100"
                    >
                        <span>{action.icon}</span>
                        <span>{action.label}</span>
                    </button>
                ))}
            </div>
        </Card>
    );
}