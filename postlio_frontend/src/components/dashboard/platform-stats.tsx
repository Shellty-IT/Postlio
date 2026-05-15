// src/components/dashboard/platform-stats.tsx
/**
 * Statystyki per platforma
 *
 * ✅ PRAWDZIWE DANE - obliczane z postów użytkownika
 * ✅ NAPRAWIONE - limit 100 zamiast 1000
 */

'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Facebook, Instagram, Linkedin, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePosts } from '@/hooks/usePosts';
import type { Platform } from '@/types';

// ============================================================
// KONFIGURACJA
// ============================================================

const platformConfig: Record<Platform, {
    name: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    gradient: string;
}> = {
    facebook: {
        name: 'Facebook',
        icon: <Facebook className="h-5 w-5" />,
        color: 'text-[#1877F2]',
        bg: 'bg-[#1877F2]/10',
        gradient: 'from-[#1877F2] to-[#0D5BB5]',
    },
    instagram: {
        name: 'Instagram',
        icon: <Instagram className="h-5 w-5" />,
        color: 'text-[#E4405F]',
        bg: 'bg-[#E4405F]/10',
        gradient: 'from-[#E4405F] to-[#C13584]',
    },
    linkedin: {
        name: 'LinkedIn',
        icon: <Linkedin className="h-5 w-5" />,
        color: 'text-[#0A66C2]',
        bg: 'bg-[#0A66C2]/10',
        gradient: 'from-[#0A66C2] to-[#004182]',
    },
};

// ============================================================
// KOMPONENT
// ============================================================

export function PlatformStats() {
    const router = useRouter();

    // ✅ NAPRAWIONE: limit 100 zamiast 1000
    const { data, isLoading } = usePosts({ limit: 100 });

    // Oblicz statystyki per platforma
    const platformStats = useMemo(() => {
        const posts = data?.posts || [];

        const stats: Record<Platform, { total: number; published: number; scheduled: number }> = {
            facebook: { total: 0, published: 0, scheduled: 0 },
            instagram: { total: 0, published: 0, scheduled: 0 },
            linkedin: { total: 0, published: 0, scheduled: 0 },
        };

        posts.forEach((post) => {
            const platforms = post.platforms && post.platforms.length > 0
                ? post.platforms
                : (post.platform ? [post.platform] : []);

            platforms.forEach((platform) => {
                if (platform in stats) {
                    stats[platform as Platform].total++;
                    if (post.status === 'published') {
                        stats[platform as Platform].published++;
                    } else if (post.status === 'scheduled') {
                        stats[platform as Platform].scheduled++;
                    }
                }
            });
        });

        return stats;
    }, [data?.posts]);

    // Sprawdź czy są jakieś posty
    const hasAnyPosts = Object.values(platformStats).some(s => s.total > 0);

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Platformy</h2>

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="space-y-3">
                    {(Object.keys(platformConfig) as Platform[]).map((platform, index) => {
                        const config = platformConfig[platform];
                        const stats = platformStats[platform];

                        return (
                            <motion.div
                                key={platform}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className={cn(
                                    'relative overflow-hidden rounded-xl border bg-card p-4',
                                    'transition-all duration-200 hover:shadow-md hover:border-primary/20'
                                )}
                            >
                                {/* Gradient accent */}
                                <div className={cn(
                                    'absolute top-0 left-0 w-1 h-full',
                                    'bg-gradient-to-b',
                                    config.gradient
                                )} />

                                <div className="flex items-center gap-4 pl-2">
                                    {/* Platform Icon */}
                                    <div className={cn('p-2.5 rounded-xl', config.bg, config.color)}>
                                        {config.icon}
                                    </div>

                                    {/* Platform Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium">{config.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {stats.total === 0 ? (
                                                'Brak postów'
                                            ) : (
                                                <>
                                                    {stats.total} {stats.total === 1 ? 'post' : 'postów'}
                                                    {stats.scheduled > 0 && (
                                                        <span className="text-amber-500"> · {stats.scheduled} zaplan.</span>
                                                    )}
                                                </>
                                            )}
                                        </p>
                                    </div>

                                    {/* Stats badge */}
                                    {stats.published > 0 && (
                                        <div className={cn(
                                            'px-3 py-1 rounded-full text-xs font-medium',
                                            'bg-green-500/10 text-green-600 dark:text-green-400'
                                        )}>
                                            {stats.published} opubl.
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Empty state hint */}
            {!isLoading && !hasAnyPosts && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-muted-foreground text-center py-2"
                >
                    Stwórz posty, aby zobaczyć statystyki
                </motion.p>
            )}

            {/* Connect platforms button */}
            <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() => router.push('/settings')}
            >
                <Plus className="h-4 w-4 mr-2" />
                Połącz konta social media
            </Button>
        </div>
    );
}