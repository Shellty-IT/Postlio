// src/components/layout/notifications-dropdown.tsx
/**
 * Dropdown z powiadomieniami
 * Pokazuje zaplanowane posty i ważne alerty
 */

'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, isToday, isTomorrow, differenceInHours } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
    Bell,
    Calendar,
    Clock,
    AlertTriangle,
    ArrowRight,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePosts } from '@/hooks/usePosts';
import { cn } from '@/lib/utils';

// ============================================================
// TYPY
// ============================================================

interface Notification {
    id: string;
    type: 'scheduled' | 'reminder' | 'success' | 'warning';
    title: string;
    description: string;
    time?: string;
    postId?: number | string;
    icon: typeof Calendar;
    color: string;
}

// ============================================================
// KOMPONENT
// ============================================================

export function NotificationsDropdown() {
    const router = useRouter();

    // Pobierz zaplanowane posty
    const { data: scheduledData } = usePosts({ status: 'scheduled', limit: 20 });

    // Generuj powiadomienia na podstawie zaplanowanych postów
    const notifications = useMemo<Notification[]>(() => {
        const scheduledPosts = scheduledData?.posts || [];
        const items: Notification[] = [];

        scheduledPosts.forEach((post) => {
            if (!post.scheduled_at) return;

            const scheduledDate = new Date(post.scheduled_at);
            const hoursUntil = differenceInHours(scheduledDate, new Date());

            // Post zaplanowany na dziś
            if (isToday(scheduledDate)) {
                items.push({
                    id: `today-${post.id}`,
                    type: 'scheduled',
                    title: 'Publikacja dziś',
                    description: post.content?.slice(0, 60) + '...' || 'Post bez treści',
                    time: format(scheduledDate, 'HH:mm', { locale: pl }),
                    postId: post.id,
                    icon: hoursUntil <= 2 ? AlertTriangle : Clock,
                    color: hoursUntil <= 2 ? 'text-amber-500' : 'text-blue-500',
                });
            }

            // Post zaplanowany na jutro
            else if (isTomorrow(scheduledDate)) {
                items.push({
                    id: `tomorrow-${post.id}`,
                    type: 'reminder',
                    title: 'Publikacja jutro',
                    description: post.content?.slice(0, 60) + '...' || 'Post bez treści',
                    time: format(scheduledDate, 'HH:mm', { locale: pl }),
                    postId: post.id,
                    icon: Calendar,
                    color: 'text-violet-500',
                });
            }
        });

        // Sortuj po czasie (najbliższe najpierw)
        return items.sort((a, b) => {
            if (a.type === 'scheduled' && b.type !== 'scheduled') return -1;
            if (a.type !== 'scheduled' && b.type === 'scheduled') return 1;
            return 0;
        });
    }, [scheduledData?.posts]);

    const unreadCount = notifications.length;
    const hasNotifications = unreadCount > 0;

    const handleNotificationClick = (notification: Notification) => {
        if (notification.postId) {
            router.push(`/creator?edit=${notification.postId}`);
        } else {
            router.push('/calendar');
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {hasNotifications && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                            <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Powiadomienia</span>
                    {hasNotifications && (
                        <Badge variant="secondary" className="text-xs">
                            {unreadCount} nowych
                        </Badge>
                    )}
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <ScrollArea className="h-[300px]">
                    {hasNotifications ? (
                        <div className="space-y-1 p-1">
                            {notifications.map((notification) => (
                                <DropdownMenuItem
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className="flex items-start gap-3 p-3 cursor-pointer"
                                >
                                    <div className={cn(
                                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                                        'bg-muted',
                                        notification.color
                                    )}>
                                        <notification.icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-medium text-sm">
                                                {notification.title}
                                            </p>
                                            {notification.time && (
                                                <span className="text-xs text-muted-foreground shrink-0">
                                                    {notification.time}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.description}
                                        </p>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Sparkles className="h-10 w-10 mb-3 opacity-20" />
                            <p className="font-medium">Wszystko na bieżąco!</p>
                            <p className="text-sm">Brak nowych powiadomień</p>
                        </div>
                    )}
                </ScrollArea>

                {hasNotifications && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => router.push('/calendar')}
                            className="flex items-center justify-center gap-2 py-3 text-primary"
                        >
                            Zobacz kalendarz
                            <ArrowRight className="h-4 w-4" />
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default NotificationsDropdown;