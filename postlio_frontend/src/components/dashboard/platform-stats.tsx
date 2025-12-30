// src/components/dashboard/platform-stats.tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Facebook, Instagram, Linkedin, TrendingUp } from 'lucide-react';
import type { Platform } from '@/types';

interface PlatformStat {
    platform: Platform;
    posts: number;
    engagement: number;
    followers?: number;
    trend: number;
}

const platformConfig: Record<Platform, { name: string; icon: React.ReactNode; color: string; bg: string }> = {
    facebook: {
        name: 'Facebook',
        icon: <Facebook className="h-5 w-5" />,
        color: 'text-[#1877F2]',
        bg: 'bg-[#1877F2]/10',
    },
    instagram: {
        name: 'Instagram',
        icon: <Instagram className="h-5 w-5" />,
        color: 'text-[#E4405F]',
        bg: 'bg-[#E4405F]/10',
    },
    linkedin: {
        name: 'LinkedIn',
        icon: <Linkedin className="h-5 w-5" />,
        color: 'text-[#0A66C2]',
        bg: 'bg-[#0A66C2]/10',
    },
};

interface PlatformStatsProps {
    stats?: PlatformStat[];
}

export function PlatformStats({ stats }: PlatformStatsProps) {
    // Mock data
    const data: PlatformStat[] = stats || [
        { platform: 'facebook', posts: 18, engagement: 5.2, followers: 1240, trend: 8 },
        { platform: 'instagram', posts: 24, engagement: 7.8, followers: 3420, trend: 15 },
        { platform: 'linkedin', posts: 12, engagement: 3.4, followers: 890, trend: 5 },
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Platformy</h2>

            <div className="space-y-3">
                {data.map((stat, index) => {
                    const config = platformConfig[stat.platform];

                    return (
                        <motion.div
                            key={stat.platform}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className={cn(
                                'flex items-center gap-4 p-4 rounded-xl border bg-card',
                                'transition-all duration-200 hover:shadow-md'
                            )}
                        >
                            {/* Platform Icon */}
                            <div className={cn('p-2.5 rounded-xl', config.bg, config.color)}>
                                {config.icon}
                            </div>

                            {/* Platform Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium">{config.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {stat.posts} postów · {stat.engagement}% engagement
                                </p>
                            </div>

                            {/* Trend */}
                            <div className="flex items-center gap-1 text-sm text-success">
                                <TrendingUp className="h-4 w-4" />
                                +{stat.trend}%
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Connect More Platforms */}
            <button className="w-full p-4 rounded-xl border border-dashed border-border text-muted-foreground text-sm hover:border-primary hover:text-primary transition-colors">
                + Połącz więcej platform
            </button>
        </div>
    );
}