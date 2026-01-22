// src/components/autopilot/manual-publish-modal.tsx
'use client';

import { useState } from 'react';
import {
    Copy,
    Check,
    Image as ImageIcon,
    Hash,
    Facebook,
    Instagram,
    Linkedin,
    Download,
    Smartphone,
    Monitor,
    Share2,
    Bell,
    Clock,
} from 'lucide-react';
import Image from 'next/image';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { scheduleReminder, requestNotificationPermission } from '@/lib/reminders';
import type { Platform } from '@/types';

// ============================================================
// TYPY
// ============================================================

export interface ManualPublishData {
    item_id: number;
    content: string;
    full_content: string;
    hashtags: string[];
    hashtags_string: string;
    image_url: string | null;
    platform: Platform;
    platform_link: string;
    instructions: string;
    share_url?: string; // Opcjonalny URL do Share Dialog
}

interface ManualPublishModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: ManualPublishData | null;
    onMarkAsPublished?: (itemId: number) => void;
}

// ============================================================
// KONFIGURACJA
// ============================================================

const PLATFORM_CONFIG: Record<Platform, {
    name: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    webUrl: string;
    mobileDeepLink?: string;
    supportsShareDialog?: boolean;
}> = {
    facebook: {
        name: 'Facebook',
        icon: <Facebook className="h-5 w-5" />,
        color: '#1877F2',
        bgColor: 'rgba(24, 119, 242, 0.1)',
        webUrl: 'https://www.facebook.com/',
        mobileDeepLink: 'fb://feed',
        supportsShareDialog: true,
    },
    instagram: {
        name: 'Instagram',
        icon: <Instagram className="h-5 w-5" />,
        color: '#E4405F',
        bgColor: 'rgba(228, 64, 95, 0.1)',
        webUrl: 'https://www.instagram.com/',
        mobileDeepLink: 'instagram://camera',
        supportsShareDialog: false,
    },
    linkedin: {
        name: 'LinkedIn',
        icon: <Linkedin className="h-5 w-5" />,
        color: '#0A66C2',
        bgColor: 'rgba(10, 102, 194, 0.1)',
        webUrl: 'https://www.linkedin.com/feed/',
        mobileDeepLink: 'linkedin://feed',
        supportsShareDialog: true,
    },
};

const INSTRUCTIONS: Record<Platform, string> = {
    facebook: `1. Kliknij 'Skopiuj treść'
2. Otwórz Facebook (przycisk poniżej)
3. Kliknij 'Co słychać?' na swoim profilu
4. Wklej skopiowaną treść (Ctrl+V / Cmd+V)
5. Dodaj zdjęcie jeśli masz (pobierz przyciskiem)
6. Kliknij 'Opublikuj'`,
    instagram: `1. Kliknij 'Skopiuj treść'
2. Pobierz zdjęcie (Instagram wymaga zdjęcia!)
3. Otwórz aplikację Instagram
4. Kliknij + aby dodać nowy post
5. Wybierz pobrane zdjęcie
6. Wklej skopiowaną treść jako opis
7. Kliknij 'Udostępnij'`,
    linkedin: `1. Kliknij 'Skopiuj treść'
2. Otwórz LinkedIn (przycisk poniżej)
3. Kliknij 'Rozpocznij post'
4. Wklej skopiowaną treść (Ctrl+V / Cmd+V)
5. Dodaj zdjęcie jeśli masz
6. Kliknij 'Opublikuj'`,
};

// ============================================================
// REMINDER PRESETS
// ============================================================

const REMINDER_PRESETS = [
    { label: 'Za 5 minut', minutes: 5 },
    { label: 'Za 15 minut', minutes: 15 },
    { label: 'Za 30 minut', minutes: 30 },
    { label: 'Za 1 godzinę', minutes: 60 },
    { label: 'Za 2 godziny', minutes: 120 },
];

// ============================================================
// KOMPONENT
// ============================================================

