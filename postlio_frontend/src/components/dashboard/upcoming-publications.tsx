'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CalendarClock, ArrowRight, Facebook, Instagram, Linkedin } from 'lucide-react';
import { usePosts } from '@/hooks/usePosts';
import { cn } from '@/lib/utils';
import type { Platform } from '@/types';

const platformIcons: Record<Platform, React.ReactNode> = {
    facebook: <Facebook className="h-3.5 w-3.5" />,
    instagram: <Instagram className="h-3.5 w-3.5" />,
    linkedin: <Linkedin className="h-3.5 w-3.5" />,
};

const suggestedSlots: { platform: Platform; label: string }[] = [
    { platform: 'facebook', label: 'Wt 18:00' },
    { platform: 'instagram', label: 'Czw 12:30' },
    { platform: 'linkedin', label: 'Sob 10:00' },
];

export function UpcomingPublications() {
    const router = useRouter();
    const { data, isLoading } = usePosts({ status: 'scheduled', limit: 5 });

    const scheduledPosts = data?.posts || [];

    return (
        <div className="flex flex-col gap-3">
            <div className="mono-label">Najbliższe publikacje</div>

            {isLoading ? (
                <div className="glass-card h-40 animate-pulse" />
            ) : scheduledPosts.length > 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card flex flex-col gap-1 p-2"
                >
                    {scheduledPosts.map((post) => {
                        const platforms = post.platforms && post.platforms.length > 0
                            ? post.platforms
                            : (post.platform ? [post.platform] : []);

                        return (
                            <div
                                key={post.id}
                                onClick={() => router.push('/calendar')}
                                className="flex items-center gap-3 rounded-[14px] p-3 transition-colors hover:bg-white/[0.03]"
                            >
                                <div className="flex items-center gap-1">
                                    {platforms.map((platform) => (
                                        <span
                                            key={platform}
                                            className={cn(
                                                'flex h-5 w-5 items-center justify-center rounded-[5px]',
                                                `platform-${platform}`
                                            )}
                                        >
                                            {platformIcons[platform as Platform]}
                                        </span>
                                    ))}
                                </div>
                                <p className="min-w-0 flex-1 truncate text-[13.5px] text-foreground/85">
                                    {post.content || 'Brak treści'}
                                </p>
                                <span className="flex-shrink-0 text-[11.5px] text-muted-foreground">
                                    {post.scheduled_at
                                        ? formatDistanceToNow(new Date(post.scheduled_at), { addSuffix: true, locale: pl })
                                        : ''}
                                </span>
                            </div>
                        );
                    })}
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="empty-state-card"
                >
                    <div className="flex h-[54px] w-[54px] items-center justify-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.18] to-accent/[0.14] text-primary shadow-glow-primary">
                        <CalendarClock className="h-[26px] w-[26px]" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold">Twój tydzień jest jeszcze pusty</h3>
                        <p className="mt-1.5 max-w-[400px] text-[13.5px] leading-relaxed text-muted-foreground">
                            Asystent AI ma już propozycje terminów na podstawie aktywności Twoich odbiorców.
                        </p>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center justify-center gap-2">
                        {suggestedSlots.map((slot) => (
                            <div
                                key={slot.label}
                                className="flex items-center gap-1.5 rounded-[9px] border border-dashed border-primary/25 bg-primary/[0.06] px-2.5 py-1.5 text-xs text-foreground/80"
                            >
                                <span className={cn('h-1.5 w-1.5 rounded-[2px]', `platform-${slot.platform}`)} />
                                {slot.label}
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => router.push('/calendar')}
                        className="mt-1 inline-flex items-center gap-2 rounded-[11px] border border-primary/25 bg-primary/[0.08] px-4 py-2.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/[0.14]"
                    >
                        Zaplanuj tydzień z AI
                        <ArrowRight className="h-[15px] w-[15px]" />
                    </button>
                </motion.div>
            )}
        </div>
    );
}
