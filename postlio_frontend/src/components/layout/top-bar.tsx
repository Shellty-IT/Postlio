// src/components/layout/top-bar.tsx

'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Search,
    Menu,
    Command,
    Plus,
    LayoutDashboard,
    PenTool,
    Calendar,
    Building2,
    Zap,
    Settings,
    FileText,
    Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserMenu } from './user-menu';
import { SearchCommand } from './search-command';
import { NotificationsDropdown } from './notifications-dropdown';
import { useBrandsStore } from '@/store/brands-store';
import { cn } from '@/lib/utils';

// ============================================================
// TYPY
// ============================================================

interface TopBarProps {
    onMenuClick?: () => void;
}

// ============================================================
// PAGE CONFIG
// ============================================================

const pageConfig: Record<string, {
    title: string;
    shortTitle?: string; // ✅ NOWE: Krótki tytuł dla mobile
    description: string;
    icon: React.ElementType;
    gradient: string;
    badge?: string;
}> = {
    '/dashboard': {
        title: 'Dashboard',
        shortTitle: 'Home',
        description: 'Przegląd Twoich działań',
        icon: LayoutDashboard,
        gradient: 'from-blue-500 to-cyan-500',
    },
    '/creator': {
        title: 'Kreator AI',
        shortTitle: 'Kreator',
        description: 'Twórz posty z pomocą sztucznej inteligencji',
        icon: PenTool,
        gradient: 'from-violet-500 to-purple-500',
        badge: 'AI',
    },
    '/saved-posts': {
        title: 'Materiały',
        description: 'Zapisane posty i szkice',
        icon: FileText,
        gradient: 'from-emerald-500 to-teal-500',
    },
    '/calendar': {
        title: 'Kalendarz',
        description: 'Zaplanowane publikacje',
        icon: Calendar,
        gradient: 'from-orange-500 to-amber-500',
    },
    '/brands': {
        title: 'Marki',
        description: 'Zarządzaj Stylem pisania',
        icon: Building2,
        gradient: 'from-pink-500 to-rose-500',
    },
    '/autopilot': {
        title: 'Autopilot',
        description: 'Automatyczne publikacje AI',
        icon: Zap,
        gradient: 'from-yellow-500 to-orange-500',
        badge: 'Pro',
    },
    '/settings': {
        title: 'Ustawienia',
        description: 'Konfiguracja konta i połączeń',
        icon: Settings,
        gradient: 'from-slate-500 to-gray-500',
    },
};

// ============================================================
// KOMPONENT TYTUŁU - Responsywny
// ============================================================

interface PageTitleProps {
    config: {
        title: string;
        shortTitle?: string;
        description: string;
        icon: React.ElementType;
        gradient: string;
        badge?: string;
    };
}

function PageTitle({ config }: PageTitleProps) {
    const Icon = config.icon;

    return (
        <div className="flex items-center gap-2 xs:gap-3 min-w-0">
            {/* Ikona z gradientem - ukryta na małych ekranach */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className={cn(
                    'hidden xs:flex h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl items-center justify-center flex-shrink-0',
                    'bg-gradient-to-br shadow-lg',
                    config.gradient
                )}
            >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </motion.div>

            {/* Tytuł i opis */}
            <div className="flex flex-col min-w-0">
                <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    className="flex items-center gap-1.5 sm:gap-2"
                >
                    <h1 className="text-base sm:text-lg font-bold text-foreground truncate">
                        {/* ✅ Krótki tytuł na mobile */}
                        <span className="xs:hidden">{config.shortTitle || config.title}</span>
                        <span className="hidden xs:inline">{config.title}</span>
                    </h1>
                    {config.badge && (
                        <span className={cn(
                            'px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full flex-shrink-0',
                            config.badge === 'AI' && 'bg-violet-500/20 text-violet-500',
                            config.badge === 'Pro' && 'bg-amber-500/20 text-amber-500'
                        )}>
                            {config.badge}
                        </span>
                    )}
                </motion.div>

                <motion.p
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className="text-xs sm:text-sm text-muted-foreground hidden sm:block truncate"
                >
                    {config.description}
                </motion.p>
            </div>
        </div>
    );
}

// ============================================================
// KOMPONENT GŁÓWNY
// ============================================================

export function TopBar({ onMenuClick }: TopBarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { selectedBrand } = useBrandsStore();
    const [searchOpen, setSearchOpen] = useState(false);

    // Znajdź konfigurację strony
    const config = pageConfig[pathname] || {
        title: 'Postlio',
        description: '',
        icon: Sparkles,
        gradient: 'from-primary to-violet-500',
    };

    return (
        <>
            <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
                <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6">
                    {/* Mobile menu button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10"
                        onClick={onMenuClick}
                        aria-label="Otwórz menu"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    {/* Page title - z flex-1 i min-w-0 dla truncate */}
                    <div className="flex-1 min-w-0">
                        <PageTitle config={config} />
                    </div>

                    {/* Active brand indicator - tylko na dużych ekranach */}
                    {selectedBrand && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 flex-shrink-0"
                        >
                            <div
                                className="w-3 h-3 rounded-full ring-2 ring-white/20"
                                style={{ backgroundColor: selectedBrand.primaryColor || '#3B82F6' }}
                            />
                            <span className="text-sm font-medium max-w-[120px] truncate">{selectedBrand.name}</span>
                        </motion.div>
                    )}

                    {/* ✅ NAPRAWIONE: Search dostępny na WSZYSTKICH rozmiarach */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 sm:hidden"
                                    onClick={() => setSearchOpen(true)}
                                    aria-label="Szukaj"
                                >
                                    <Search className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Szukaj</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Desktop search button */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="hidden sm:flex items-center gap-2 text-muted-foreground flex-shrink-0 h-9 sm:h-10 rounded-xl border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:text-foreground"
                                    onClick={() => setSearchOpen(true)}
                                >
                                    <Search className="h-4 w-4" />
                                    <span className="hidden md:inline">Szukaj...</span>
                                    <kbd className="hidden lg:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded-md border border-white/[0.08] bg-transparent px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                                        <Command className="h-3 w-3" />K
                                    </kbd>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Szybkie wyszukiwanie (⌘K)</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Quick create - ✅ Responsywne */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    className={cn(
                                        "flex-shrink-0 h-9 w-9 sm:h-10 sm:w-auto sm:px-3 rounded-xl",
                                        "bg-gradient-to-br from-primary to-accent hover:brightness-110",
                                        "shadow-glow-primary"
                                    )}
                                    onClick={() => router.push('/creator')}
                                    aria-label="Utwórz nowy post"
                                >
                                    <Plus className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-1" />
                                    <span className="hidden sm:inline">Nowy</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Utwórz nowy post</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Notifications - responsywne */}
                    <div className="flex-shrink-0">
                        <NotificationsDropdown />
                    </div>

                    {/* User menu - responsywne */}
                    <div className="flex-shrink-0">
                        <UserMenu />
                    </div>
                </div>
            </header>

            {/* Search Command Modal */}
            <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
        </>
    );
}

export default TopBar;