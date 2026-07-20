// src/components/calendar/mobile-agenda-view.tsx
'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isToday,
    isSameDay,
    addDays,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import {
    Clock,
    Calendar,
    ChevronRight,
    Sparkles,
    Facebook,
    Instagram,
    Linkedin,
    Zap,
    Hand,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCalendarStore } from '@/store/calendar-store';
import type { ScheduledPost } from '@/types/calendar';
import type { Platform } from '@/types';

interface MobileAgendaViewProps {
    posts: ScheduledPost[];
    onPostMove?: (postId: string, newDate: Date) => void;
}

const platformIcons: Record<Platform, typeof Facebook> = {
    facebook: Facebook,
    instagram: Instagram,
    linkedin: Linkedin,
};

const platformColors: Record<Platform, string> = {
    facebook: '#1877F2',
    instagram: '#E4405F',
    linkedin: '#0A66C2',
};

export function MobileAgendaView({ posts }: MobileAgendaViewProps) {
    const { currentDate, openScheduleModal, selectPost } = useCalendarStore();

    const daysWithPosts = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const today = new Date();

        const startDate = today < monthStart ? monthStart : today;
        const days = eachDayOfInterval({
            start: startDate,
            end: addDays(monthEnd, 7)
        });

        return days
            .map(date => ({
                date,
                posts: posts.filter(post => isSameDay(new Date(post.scheduledAt), date)),
            }))
            .filter(day => day.posts.length > 0 || isToday(day.date));
    }, [currentDate, posts]);

    const handlePostClick = (post: ScheduledPost) => {
        selectPost(post);
        openScheduleModal();
    };

    if (posts.length === 0) {
        return (
            <div className="empty-state-card">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04]">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Brak zaplanowanych postów</h3>
                <p className="text-sm text-muted-foreground max-w-xs -mt-1">
                    Przeciągnij szkic na kalendarz lub użyj przycisku &quot;Zaplanuj post&quot;
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {daysWithPosts.map(({ date, posts: dayPosts }) => (
                <motion.div
                    key={date.toISOString()}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card overflow-hidden"
                >
                    <div className={cn(
                        "px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between",
                        isToday(date) && "bg-primary/5"
                    )}>
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                                isToday(date)
                                    ? "bg-gradient-to-br from-primary to-accent text-white"
                                    : "bg-white/[0.04] text-muted-foreground"
                            )}>
                                {format(date, 'd')}
                            </div>
                            <div>
                                <p className={cn(
                                    "text-sm font-medium",
                                    isToday(date) && "text-primary"
                                )}>
                                    {isToday(date) ? 'Dzisiaj' : format(date, 'EEEE', { locale: pl })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {format(date, 'd MMMM', { locale: pl })}
                                </p>
                            </div>
                        </div>
                        {dayPosts.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                                {dayPosts.length} {dayPosts.length === 1 ? 'post' : 'postów'}
                            </span>
                        )}
                    </div>

                    <AnimatePresence>
                        {dayPosts.length > 0 ? (
                            <div className="divide-y divide-white/[0.05]">
                                {dayPosts.map((post) => {
                                    const platforms = post.platforms || [post.platform || 'facebook'];
                                    const primaryPlatform = platforms[0] as Platform;
                                    const PlatformIcon = platformIcons[primaryPlatform];
                                    const platformColor = platformColors[primaryPlatform];

                                    return (
                                        <motion.button
                                            key={post.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => handlePostClick(post)}
                                            className="w-full px-4 py-3 flex items-start gap-3 hover:bg-white/[0.03] transition-colors text-left"
                                        >
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: `${platformColor}15` }}
                                            >
                                                <PlatformIcon
                                                    className="h-5 w-5"
                                                    style={{ color: platformColor }}
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                                    <span className="text-sm font-medium">
                                                        {format(new Date(post.scheduledAt), 'HH:mm')}
                                                    </span>
                                                    {post.aiGenerated && (
                                                        <Sparkles className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                                                    )}
                                                    {post.requiresManualPublish ? (
                                                        <Hand className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                                                    ) : (
                                                        <Zap className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                                                    )}
                                                    {platforms.length > 1 && (
                                                        <span className="text-xs text-muted-foreground">
                                                            +{platforms.length - 1}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {post.content || post.title || 'Bez treści'}
                                                </p>
                                            </div>

                                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-2" />
                                        </motion.button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                                Brak zaplanowanych postów
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>
            ))}
        </div>
    );
}

export default MobileAgendaView;