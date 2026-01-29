// src/components/creator/manual-publish-modal.tsx
/**
 * Modal do ręcznej publikacji posta
 *
 * Wyświetla instrukcje i narzędzia do kopiowania/pobierania
 * dla użytkowników z kontami osobistymi.
 */

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ManualPublishData } from '@/types/autopilot';
import type { Platform } from '@/types';

// ============================================================
// TYPES
// ============================================================

interface ManualPublishModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: ManualPublishData | null;
    onMarkAsPublished?: () => void;
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

// ============================================================
// COMPONENT
// ============================================================

export function ManualPublishModal({
                                       open,
                                       onOpenChange,
                                       data,
                                       onMarkAsPublished,
                                   }: ManualPublishModalProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // ========================================
    // Copy to clipboard
    // ========================================
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

    // ========================================
    // Download image
    // ========================================
    const handleDownloadImage = useCallback(async () => {
        if (!data?.image_url) return;

        setIsDownloading(true);
        try {
            const response = await fetch(data.image_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `postlio-${data.platform}-${Date.now()}.png`;
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
    }, [data]);

    // ========================================
    // Open platform
    // ========================================
    const handleOpenPlatform = useCallback(() => {
        if (!data) return;

        // Jeśli jest share URL (Facebook/LinkedIn), użyj go
        if (data.share_url) {
            window.open(data.share_url, '_blank', 'width=600,height=400');
        } else {
            window.open(data.platform_link, '_blank');
        }
    }, [data]);

    // ========================================
    // Mark as published
    // ========================================
    const handleMarkAsPublished = useCallback(() => {
        onMarkAsPublished?.();
    }, [onMarkAsPublished]);

    if (!data) return null;

    const platformConfig = PLATFORM_CONFIG[data.platform];
    const PlatformIcon = platformConfig.icon;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: platformConfig.bgColor }}
                        >
                            <PlatformIcon
                                className="w-5 h-5"
                                style={{ color: platformConfig.color }}
                            />
                        </div>
                        <div>
                            <span>Opublikuj na {platformConfig.name}</span>
                            <DialogDescription className="text-left mt-1">
                                Skopiuj treść i opublikuj ręcznie
                            </DialogDescription>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Treść posta */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                Treść posta
                            </label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(data.content, 'content')}
                                className="h-8"
                            >
                                <AnimatePresence mode="wait">
                                    {copiedField === 'content' ? (
                                        <motion.div
                                            key="check"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="flex items-center gap-1 text-green-500"
                                        >
                                            <Check className="w-4 h-4" />
                                            <span>Skopiowano</span>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="copy"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                            className="flex items-center gap-1"
                                        >
                                            <Copy className="w-4 h-4" />
                                            <span>Kopiuj</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Button>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {data.content}
                        </div>
                    </div>

                    {/* Hashtagi */}
                    {data.hashtags.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-muted-foreground" />
                                    Hashtagi
                                </label>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopy(data.hashtags_string, 'hashtags')}
                                    className="h-8"
                                >
                                    <AnimatePresence mode="wait">
                                        {copiedField === 'hashtags' ? (
                                            <motion.div
                                                key="check"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                                className="flex items-center gap-1 text-green-500"
                                            >
                                                <Check className="w-4 h-4" />
                                                <span>Skopiowano</span>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="copy"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                                className="flex items-center gap-1"
                                            >
                                                <Copy className="w-4 h-4" />
                                                <span>Kopiuj</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {data.hashtags.map((tag, index) => (
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

                    {/* Kopiuj wszystko */}
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleCopy(data.full_content, 'full')}
                    >
                        <AnimatePresence mode="wait">
                            {copiedField === 'full' ? (
                                <motion.div
                                    key="check"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="flex items-center gap-2 text-green-500"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>Skopiowano treść + hashtagi</span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="copy"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="flex items-center gap-2"
                                >
                                    <Copy className="w-4 h-4" />
                                    <span>Kopiuj treść + hashtagi</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Button>

                    {/* Zdjęcie */}
                    {data.image_url && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                    Zdjęcie
                                </label>
                                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                                    <img
                                        src={data.image_url}
                                        alt="Post image"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleDownloadImage}
                                    disabled={isDownloading}
                                >
                                    {isDownloading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            <span>Pobieranie...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4 mr-2" />
                                            Pobierz zdjęcie
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}

                    <Separator />

                    {/* Instrukcje */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Instrukcje</label>
                        <div className="p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-line text-muted-foreground">
                            {data.instructions}
                        </div>
                    </div>

                    {/* Akcje */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleOpenPlatform}
                        >
                            {data.share_url ? (
                                <>
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Udostępnij
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
                                "flex-1",
                                "bg-gradient-to-r from-green-500 to-emerald-500",
                                "hover:from-green-600 hover:to-emerald-600"
                            )}
                            onClick={handleMarkAsPublished}
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Opublikowałem
                        </Button>
                    </div>

                    {/* Info */}
                    <p className="text-xs text-center text-muted-foreground">
                        Po opublikowaniu kliknij &quot;Opublikowałem&quot; aby oznaczyć post jako opublikowany.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}