// src/components/layout/top-bar.tsx
/**
 * Górny pasek nawigacji w dashboard
 *
 * ULEPSZONE:
 * - Atrakcyjniejsze tytuły stron z ikonami i gradientami
 * - Animowany opis
 */

'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Search,
    Bell,
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
import { useBrandsStore } from '@/store/brands-store';
import { cn } from '@/lib/utils';

// ============================================================
// TYPY
// ============================================================

interface TopBarProps {
    onMenuClick?: () => void;
}

// ============================================================
// PAGE CONFIG - ULEPSZONE Z IKONAMI I GRADIENTAMI
// ============================================================

const pageConfig: Record<string, {
    title: string;
    description: string;
    icon: React.ElementType;
    gradient: string;
    badge?: string;
}> = {
    '/dashboard': {
        title: 'Dashboard',
        description: 'Przegląd Twoich działań',
        icon: LayoutDashboard,
        gradient: 'from-blue-500 to-cyan-500',
    },
    '/creator': {
        title: 'Kreator AI',
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
// KOMPONENT TYTUŁU - ULEPSZONY
// ============================================================

interface PageTitleProps {
    config: {
        title: string;
        description: string;
        icon: React.ElementType;
        gradient: string;
        badge?: string;
    };
}

function PageTitle({ config }: PageTitleProps) {
    const Icon = config.icon;

    return (
        <div className="flex items-center gap-3">
            {/* Ikona z gradientem */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className={cn(
                    'hidden sm:flex h-10 w-10 rounded-xl items-center justify-center',
                    'bg-gradient-to-br shadow-lg',
                    config.gradient
                )}
            >
                <Icon className="h-5 w-5 text-white" />
            </motion.div>

            {/* Tytuł i opis */}
            <div className="flex flex-col">
                <motion.div
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    className="flex items-center gap-2"
                >
                    <h1 className="text-lg font-bold text-foreground">
                        {config.title}
                    </h1>
                    {config.badge && (
                        <span className={cn(
                            'px-2 py-0.5 text-xs font-semibold rounded-full',
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
                    className="text-sm text-muted-foreground hidden sm:block"
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
    const { selectedBrand } = useBrandsStore();

    // Znajdź konfigurację strony
    const config = pageConfig[pathname] || {
        title: 'Postlio',
        description: '',
        icon: Sparkles,
        gradient: 'from-primary to-violet-500',
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

                {/* Page title - ULEPSZONY */}
                <div className="flex-1">
                    <PageTitle config={config} />
                </div>

                {/* Active brand indicator */}
                {selectedBrand && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50"
                    >
                        <div
                            className="w-3 h-3 rounded-full ring-2 ring-white/20"
                            style={{ backgroundColor: selectedBrand.primaryColor || '#3B82F6' }}
                        />
                        <span className="text-sm font-medium">{selectedBrand.name}</span>
                    </motion.div>
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
                                className="bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 shadow-lg shadow-primary/25"
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
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
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