export function ManualPublishModal({
                                       open,
                                       onOpenChange,
                                       data,
                                       onMarkAsPublished,
                                   }: ManualPublishModalProps) {
    const [copiedContent, setCopiedContent] = useState(false);
    const [copiedHashtags, setCopiedHashtags] = useState(false);
    const [activeTab, setActiveTab] = useState<'content' | 'image'>('content');
    const [shareUrl, setShareUrl] = useState('');
    const [isReminderOpen, setIsReminderOpen] = useState(false);

    if (!data) return null;

    const platformConfig = PLATFORM_CONFIG[data.platform];

    // Kopiuj treść
    const handleCopyContent = async () => {
        try {
            await navigator.clipboard.writeText(data.full_content);
            setCopiedContent(true);
            toast.success('Treść skopiowana do schowka!');
            setTimeout(() => setCopiedContent(false), 2000);
        } catch {
            toast.error('Nie udało się skopiować');
        }
    };

    // Kopiuj hashtagi
    const handleCopyHashtags = async () => {
        try {
            await navigator.clipboard.writeText(data.hashtags_string);
            setCopiedHashtags(true);
            toast.success('Hashtagi skopiowane!');
            setTimeout(() => setCopiedHashtags(false), 2000);
        } catch {
            toast.error('Nie udało się skopiować');
        }
    };

    // Otwórz platformę
    const handleOpenPlatform = (mobile: boolean = false) => {
        const url = mobile && platformConfig.mobileDeepLink
            ? platformConfig.mobileDeepLink
            : platformConfig.webUrl;
        window.open(url, '_blank');
    };

    // Facebook Share Dialog
    const handleFacebookShareDialog = () => {
        const urlToShare = shareUrl || data.share_url || window.location.href;
        const quote = data.content.substring(0, 280); // FB limit

        const shareDialogUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlToShare)}&quote=${encodeURIComponent(quote)}`;

        window.open(
            shareDialogUrl,
            'facebook-share-dialog',
            'width=626,height=436,left=100,top=100'
        );

        toast.success('Otwarto Facebook Share Dialog', {
            description: 'Zatwierdź publikację w oknie Facebooka.',
        });
    };

    // LinkedIn Share Dialog
    const handleLinkedInShareDialog = () => {
        const urlToShare = shareUrl || data.share_url || window.location.href;

        const shareDialogUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(urlToShare)}`;

        window.open(
            shareDialogUrl,
            'linkedin-share-dialog',
            'width=626,height=436,left=100,top=100'
        );

        toast.success('Otwarto LinkedIn Share Dialog', {
            description: 'Zatwierdź publikację w oknie LinkedIn.',
        });
    };

    // Pobierz zdjęcie
    const handleDownloadImage = async () => {
        if (!data.image_url) return;

        try {
            const response = await fetch(data.image_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `postlio-${data.platform}-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success('Zdjęcie pobrane!', {
                description: 'Znajdziesz je w folderze Pobrane.',
            });
        } catch {
            window.open(data.image_url, '_blank');
        }
    };

    // Ustaw przypomnienie
    const handleSetReminder = async (minutes: number) => {
        const hasPermission = await requestNotificationPermission();

        if (!hasPermission) {
            toast.error('Brak uprawnień do powiadomień', {
                description: 'Włącz powiadomienia w ustawieniach przeglądarki.',
            });
            return;
        }

        scheduleReminder({
            id: `post-${data.item_id}-${Date.now()}`,
            title: `⏰ Czas opublikować post na ${platformConfig.name}!`,
            body: data.content.substring(0, 100) + '...',
            scheduledFor: new Date(Date.now() + minutes * 60 * 1000),
            platform: data.platform,
            postData: data,
        });

        toast.success(`Przypomnienie ustawione!`, {
            description: `Powiadomimy Cię za ${minutes} minut.`,
        });

        setIsReminderOpen(false);
    };

    // Oznacz jako opublikowane
    const handleMarkAsPublished = () => {
        onMarkAsPublished?.(data.item_id);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-full"
                            style={{ backgroundColor: platformConfig.bgColor }}
                        >
                            <span style={{ color: platformConfig.color }}>
                                {platformConfig.icon}
                            </span>
                        </div>
                        <div>
                            <DialogTitle>Opublikuj ręcznie na {platformConfig.name}</DialogTitle>
                            <DialogDescription>
                                Skopiuj treść, otwórz {platformConfig.name} i opublikuj sam.
                                To jedyna legalna metoda dla kont osobistych.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Separator className="my-4" />

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'content' | 'image')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="content" className="gap-2">
                            <Copy className="h-4 w-4" />
                            Treść
                        </TabsTrigger>
                        <TabsTrigger value="image" className="gap-2" disabled={!data.image_url}>
                            <ImageIcon className="h-4 w-4" />
                            Zdjęcie {data.image_url && '✓'}
                        </TabsTrigger>
                    </TabsList>

                    {/* Content Tab */}
                    <TabsContent value="content" className="mt-4 space-y-4">
                        {/* Content Preview */}
                        <div className="relative">
                            <div className="rounded-lg border bg-muted/50 p-4 pr-24">
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                    {data.content}
                                </p>
                                {data.hashtags_string && (
                                    <p className="mt-3 text-sm text-violet-500">
                                        {data.hashtags_string}
                                    </p>
                                )}
                            </div>
                            <Button
                                size="sm"
                                className={cn(
                                    'absolute right-2 top-2 transition-all',
                                    copiedContent && 'bg-green-600 hover:bg-green-700'
                                )}
                                onClick={handleCopyContent}
                            >
                                {copiedContent ? (
                                    <>
                                        <Check className="mr-2 h-4 w-4" />
                                        Skopiowano!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Kopiuj
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Hashtags only */}
                        {data.hashtags.length > 0 && (
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <div className="flex flex-wrap gap-1">
                                    {data.hashtags.slice(0, 5).map((tag, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">
                                            <Hash className="mr-1 h-3 w-3" />
                                            {tag}
                                        </Badge>
                                    ))}
                                    {data.hashtags.length > 5 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{data.hashtags.length - 5}
                                        </Badge>
                                    )}
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCopyHashtags}
                                    className={cn(
                                        'shrink-0 ml-2 transition-all',
                                        copiedHashtags && 'border-green-500 text-green-600'
                                    )}
                                >
                                    {copiedHashtags ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    {/* Image Tab */}
                    <TabsContent value="image" className="mt-4">
                        {data.image_url && (
                            <div className="space-y-4">
                                <div className="relative aspect-square max-h-[300px] w-full overflow-hidden rounded-lg border">
                                    <Image
                                        src={data.image_url}
                                        alt="Post image"
                                        fill
                                        className="object-contain"
                                        unoptimized
                                    />
                                </div>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={handleDownloadImage}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Pobierz zdjęcie
                                </Button>
                                <p className="text-xs text-muted-foreground text-center">
                                    Pobierz zdjęcie na telefon/komputer, potem dodaj je w {platformConfig.name}
                                </p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <Separator className="my-4" />

                {/* Share Dialog (Facebook/LinkedIn) */}
                {platformConfig.supportsShareDialog && (
                    <div className="space-y-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
                        <div className="flex items-center gap-2">
                            <Share2 className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">
                                Share Dialog (opcjonalnie)
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Jeśli chcesz udostępnić link, użyj oficjalnego Share Dialog.
                            Treść posta zostanie dodana jako cytat.
                        </p>
                        <div className="flex gap-2">
                            <Input
                                placeholder="https://twoja-strona.pl/artykul"
                                value={shareUrl}
                                onChange={(e) => setShareUrl(e.target.value)}
                                className="flex-1 text-sm"
                            />
                            <Button
                                variant="outline"
                                onClick={data.platform === 'facebook'
                                    ? handleFacebookShareDialog
                                    : handleLinkedInShareDialog
                                }
                                style={{ borderColor: platformConfig.color, color: platformConfig.color }}
                            >
                                <Share2 className="mr-2 h-4 w-4" />
                                Udostępnij
                            </Button>
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="rounded-lg bg-muted/50 p-4">
                    <h4 className="mb-2 text-sm font-medium flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                            ?
                        </span>
                        Instrukcja krok po kroku
                    </h4>
                    <p className="whitespace-pre-line text-sm text-muted-foreground">
                        {INSTRUCTIONS[data.platform]}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Button
                        className="flex-1 text-white"
                        style={{ backgroundColor: platformConfig.color }}
                        onClick={() => handleOpenPlatform(false)}
                    >
                        <Monitor className="mr-2 h-4 w-4" />
                        Otwórz {platformConfig.name}
                    </Button>

                    {platformConfig.mobileDeepLink && (
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleOpenPlatform(true)}
                        >
                            <Smartphone className="mr-2 h-4 w-4" />
                            Otwórz aplikację
                        </Button>
                    )}

                    {/* Reminder button */}
                    <Popover open={isReminderOpen} onOpenChange={setIsReminderOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0">
                                <Bell className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56" align="end">
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Przypomnij mi
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Otrzymasz powiadomienie o publikacji
                                </p>
                                <div className="grid gap-1">
                                    {REMINDER_PRESETS.map((preset) => (
                                        <Button
                                            key={preset.minutes}
                                            variant="ghost"
                                            size="sm"
                                            className="justify-start h-8"
                                            onClick={() => handleSetReminder(preset.minutes)}
                                        >
                                            {preset.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Mark as Published */}
                <div className="mt-4 flex items-center justify-between rounded-lg border border-dashed border-green-500/30 bg-green-500/5 p-3">
                    <p className="text-sm text-muted-foreground">
                        Po opublikowaniu postu kliknij →
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 border-green-500/50 text-green-600 hover:bg-green-500/10"
                        onClick={handleMarkAsPublished}
                    >
                        <Check className="mr-2 h-4 w-4" />
                        Opublikowałem!
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================
// HELPER FUNCTION - generowanie danych do modalu
// ============================================================

export function createManualPublishData(
    item: {
        id: number;
        content: string;
        hashtags: string[];
        image_url: string | null;
        platform: Platform;
        share_url?: string;
    }
): ManualPublishData {
    const hashtags_string = item.hashtags.length > 0
        ? item.hashtags.map(tag => `#${tag.replace('#', '')}`).join(' ')
        : '';

    const full_content = hashtags_string
        ? `${item.content}\n\n${hashtags_string}`
        : item.content;

    const platform_links: Record<Platform, string> = {
        facebook: 'https://www.facebook.com/',
        instagram: 'https://www.instagram.com/',
        linkedin: 'https://www.linkedin.com/feed/',
    };

    return {
        item_id: item.id,
        content: item.content,
        full_content,
        hashtags: item.hashtags,
        hashtags_string,
        image_url: item.image_url,
        platform: item.platform,
        platform_link: platform_links[item.platform] || '',
        instructions: INSTRUCTIONS[item.platform] || 'Skopiuj treść i opublikuj ręcznie.',
        share_url: item.share_url,
    };
}