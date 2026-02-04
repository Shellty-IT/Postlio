// src/components/common/manual-publish-modal.tsx
/**
 * Modal do ręcznej publikacji posta
 *
 * ✅ PRZENIESIONY z autopilot/ do common/
 * ✅ NOWE: Integracja z useUpdatePlatformStatus (zapis do backendu)
 * ✅ NOWE: Obsługa postId dla persystencji statusu
 * ✅ ZMIANA: "Kopiuj tekst" pod tekstem, wycentrowane nagłówki
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
    Copy,
    Download,
    ExternalLink,
    Check,
    Image as ImageIcon,
    Hash,
    FileText,
    Share2,
    CheckCircle2,
    Facebook,
    Instagram,
    Linkedin,
    ClipboardCopy,
    Loader2,
} from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUpdatePlatformStatus } from '@/hooks/usePosts';
import type { ManualPublishData } from '@/types/autopilot';
import type { Platform } from '@/types';

// Re-export types
export type { ManualPublishData } from '@/types/autopilot';

// ============================================================
// TYPES
// ============================================================

interface ManualPublishModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: ManualPublishData | null;
    platforms?: Platform[];
    postId?: number | string;
    onMarkAsPublished?: (postId?: number, platform?: Platform) => void;
    onAllPublished?: (postId?: number) => void;
}

// ============================================================
// PLATFORM CONFIG
// ============================================================

const PLATFORM_CONFIG: Record<Platform, {
    name: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
}> = {
    facebook: {
        name: 'Facebook',
        icon: Facebook,
        color: '#1877F2',
        bgColor: 'rgba(24, 119, 242, 0.1)',
    },
    instagram: {
        name: 'Instagram',
        icon: Instagram,
        color: '#E4405F',
        bgColor: 'rgba(228, 64, 95, 0.1)',
    },
    linkedin: {
        name: 'LinkedIn',
        icon: Linkedin,
        color: '#0A66C2',
        bgColor: 'rgba(10, 102, 194, 0.1)',
    },
};

const PLATFORM_INSTRUCTIONS: Record<Platform, string> = {
    facebook: `1. Skopiuj treść posta (przycisk powyżej)
2. Kliknij "Udostępnij na Facebook" lub otwórz Facebook ręcznie
3. Kliknij "Napisz post" lub "Co słychać?"
4. Wklej skopiowaną treść (Ctrl+V / Cmd+V)
5. Jeśli jest zdjęcie - dodaj je (przycisk "Zdjęcie/Wideo")
6. Kliknij "Opublikuj"
7. Wróć tutaj i kliknij "Opublikowałem"`,

    instagram: `1. Pobierz zdjęcie (przycisk powyżej) - Instagram wymaga zdjęcia!
2. Skopiuj treść posta
3. Otwórz aplikację Instagram na telefonie
4. Kliknij + (nowy post) na dole ekranu
5. Wybierz pobrane zdjęcie z galerii
6. Kliknij "Dalej", dodaj filtry jeśli chcesz
7. Wklej skopiowany opis
8. Kliknij "Udostępnij"
9. Wróć tutaj i kliknij "Opublikowałem"`,

    linkedin: `1. Skopiuj treść posta (przycisk powyżej)
2. Kliknij "Udostępnij na LinkedIn" lub otwórz LinkedIn ręcznie
3. Kliknij "Rozpocznij post"
4. Wklej skopiowaną treść (Ctrl+V / Cmd+V)
5. Jeśli jest zdjęcie - kliknij ikonę obrazka i dodaj
6. Kliknij "Opublikuj"
7. Wróć tutaj i kliknij "Opublikowałem"`,
};

// ============================================================
// PLATFORM TAB CONTENT
// ============================================================

interface PlatformTabContentProps {
    platform: Platform;
    content: string;
    fullContent: string;
    hashtags: string[];
    hashtagsString: string;
    imageUrl: string | null;
    instructions: string;
    shareUrl?: string;
    isPublished: boolean;
    isUpdating: boolean;
    onMarkAsPublished: () => void;
}

function PlatformTabContent({
                                platform,
                                content,
                                fullContent,
                                hashtags,
                                hashtagsString,
                                imageUrl,
                                instructions,
                                shareUrl,
                                isPublished,
                                isUpdating,
                                onMarkAsPublished,
                            }: PlatformTabContentProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isCopyingImage, setIsCopyingImage] = useState(false);

    const platformConfig = PLATFORM_CONFIG[platform];

    const handleCopy = useCallback(async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            toast.success('Skopiowano!');
            setTimeout(() => setCopiedField(null), 2000);
        } catch {
            toast.error('Nie udało się skopiować');
        }
    }, []);

    const handleCopyImage = useCallback(async () => {
        if (!imageUrl) return;

        setIsCopyingImage(true);
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();

            if (navigator.clipboard && 'write' in navigator.clipboard) {
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob }),
                ]);
                setCopiedField('image');
                toast.success('Zdjęcie skopiowane!');
                setTimeout(() => setCopiedField(null), 2000);
            } else {
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
                toast.info('Kliknij prawym i wybierz "Kopiuj obraz"');
            }
        } catch {
            toast.error('Nie udało się skopiować zdjęcia');
        } finally {
            setIsCopyingImage(false);
        }
    }, [imageUrl]);

    const handleDownloadImage = useCallback(async () => {
        if (!imageUrl) return;

        setIsDownloading(true);
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `postlio-${platform}-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Zdjęcie pobrane!');
        } catch {
            toast.error('Nie udało się pobrać zdjęcia');
        } finally {
            setIsDownloading(false);
        }
    }, [imageUrl, platform]);

    const handleOpenPlatform = useCallback(() => {
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        } else {
            window.open(
                PLATFORM_CONFIG[platform].name === 'Instagram'
                    ? 'https://www.instagram.com'
                    : shareUrl,
                '_blank'
            );
        }
    }, [shareUrl, platform]);

    if (isPublished) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: platformConfig.bgColor }}
                >
                    <CheckCircle2
                        className="w-8 h-8"
                        style={{ color: platformConfig.color }}
                    />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                    Opublikowano na {platformConfig.name}!
                </h3>
                <p className="text-sm text-muted-foreground">
                    Ten post został oznaczony jako opublikowany.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Treść posta */}
            <div className="space-y-2">
                <label className="text-sm font-medium flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Treść posta
                </label>
                <div className="p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {content}
                </div>
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCopy(fullContent, 'content')}
                >
                    {copiedField === 'content' ? (
                        <span className="flex items-center gap-2 text-green-500">
                            <Check className="w-4 h-4" />
                            Skopiowano!
                        </span>
                    ) : (
                        <>
                            <Copy className="w-4 h-4 mr-2" />
                            Kopiuj tekst
                        </>
                    )}
                </Button>
            </div>

            {/* Hashtagi */}
            {hashtags.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Hash className="w-4 h-4 text-muted-foreground" />
                            Hashtagi
                        </label>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(hashtagsString, 'hashtags')}
                            className="h-8"
                        >
                            {copiedField === 'hashtags' ? (
                                <span className="flex items-center gap-1 text-green-500">
                                    <Check className="w-4 h-4" />
                                    Skopiowano
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <Copy className="w-4 h-4" />
                                    Kopiuj
                                </span>
                            )}
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {hashtags.map((tag, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Zdjęcie */}
            {imageUrl && (
                <>
                    <Separator />
                    <div className="space-y-2">
                        {/* ✅ ZMIANA: Nagłówek wycentrowany */}
                        <label className="text-sm font-medium flex items-center justify-center gap-2">
                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                            Zdjęcie
                        </label>
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                            <Image
                                src={imageUrl}
                                alt="Podgląd zdjęcia"
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={handleCopyImage}
                                disabled={isCopyingImage}
                            >
                                {isCopyingImage ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Kopiowanie...
                                    </span>
                                ) : copiedField === 'image' ? (
                                    <span className="flex items-center gap-2 text-green-500">
                                        <Check className="w-4 h-4" />
                                        Skopiowano!
                                    </span>
                                ) : (
                                    <>
                                        <ClipboardCopy className="w-4 h-4 mr-2" />
                                        Kopiuj zdjęcie
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={handleDownloadImage}
                                disabled={isDownloading}
                            >
                                {isDownloading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Pobieranie...
                                    </span>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4 mr-2" />
                                        Pobierz zdjęcie
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </>
            )}

            <Separator />

            {/* Instrukcje */}
            <div className="space-y-2">
                <label className="text-sm font-medium flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Instrukcje dla {platformConfig.name}
                </label>
                <div className="p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-line text-muted-foreground">
                    {instructions}
                </div>
            </div>

            {/* Akcje */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleOpenPlatform}
                >
                    {shareUrl ? (
                        <>
                            <Share2 className="w-4 h-4 mr-2" />
                            Udostępnij na {platformConfig.name}
                        </>
                    ) : (
                        <>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Otwórz {platformConfig.name}
                        </>
                    )}
                </Button>

                <Button
                    className={cn(
                        'flex-1',
                        'bg-gradient-to-r from-green-500 to-emerald-500',
                        'hover:from-green-600 hover:to-emerald-600'
                    )}
                    onClick={onMarkAsPublished}
                    disabled={isUpdating}
                >
                    {isUpdating ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Zapisywanie...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Opublikowałem na {platformConfig.name}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function ManualPublishModal({
                                       open,
                                       onOpenChange,
                                       data,
                                       platforms,
                                       postId,
                                       onMarkAsPublished,
                                       onAllPublished,
                                   }: ManualPublishModalProps) {
    // ✅ NOWE: Hook do aktualizacji statusu platformy w backendzie
    const updatePlatformStatus = useUpdatePlatformStatus({ showToast: false });

    // Memoize active platforms to avoid dependency issues
    const activePlatforms = useMemo(() => {
        if (platforms && platforms.length > 0) {
            return platforms;
        }
        return data?.platform ? [data.platform] : [];
    }, [platforms, data?.platform]);

    const [activeTab, setActiveTab] = useState<Platform>('facebook');
    const [publishedPlatforms, setPublishedPlatforms] = useState<Set<Platform>>(new Set());

    // Normalize postId to string
    const normalizedPostId = useMemo(() => {
        if (!postId && data?.post_id) return String(data.post_id);
        if (!postId && data?.item_id) return String(data.item_id);
        return postId ? String(postId) : undefined;
    }, [postId, data?.post_id, data?.item_id]);

    // Reset state when modal opens
    useEffect(() => {
        if (open && activePlatforms.length > 0) {
            setPublishedPlatforms(new Set());
            setActiveTab(activePlatforms[0]);
        }
    }, [open, activePlatforms]);

    // Handle marking platform as published
    const handleMarkPlatformPublished = useCallback(async (platform: Platform) => {
        // ✅ NOWE: Zapisz status do backendu jeśli mamy postId
        if (normalizedPostId) {
            try {
                await updatePlatformStatus.mutateAsync({
                    postId: normalizedPostId,
                    platform,
                    status: 'published',
                });
            } catch (error) {
                console.error('Failed to update platform status:', error);
                // Kontynuuj mimo błędu - user i tak opublikował ręcznie
            }
        }

        // Aktualizuj lokalny stan
        setPublishedPlatforms((prev) => {
            const next = new Set(prev);
            next.add(platform);
            return next;
        });

        // Notify parent
        const numericPostId = normalizedPostId ? parseInt(normalizedPostId, 10) : undefined;
        onMarkAsPublished?.(numericPostId, platform);

        // Check if all platforms are published
        const newPublishedCount = publishedPlatforms.size + 1;

        if (newPublishedCount === activePlatforms.length) {
            toast.success('Wszystkie platformy opublikowane! 🎉');
            onAllPublished?.(numericPostId);

            // Auto-close after short delay
            setTimeout(() => {
                onOpenChange(false);
            }, 1500);
        } else {
            // Move to next unpublished platform
            const newPublished = new Set(publishedPlatforms);
            newPublished.add(platform);

            const nextPlatform = activePlatforms.find((p) => !newPublished.has(p));
            if (nextPlatform) {
                setActiveTab(nextPlatform);
                toast.success(`Opublikowano na ${PLATFORM_CONFIG[platform].name}!`, {
                    description: `Pozostało: ${activePlatforms.length - newPublishedCount} platform(y)`,
                });
            }
        }
    }, [
        normalizedPostId,
        activePlatforms,
        publishedPlatforms,
        updatePlatformStatus,
        onMarkAsPublished,
        onAllPublished,
        onOpenChange,
    ]);

    // Legacy single-platform handler
    const handleMarkAsPublished = useCallback(() => {
        if (data?.platform) {
            handleMarkPlatformPublished(data.platform);
        }
    }, [data?.platform, handleMarkPlatformPublished]);

    if (!data) return null;

    const progress =
        activePlatforms.length > 0
            ? (publishedPlatforms.size / activePlatforms.length) * 100
            : 0;
    const isMultiPlatform = activePlatforms.length > 1;
    const isUpdating = updatePlatformStatus.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            {activePlatforms.map((platform) => {
                                const config = PLATFORM_CONFIG[platform];
                                const Icon = config.icon;
                                const isPublished = publishedPlatforms.has(platform);

                                return (
                                    <div
                                        key={platform}
                                        className={cn(
                                            'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                                            isPublished && 'ring-2 ring-green-500'
                                        )}
                                        style={{ backgroundColor: config.bgColor }}
                                    >
                                        {isPublished ? (
                                            <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <Icon className="w-4 h-4" style={{ color: config.color }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div>
                            <span>Opublikuj ręcznie</span>
                            <DialogDescription className="text-left mt-1">
                                {isMultiPlatform
                                    ? `${publishedPlatforms.size}/${activePlatforms.length} platform opublikowanych`
                                    : `Skopiuj treść i opublikuj na ${PLATFORM_CONFIG[data.platform].name}`}
                            </DialogDescription>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {/* Progress bar for multi-platform */}
                {isMultiPlatform && (
                    <div className="space-y-2">
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Postęp publikacji</span>
                            <span>
                                {publishedPlatforms.size}/{activePlatforms.length}
                            </span>
                        </div>
                    </div>
                )}

                {/* Single platform mode */}
                {!isMultiPlatform && activePlatforms.length === 1 && (
                    <div className="mt-4">
                        <PlatformTabContent
                            platform={data.platform}
                            content={data.content}
                            fullContent={data.full_content}
                            hashtags={data.hashtags}
                            hashtagsString={data.hashtags_string}
                            imageUrl={data.image_url}
                            instructions={data.instructions}
                            shareUrl={data.share_url}
                            isPublished={publishedPlatforms.has(data.platform)}
                            isUpdating={isUpdating}
                            onMarkAsPublished={handleMarkAsPublished}
                        />
                    </div>
                )}

                {/* Multi-platform mode with tabs */}
                {isMultiPlatform && (
                    <Tabs
                        value={activeTab}
                        onValueChange={(v) => setActiveTab(v as Platform)}
                        className="mt-4"
                    >
                        <TabsList
                            className="w-full grid"
                            style={{ gridTemplateColumns: `repeat(${activePlatforms.length}, 1fr)` }}
                        >
                            {activePlatforms.map((platform) => {
                                const config = PLATFORM_CONFIG[platform];
                                const Icon = config.icon;
                                const isPublished = publishedPlatforms.has(platform);

                                return (
                                    <TabsTrigger
                                        key={platform}
                                        value={platform}
                                        className={cn(
                                            'flex items-center gap-2',
                                            isPublished && 'text-green-600'
                                        )}
                                    >
                                        {isPublished ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            <Icon className="w-4 h-4" />
                                        )}
                                        <span className="hidden sm:inline">{config.name}</span>
                                        {isPublished && (
                                            <Badge
                                                variant="secondary"
                                                className="ml-1 bg-green-100 text-green-700 text-[10px] px-1"
                                            >
                                                ✓
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>

                        {activePlatforms.map((platform) => (
                            <TabsContent key={platform} value={platform} className="mt-4">
                                <PlatformTabContent
                                    platform={platform}
                                    content={data.content}
                                    fullContent={data.full_content}
                                    hashtags={data.hashtags}
                                    hashtagsString={data.hashtags_string}
                                    imageUrl={data.image_url}
                                    instructions={PLATFORM_INSTRUCTIONS[platform]}
                                    shareUrl={data.share_url}
                                    isPublished={publishedPlatforms.has(platform)}
                                    isUpdating={isUpdating}
                                    onMarkAsPublished={() => handleMarkPlatformPublished(platform)}
                                />
                            </TabsContent>
                        ))}
                    </Tabs>
                )}

                {/* Info */}
                <p className="text-xs text-center text-muted-foreground mt-4">
                    {isMultiPlatform
                        ? 'Kliknij "Opublikowałem" po publikacji na każdej platformie.'
                        : 'Po opublikowaniu kliknij "Opublikowałem" aby oznaczyć post.'}
                </p>
            </DialogContent>
        </Dialog>
    );
}