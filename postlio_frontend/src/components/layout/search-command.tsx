'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from '@/components/ui/command';
import {
    LayoutDashboard,
    PenTool,
    Calendar,
    FileText,
    Building2,
    Zap,
    Settings,
    Search,
    Facebook,
    Instagram,
    Linkedin,
    Clock,
    CheckCircle2,
    Edit3,
    Sparkles,
    ArrowRight,
} from 'lucide-react';
import { usePosts } from '@/hooks/usePosts';
import { cn } from '@/lib/utils';
import type { Platform } from '@/types';

interface SearchCommandProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Przegląd aktywności', color: 'text-blue-500' },
    { name: 'Kreator AI', href: '/creator', icon: PenTool, description: 'Twórz posty z AI', color: 'text-violet-500' },
    { name: 'Kalendarz', href: '/calendar', icon: Calendar, description: 'Zaplanowane publikacje', color: 'text-emerald-500' },
    { name: 'Materiały', href: '/saved-posts', icon: FileText, description: 'Zapisane posty', color: 'text-amber-500' },
    { name: 'Marki', href: '/brands', icon: Building2, description: 'Styl pisania', color: 'text-pink-500' },
    { name: 'Autopilot', href: '/autopilot', icon: Zap, description: 'Automatyczne publikacje', color: 'text-orange-500' },
    { name: 'Ustawienia', href: '/settings', icon: Settings, description: 'Konfiguracja konta', color: 'text-slate-500' },
];

const platformIcons: Record<Platform, typeof Facebook> = {
    facebook: Facebook,
    instagram: Instagram,
    linkedin: Linkedin,
};

const platformColors: Record<Platform, { text: string; bg: string }> = {
    facebook: { text: 'text-[#1877F2]', bg: 'bg-[#1877F2]/10' },
    instagram: { text: 'text-[#E4405F]', bg: 'bg-[#E4405F]/10' },
    linkedin: { text: 'text-[#0A66C2]', bg: 'bg-[#0A66C2]/10' },
};

const statusConfig = {
    scheduled: { icon: Clock, label: 'Zaplanowany', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    published: { icon: CheckCircle2, label: 'Opublikowany', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    draft: { icon: Edit3, label: 'Szkic', color: 'text-slate-500', bg: 'bg-slate-500/10' },
};

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');

    const { data: postsData } = usePosts({ limit: 50 });
    const posts = postsData?.posts || [];

    const filteredPosts = posts.filter((post) =>
        post.content?.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 5);

    const handleSelect = useCallback((href: string) => {
        onOpenChange(false);
        router.push(href);
    }, [router, onOpenChange]);

    const handleEditPost = useCallback((postId: number | string) => {
        onOpenChange(false);
        router.push(`/creator?edit=${postId}`);
    }, [router, onOpenChange]);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onOpenChange(!open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [open, onOpenChange]);

    useEffect(() => {
        if (!open) setSearch('');
    }, [open]);

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput
                placeholder="Szukaj postów, stron..."
                value={search}
                onValueChange={setSearch}
            />
            <CommandList className="max-h-[60vh] sm:max-h-[400px]">
                <CommandEmpty>
                    <div className="flex flex-col items-center py-6 sm:py-8 text-muted-foreground">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                            <Search className="h-5 w-5 sm:h-6 sm:w-6 opacity-50" />
                        </div>
                        <p className="font-medium text-sm sm:text-base">Nie znaleziono wyników</p>
                        <p className="text-xs sm:text-sm opacity-70">Spróbuj innej frazy</p>
                    </div>
                </CommandEmpty>

                <CommandGroup heading="Nawigacja">
                    {navigationItems.map((item) => (
                        <CommandItem
                            key={item.href}
                            value={item.name}
                            onSelect={() => handleSelect(item.href)}
                            className="py-3 sm:py-2"
                        >
                            <div className={cn(
                                "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl",
                                "bg-muted/80 dark:bg-muted/50",
                                "transition-colors group-hover:bg-muted flex-shrink-0"
                            )}>
                                <item.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", item.color)} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm sm:text-base">{item.name}</p>
                                <p className="text-xs text-muted-foreground hidden xs:block">{item.description}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                        </CommandItem>
                    ))}
                </CommandGroup>

                {filteredPosts.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Posty">
                            {filteredPosts.map((post) => {
                                const platform = (post.platforms?.[0] || post.platform || 'facebook') as Platform;
                                const PlatformIcon = platformIcons[platform];
                                const platformStyle = platformColors[platform];

                                const status = post.status === 'scheduled' ? 'scheduled'
                                    : post.status === 'published' ? 'published'
                                        : 'draft';
                                const statusInfo = statusConfig[status];
                                const StatusIcon = statusInfo.icon;

                                return (
                                    <CommandItem
                                        key={post.id}
                                        value={post.content || ''}
                                        onSelect={() => handleEditPost(post.id)}
                                        className="py-3 sm:py-2"
                                    >
                                        <div className={cn(
                                            'flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl flex-shrink-0',
                                            platformStyle.bg
                                        )}>
                                            <PlatformIcon className={cn("h-4 w-4 sm:h-5 sm:w-5", platformStyle.text)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate text-foreground text-sm">
                                                {post.content?.slice(0, 40) || 'Bez treści'}
                                                {post.content && post.content.length > 40 && '...'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 text-[10px] sm:text-xs px-1.5 py-0.5 rounded",
                                                    statusInfo.bg,
                                                    statusInfo.color
                                                )}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    <span className="hidden xs:inline">{statusInfo.label}</span>
                                                </span>
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </>
                )}

                <CommandSeparator />
                <CommandGroup heading="Szybkie akcje">
                    <CommandItem
                        onSelect={() => handleSelect('/creator')}
                        className="py-3 sm:py-2"
                    >
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-violet-500 shadow-lg shadow-primary/25 flex-shrink-0">
                            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm sm:text-base">Nowy post z AI</p>
                            <p className="text-xs text-muted-foreground hidden xs:block">Utwórz post z pomocą AI</p>
                        </div>
                        <CommandShortcut className="hidden sm:inline-flex">⌘N</CommandShortcut>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}

export default SearchCommand;