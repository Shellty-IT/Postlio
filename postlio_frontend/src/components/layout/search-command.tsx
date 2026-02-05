// src/components/layout/search-command.tsx


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
} from 'lucide-react';
import { usePosts } from '@/hooks/usePosts';
import { cn } from '@/lib/utils';
import type { Platform } from '@/types';

// ============================================================
// TYPY
// ============================================================

interface SearchCommandProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// ============================================================
// KONFIGURACJA
// ============================================================

const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Przegląd aktywności' },
    { name: 'Kreator AI', href: '/creator', icon: PenTool, description: 'Twórz posty z AI' },
    { name: 'Kalendarz', href: '/calendar', icon: Calendar, description: 'Zaplanowane publikacje' },
    { name: 'Materiały', href: '/saved-posts', icon: FileText, description: 'Zapisane posty' },
    { name: 'Marki', href: '/brands', icon: Building2, description: 'Styl pisania' },
    { name: 'Autopilot', href: '/autopilot', icon: Zap, description: 'Automatyczne publikacje' },
    { name: 'Ustawienia', href: '/settings', icon: Settings, description: 'Konfiguracja konta' },
];

const platformIcons: Record<Platform, typeof Facebook> = {
    facebook: Facebook,
    instagram: Instagram,
    linkedin: Linkedin,
};

const platformColors: Record<Platform, string> = {
    facebook: 'text-[#1877F2]',
    instagram: 'text-[#E4405F]',
    linkedin: 'text-[#0A66C2]',
};

// ============================================================
// KOMPONENT
// ============================================================

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');

    // Pobierz posty do wyszukiwania
    const { data: postsData } = usePosts({ limit: 50 });
    const posts = postsData?.posts || [];

    // Filtruj posty po wyszukiwaniu
    const filteredPosts = posts.filter((post) =>
        post.content?.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 5);

    // Obsługa nawigacji
    const handleSelect = useCallback((href: string) => {
        onOpenChange(false);
        router.push(href);
    }, [router, onOpenChange]);

    // Obsługa edycji posta
    const handleEditPost = useCallback((postId: number | string) => {
        onOpenChange(false);
        router.push(`/creator?edit=${postId}`);
    }, [router, onOpenChange]);

    // Keyboard shortcut
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

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput
                placeholder="Szukaj postów, stron..."
                value={search}
                onValueChange={setSearch}
            />
            <CommandList>
                <CommandEmpty>
                    <div className="flex flex-col items-center py-6 text-muted-foreground">
                        <Search className="h-10 w-10 mb-2 opacity-20" />
                        <p>Nie znaleziono wyników</p>
                        <p className="text-sm">Spróbuj innej frazy</p>
                    </div>
                </CommandEmpty>

                {/* Nawigacja */}
                <CommandGroup heading="Nawigacja">
                    {navigationItems.map((item) => (
                        <CommandItem
                            key={item.href}
                            value={item.name}
                            onSelect={() => handleSelect(item.href)}
                            className="flex items-center gap-3 py-3"
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                                <item.icon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                        </CommandItem>
                    ))}
                </CommandGroup>

                {/* Posty */}
                {filteredPosts.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Posty">
                            {filteredPosts.map((post) => {
                                const platform = post.platforms?.[0] || post.platform || 'facebook';
                                const PlatformIcon = platformIcons[platform as Platform];
                                const isScheduled = post.status === 'scheduled';
                                const isPublished = post.status === 'published';

                                return (
                                    <CommandItem
                                        key={post.id}
                                        value={post.content || ''}
                                        onSelect={() => handleEditPost(post.id)}
                                        className="flex items-center gap-3 py-3"
                                    >
                                        <div className={cn(
                                            'flex h-9 w-9 items-center justify-center rounded-lg',
                                            'bg-muted',
                                            platformColors[platform as Platform]
                                        )}>
                                            <PlatformIcon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate text-sm">
                                                {post.content?.slice(0, 50)}...
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {isScheduled && (
                                                    <span className="flex items-center gap-1 text-amber-500">
                                                        <Clock className="h-3 w-3" />
                                                        Zaplanowany
                                                    </span>
                                                )}
                                                {isPublished && (
                                                    <span className="flex items-center gap-1 text-green-500">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Opublikowany
                                                    </span>
                                                )}
                                                {!isScheduled && !isPublished && (
                                                    <span className="flex items-center gap-1">
                                                        <Edit3 className="h-3 w-3" />
                                                        Szkic
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </>
                )}

                {/* Szybkie akcje */}
                <CommandSeparator />
                <CommandGroup heading="Szybkie akcje">
                    <CommandItem
                        onSelect={() => handleSelect('/creator')}
                        className="flex items-center gap-3 py-3"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-violet-500 text-white">
                            <PenTool className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="font-medium">Nowy post</p>
                            <p className="text-xs text-muted-foreground">Utwórz post z pomocą AI</p>
                        </div>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}

export default SearchCommand;