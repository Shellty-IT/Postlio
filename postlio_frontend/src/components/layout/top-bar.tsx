// src/components/layout/top-bar.tsx
/**
 * Górny pasek nawigacji w dashboard
 */

'use client';

import { usePathname } from 'next/navigation';
import {
    Search,
    Bell,
    Menu,
    Command,
    Plus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserMenu } from './user-menu';
import { useBrandsStore } from '@/store/brands-store';

// ============================================================
// TYPY
// ============================================================

interface TopBarProps {
    onMenuClick?: () => void;
}

// ============================================================
// PAGE TITLES
// ============================================================

const pageTitles: Record<string, { title: string; description: string }> = {
    '/dashboard': {
        title: 'Dashboard',
        description: 'Przegląd Twoich działań',
    },
    '/creator': {
        title: 'Kreator',
        description: 'Twórz posty z AI',
    },
    '/calendar': {
        title: 'Kalendarz',
        description: 'Zaplanowane publikacje',
    },
    '/brands': {
        title: 'Marki',
        description: 'Zarządzaj Brand Voice DNA',
    },
    '/autopilot': {
        title: 'Autopilot',
        description: 'Automatyczne publikacje',
    },
    '/settings': {
        title: 'Ustawienia',
        description: 'Konfiguracja konta',
    },
};

// ============================================================
// KOMPONENT
// ============================================================

export function TopBar({ onMenuClick }: TopBarProps) {
    const pathname = usePathname();
    const { selectedBrand } = useBrandsStore();

    // Znajdź tytuł strony
    const pageInfo = pageTitles[pathname] || {
        title: 'Postlio',
        description: '',
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
            <div className="flex h-16 items-center gap-4 px-4 md:px-6">
                {/* Mobile menu button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={onMenuClick}
                >
                    <Menu className="h-5 w-5" />
                </Button>

                {/* Page title */}
                <div className="flex-1">
                    <h1 className="text-lg font-semibold text-foreground">
                        {pageInfo.title}
                    </h1>
                    {pageInfo.description && (
                        <p className="text-sm text-muted-foreground hidden sm:block">
                            {pageInfo.description}
                        </p>
                    )}
                </div>

                {/* Active brand indicator */}
                {selectedBrand && (
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: selectedBrand.primaryColor || '#3B82F6' }}
                        />
                        <span className="text-sm font-medium">{selectedBrand.name}</span>
                    </div>
                )}

                {/* Search */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                className="hidden sm:flex items-center gap-2 text-muted-foreground"
                            >
                                <Search className="h-4 w-4" />
                                <span className="hidden md:inline">Szukaj...</span>
                                <kbd className="hidden md:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                                    <Command className="h-3 w-3" />K
                                </kbd>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Szybkie wyszukiwanie</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Quick create */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="sm"
                                className="bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Nowy post</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Utwórz nowy post</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Notifications */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5" />
                                {/* Notification dot */}
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Powiadomienia</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* User menu */}
                <UserMenu />
            </div>
        </header>
    );
}

export default TopBar;