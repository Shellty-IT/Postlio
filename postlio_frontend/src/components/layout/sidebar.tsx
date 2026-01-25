// src/components/layout/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/store/ui-store';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    LayoutDashboard,
    PenTool,
    FileText,  // ← NOWA IKONA
    Calendar,
    Building2,
    Settings,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    LogOut,
    Zap,
} from 'lucide-react';

// ============================================================
// NAWIGACJA - ZAKTUALIZOWANA
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
        title: 'Materiały',       // ← NOWA POZYCJA
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
    const { isCollapsed, setCollapsed } = useSidebar();
    const { user, logout } = useAuth();

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    'fixed left-0 top-0 z-40 h-screen',
                    'bg-card border-r border-border',
                    'transition-all duration-300 ease-out',
                    isCollapsed ? 'w-20' : 'w-64'
                )}
            >
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className={cn(
                        'flex h-16 items-center border-b border-border px-4',
                        isCollapsed ? 'justify-center' : 'justify-between'
                    )}>
                        <Link href="/dashboard" className="flex items-center gap-3">
                            <div className="relative">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                    <Sparkles className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            {!isCollapsed && (
                                <span className="text-xl font-bold gradient-text">Postlio</span>
                            )}
                        </Link>

                        {!isCollapsed && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setCollapsed(true)}
                                className="h-8 w-8"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Navigation */}
                    <ScrollArea className="flex-1 py-4">
                        <nav className="space-y-1 px-3">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                                const Icon = item.icon;

                                const linkContent = (
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 rounded-xl px-3 py-2.5',
                                            'transition-all duration-200',
                                            'hover:bg-secondary',
                                            isActive && 'bg-primary/10 text-primary hover:bg-primary/15',
                                            isCollapsed && 'justify-center'
                                        )}
                                    >
                                        <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />

                                        {!isCollapsed && (
                                            <>
                                                <span className="flex-1 font-medium">{item.title}</span>
                                                {item.badge && (
                                                    <span className={cn(
                                                        'px-2 py-0.5 text-xs font-medium rounded-full',
                                                        item.badge === 'AI' && 'bg-accent/20 text-accent',
                                                        item.badge === 'Pro' && 'bg-warning/20 text-warning'
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
                    <div className="border-t border-border p-3">
                        {isCollapsed ? (
                            <div className="flex flex-col items-center gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setCollapsed(false)}
                                            className="h-10 w-10"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">Rozwiń menu</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={logout}
                                            className="h-10 w-10 text-muted-foreground hover:text-destructive"
                                        >
                                            <LogOut className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">Wyloguj</TooltipContent>
                                </Tooltip>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                    <span className="text-sm font-medium">
                                        {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {user?.full_name || 'Użytkownik'}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {user?.email}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={logout}
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
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