// src/components/layout/sidebar.tsx
/**
 * Sidebar z nawigacją
 *
 * NAPRAWIONE:
 * - Przycisk rozwijania widoczny w headerze RÓWNIEŻ gdy sidebar jest zwinięty
 */

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/store/ui-store';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    LayoutDashboard,
    PenTool,
    FileText,
    Calendar,
    Building2,
    Settings,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    LogOut,
    Zap,
    Plus,
} from 'lucide-react';

// ============================================================
// NAWIGACJA
// ============================================================

const navigation = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Kreator AI',
        href: '/creator',
        icon: PenTool,
        badge: 'AI',
    },
    {
        title: 'Materiały',
        href: '/saved-posts',
        icon: FileText,
    },
    {
        title: 'Autopilot',
        href: '/autopilot',
        icon: Zap,
        badge: 'Pro',
    },
    {
        title: 'Kalendarz',
        href: '/calendar',
        icon: Calendar,
    },
    {
        title: 'Brandy',
        href: '/brands',
        icon: Building2,
    },
    {
        title: 'Ustawienia',
        href: '/settings',
        icon: Settings,
    },
];

// ============================================================
// KOMPONENT
// ============================================================

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { isCollapsed, setCollapsed } = useSidebar();
    const { user, logout } = useAuth();

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    'fixed left-0 top-0 z-40 h-screen p-3',
                    'transition-all duration-300 ease-out',
                    isCollapsed ? 'w-[104px]' : 'w-[266px]'
                )}
            >
                <div className="flex h-full flex-col gap-1 rounded-[26px] border border-white/[0.09] bg-gradient-to-b from-white/[0.07] to-white/[0.015] p-3 shadow-panel backdrop-blur-2xl">
                    {/* Logo + Toggle Button */}
                    <div className={cn(
                        'flex items-center gap-2.5 px-1.5 pb-3.5 pt-1',
                        isCollapsed ? 'justify-center' : 'justify-between'
                    )}>
                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-primary to-accent shadow-glow-primary">
                                <Sparkles className="h-[18px] w-[18px] text-white" />
                            </div>
                            {!isCollapsed && (
                                <span className="truncate text-lg font-semibold tracking-tight">Postlio</span>
                            )}
                        </Link>

                        {!isCollapsed && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setCollapsed(!isCollapsed)}
                                        className="h-[26px] w-[26px] flex-shrink-0 rounded-lg text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">Zwiń menu</TooltipContent>
                            </Tooltip>
                        )}
                    </div>

                    {/* Quick create */}
                    <div className="pb-3">
                        <button
                            onClick={() => router.push('/creator')}
                            className={cn(
                                'btn-gradient w-full py-2.5 text-sm',
                                isCollapsed && 'px-0'
                            )}
                        >
                            <Plus className="h-4 w-4 flex-shrink-0" />
                            {!isCollapsed && 'Stwórz nowy'}
                        </button>
                    </div>

                    {isCollapsed && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setCollapsed(!isCollapsed)}
                                    className="mx-auto mb-1 h-7 w-7 rounded-lg text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Rozwiń menu</TooltipContent>
                        </Tooltip>
                    )}

                    {!isCollapsed && (
                        <div className="mono-label px-3 pb-1.5">Menu</div>
                    )}

                    {/* Navigation */}
                    <ScrollArea className="flex-1">
                        <nav className="space-y-1 px-0.5">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                                const Icon = item.icon;

                                const linkContent = (
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm',
                                            'transition-all duration-200',
                                            isActive
                                                ? 'pill-active font-semibold'
                                                : 'font-medium text-muted-foreground hover:bg-white/[0.045] hover:text-foreground',
                                            isCollapsed && 'justify-center'
                                        )}
                                    >
                                        <Icon className="h-[19px] w-[19px] flex-shrink-0" />

                                        {!isCollapsed && (
                                            <>
                                                <span className="flex-1">{item.title}</span>
                                                {item.badge && (
                                                    <span className={cn(
                                                        'rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide',
                                                        item.badge === 'AI' && 'bg-gradient-to-br from-primary/25 to-accent/25 text-[#c3ccff]',
                                                        item.badge === 'Pro' && 'bg-warning/16 text-warning'
                                                    )}>
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </Link>
                                );

                                return isCollapsed ? (
                                    <Tooltip key={item.href}>
                                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                        <TooltipContent side="right" className="flex items-center gap-2">
                                            {item.title}
                                            {item.badge && (
                                                <span className={cn(
                                                    'px-1.5 py-0.5 text-xs font-medium rounded-full',
                                                    item.badge === 'AI' && 'bg-accent/20 text-accent',
                                                    item.badge === 'Pro' && 'bg-warning/20 text-warning'
                                                )}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </TooltipContent>
                                    </Tooltip>
                                ) : (
                                    <div key={item.href}>{linkContent}</div>
                                );
                            })}
                        </nav>
                    </ScrollArea>

                    {/* User Section */}
                    <div className="mt-auto pt-2">
                        {isCollapsed ? (
                            <div className="flex flex-col items-center gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center cursor-default">
                                            <span className="text-sm font-semibold text-white">
                                                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                            </span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        <p className="font-medium">{user?.full_name || 'Użytkownik'}</p>
                                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                                    </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={logout}
                                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                        >
                                            <LogOut className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">Wyloguj</TooltipContent>
                                </Tooltip>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2.5 rounded-[14px] border border-white/[0.045] bg-white/[0.025] p-2.5">
                                <div className="h-9 w-9 flex-shrink-0 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                    <span className="text-sm font-semibold text-white">
                                        {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate leading-tight">
                                        {user?.full_name || 'Użytkownik'}
                                    </p>
                                    <p className="text-[11.5px] text-muted-foreground truncate leading-tight">
                                        {user?.email}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={logout}
                                    className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
                                >
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </TooltipProvider>
    );
}