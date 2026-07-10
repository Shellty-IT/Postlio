// src/components/layout/sidebar.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar, useDock, type DockMode } from '@/store/ui-store';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AppLogo } from '@/components/common/app-logo';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    LayoutDashboard,
    PenTool,
    FileText,
    Calendar,
    Building2,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Zap,
    Plus,
    GripVertical,
    Pin,
    PanelLeft,
    PanelRight,
    PanelBottom,
    Move,
} from 'lucide-react';

export const navigation = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Kreator AI', href: '/creator', icon: PenTool, badge: 'AI' },
    { title: 'Materiały', href: '/saved-posts', icon: FileText },
    { title: 'Autopilot', href: '/autopilot', icon: Zap, badge: 'Pro' },
    { title: 'Kalendarz', href: '/calendar', icon: Calendar },
    { title: 'Brandy', href: '/brands', icon: Building2 },
    { title: 'Ustawienia', href: '/settings', icon: Settings },
];

export const DOCK_EXPANDED_W = 266;
export const DOCK_COLLAPSED_W = 104;
const EDGE = 12;
const SNAP = 72;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

interface DragState {
    x: number;
    y: number;
    pointerX: number;
    pointerY: number;
}

export function badgeClass(badge: string) {
    return cn(
        'rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide',
        badge === 'AI' && 'bg-gradient-to-br from-primary/25 to-accent/25 text-[#c3ccff]',
        badge === 'Pro' && 'bg-warning/15 text-warning'
    );
}

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { isCollapsed, setCollapsed } = useSidebar();
    const { mode, position, setMode, setPosition } = useDock();
    const { user, logout } = useAuth();

    const panelRef = useRef<HTMLDivElement>(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const rafId = useRef<number | null>(null);
    const [drag, setDrag] = useState<DragState | null>(null);
    const isDragging = drag !== null;

    useEffect(() => () => {
        if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    }, []);

    const panelWidth = isCollapsed ? DOCK_COLLAPSED_W : DOCK_EXPANDED_W;

    useEffect(() => {
        if (mode !== 'floating') return;

        const clampToViewport = () => {
            const height = panelRef.current?.getBoundingClientRect().height ?? 560;
            const x = clamp(position.x, EDGE, window.innerWidth - panelWidth - EDGE);
            const y = clamp(position.y, EDGE, window.innerHeight - Math.min(height, window.innerHeight - EDGE * 2) - EDGE);
            if (x !== position.x || y !== position.y) {
                setPosition({ x, y });
            }
        };

        clampToViewport();
        window.addEventListener('resize', clampToViewport);
        return () => window.removeEventListener('resize', clampToViewport);
    }, [mode, position, panelWidth, setPosition]);

    const startDrag = (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();
        const rect = panelRef.current?.getBoundingClientRect();
        dragOffset.current = rect
            ? {
                x: clamp(e.clientX - rect.left, 12, panelWidth - 48),
                y: clamp(e.clientY - rect.top, 8, 48),
            }
            : { x: 24, y: 24 };
        e.currentTarget.setPointerCapture(e.pointerId);
        setDrag({
            x: e.clientX - dragOffset.current.x,
            y: e.clientY - dragOffset.current.y,
            pointerX: e.clientX,
            pointerY: e.clientY,
        });
    };

    const moveDrag = (e: React.PointerEvent) => {
        if (!isDragging) return;
        const { clientX, clientY } = e;
        if (rafId.current !== null) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => {
            rafId.current = null;
            setDrag({
                x: clientX - dragOffset.current.x,
                y: clientY - dragOffset.current.y,
                pointerX: clientX,
                pointerY: clientY,
            });
        });
    };

    const endDrag = (e: React.PointerEvent) => {
        if (!drag) return;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        if (e.clientX <= SNAP) {
            setMode('left');
        } else if (vw - e.clientX <= SNAP) {
            setMode('right');
        } else if (vh - e.clientY <= SNAP) {
            setMode('bottom');
        } else {
            const height = panelRef.current?.getBoundingClientRect().height ?? 560;
            setPosition({
                x: clamp(drag.x, EDGE, vw - panelWidth - EDGE),
                y: clamp(drag.y, EDGE, vh - Math.min(height, vh - EDGE * 2) - EDGE),
            });
            setMode('floating');
        }
        setDrag(null);
    };

    const nearLeft = isDragging && drag.pointerX <= SNAP;
    const nearRight = isDragging && window.innerWidth - drag.pointerX <= SNAP;
    const nearBottom = isDragging && !nearLeft && !nearRight && window.innerHeight - drag.pointerY <= SNAP;

    const gripHandle = (
        <button
            type="button"
            aria-label="Przeciągnij menu"
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={() => setDrag(null)}
            className={cn(
                'flex h-7 w-5 flex-shrink-0 touch-none select-none items-center justify-center rounded-md',
                'text-muted-foreground/50 transition-colors hover:bg-white/[0.05] hover:text-foreground',
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
            )}
        >
            <GripVertical className="h-4 w-4" />
        </button>
    );

    const pinMenu = (side: 'right' | 'top') => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Pozycja menu"
                    className="h-[26px] w-[26px] flex-shrink-0 rounded-lg text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                >
                    <Pin className="h-3.5 w-3.5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side={side} align="end" className="w-52">
                <DropdownMenuLabel className="mono-label text-[10px]">Pozycja docka</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {([
                    { value: 'left', label: 'Przypnij do lewej', icon: PanelLeft },
                    { value: 'right', label: 'Przypnij do prawej', icon: PanelRight },
                    { value: 'bottom', label: 'Przypnij do dołu', icon: PanelBottom },
                    { value: 'floating', label: 'Pływający', icon: Move },
                ] as { value: DockMode; label: string; icon: typeof Pin }[]).map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onClick={() => setMode(option.value)}
                        className={cn('gap-2', mode === option.value && 'text-primary')}
                    >
                        <option.icon className="h-4 w-4" />
                        {option.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const showBottomDock = mode === 'bottom' && !isDragging;
    const tooltipSide = showBottomDock ? 'top' : mode === 'right' ? 'left' : 'right';

    const verticalContent = (
        <>
            <div className={cn(
                'flex items-center gap-1.5 px-1 pb-3.5 pt-1',
                isCollapsed && 'flex-col gap-2'
            )}>
                {gripHandle}
                <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
                    <AppLogo className="h-9 w-9 flex-shrink-0" />
                    {!isCollapsed && (
                        <span className="truncate text-lg font-semibold tracking-tight">Postlio</span>
                    )}
                </Link>

                {!isCollapsed && (
                    <div className="ml-auto flex items-center gap-0.5">
                        {pinMenu('right')}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setCollapsed(true)}
                                    className="h-[26px] w-[26px] flex-shrink-0 rounded-lg text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side={tooltipSide}>Zwiń menu</TooltipContent>
                        </Tooltip>
                    </div>
                )}
            </div>

            <div className="pb-3">
                <button
                    onClick={() => router.push('/creator')}
                    className={cn('btn-gradient w-full py-2.5 text-sm', isCollapsed && 'px-0')}
                >
                    <Plus className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && 'Stwórz nowy'}
                </button>
            </div>

            {isCollapsed && (
                <div className="mb-1 flex items-center justify-center gap-1">
                    {pinMenu('right')}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setCollapsed(false)}
                                className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side={tooltipSide}>Rozwiń menu</TooltipContent>
                    </Tooltip>
                </div>
            )}

            {!isCollapsed && <div className="mono-label px-3 pb-1.5">Menu</div>}

            <ScrollArea className="min-h-0 flex-1">
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
                                        {item.badge && <span className={badgeClass(item.badge)}>{item.badge}</span>}
                                    </>
                                )}
                            </Link>
                        );

                        return isCollapsed ? (
                            <Tooltip key={item.href}>
                                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                <TooltipContent side={tooltipSide} className="flex items-center gap-2">
                                    {item.title}
                                    {item.badge && <span className={badgeClass(item.badge)}>{item.badge}</span>}
                                </TooltipContent>
                            </Tooltip>
                        ) : (
                            <div key={item.href}>{linkContent}</div>
                        );
                    })}
                </nav>
            </ScrollArea>

            <div className="mt-auto pt-2">
                {isCollapsed ? (
                    <div className="flex flex-col items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex h-9 w-9 cursor-default items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                                    <span className="text-sm font-semibold text-white">
                                        {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                    </span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side={tooltipSide}>
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
                            <TooltipContent side={tooltipSide}>Wyloguj</TooltipContent>
                        </Tooltip>
                    </div>
                ) : (
                    <div className="flex items-center gap-2.5 rounded-[14px] border border-white/[0.045] bg-white/[0.025] p-2.5">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                            <span className="text-sm font-semibold text-white">
                                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold leading-tight">
                                {user?.full_name || 'Użytkownik'}
                            </p>
                            <p className="truncate text-[11.5px] leading-tight text-muted-foreground">
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
        </>
    );

    const bottomContent = (
        <div className="flex w-max items-center gap-1 px-2">
            {gripHandle}
            <Link
                href="/dashboard"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center"
            >
                <AppLogo className="h-9 w-9" />
            </Link>
            <div className="mx-1.5 h-6 w-px bg-white/[0.08]" />
            {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                    <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                            <Link
                                href={item.href}
                                className={cn(
                                    'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200',
                                    isActive
                                        ? 'pill-active'
                                        : 'text-muted-foreground hover:bg-white/[0.045] hover:text-foreground'
                                )}
                            >
                                <Icon className="h-[19px] w-[19px]" />
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="flex items-center gap-2">
                            {item.title}
                            {item.badge && <span className={badgeClass(item.badge)}>{item.badge}</span>}
                        </TooltipContent>
                    </Tooltip>
                );
            })}
            <div className="mx-1.5 h-6 w-px bg-white/[0.08]" />
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => router.push('/creator')}
                        className="btn-gradient h-10 w-10 rounded-xl p-0"
                        aria-label="Stwórz nowy"
                    >
                        <Plus className="h-[18px] w-[18px]" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="top">Stwórz nowy</TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="ml-1 flex h-9 w-9 cursor-default items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                        <span className="text-sm font-semibold text-white">
                            {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top">
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
                <TooltipContent side="top">Wyloguj</TooltipContent>
            </Tooltip>
            {pinMenu('top')}
        </div>
    );

    const asidePosition = isDragging
        ? { left: drag.x, top: drag.y }
        : mode === 'floating'
            ? { left: position.x, top: position.y }
            : undefined;

    return (
        <TooltipProvider delayDuration={0}>
            {isDragging && (
                <>
                    <div
                        className={cn(
                            'pointer-events-none fixed bottom-3 left-3 top-3 z-40 w-16 rounded-3xl border-2 border-dashed transition-colors',
                            nearLeft ? 'border-primary/60 bg-primary/10' : 'border-white/10 bg-white/[0.02]'
                        )}
                    />
                    <div
                        className={cn(
                            'pointer-events-none fixed bottom-3 right-3 top-3 z-40 w-16 rounded-3xl border-2 border-dashed transition-colors',
                            nearRight ? 'border-primary/60 bg-primary/10' : 'border-white/10 bg-white/[0.02]'
                        )}
                    />
                    <div
                        className={cn(
                            'pointer-events-none fixed bottom-3 left-24 right-24 z-40 h-16 rounded-3xl border-2 border-dashed transition-colors',
                            nearBottom ? 'border-primary/60 bg-primary/10' : 'border-white/10 bg-white/[0.02]'
                        )}
                    />
                </>
            )}

            <aside
                style={asidePosition}
                className={cn(
                    'fixed z-50',
                    !isDragging && 'transition-all duration-300 ease-out',
                    isDragging && 'opacity-95',
                    showBottomDock
                        ? 'bottom-3 left-1/2 max-w-[calc(100vw-24px)] -translate-x-1/2'
                        : mode === 'left' && !isDragging
                            ? 'left-0 top-0 h-screen p-3'
                            : mode === 'right' && !isDragging
                                ? 'right-0 top-0 h-screen p-3'
                                : 'h-[min(640px,calc(100vh-24px))]',
                    !showBottomDock && (isCollapsed ? 'w-[var(--dock-w-collapsed)]' : 'w-[var(--dock-w-expanded)]')
                )}
            >
                <div
                    ref={panelRef}
                    className={cn(
                        'border border-white/[0.09] bg-gradient-to-b from-white/[0.07] to-white/[0.015] shadow-panel backdrop-blur-2xl',
                        isDragging && 'shadow-glow-primary',
                        showBottomDock
                            ? 'flex h-16 max-w-full items-center overflow-x-auto rounded-[22px] px-2 no-scrollbar'
                            : 'flex h-full flex-col gap-1 rounded-[26px] p-3'
                    )}
                >
                    {showBottomDock ? bottomContent : verticalContent}
                </div>
            </aside>
        </TooltipProvider>
    );
}
