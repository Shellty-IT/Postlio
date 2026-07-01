//calendar-stats.tsx

'use client';

import { motion } from 'framer-motion';
import {
    Clock,
    CheckCircle,
    AlertCircle,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScheduledPost } from '@/types/calendar';

interface CalendarStatsProps {
    posts: ScheduledPost[];
}

export function CalendarStats({ posts }: CalendarStatsProps) {
    const stats = {
        total: posts.length,
        scheduled: posts.filter(p => p.status === 'scheduled').length,
        published: posts.filter(p => p.status === 'published').length,
        failed: posts.filter(p => p.status === 'failed').length,
        aiGenerated: posts.filter(p => p.aiGenerated).length,
    };

    const items = [
        {
            label: 'Zaplanowane',
            shortLabel: 'Zapl.',
            value: stats.scheduled,
            icon: Clock,
            variant: 'default' as const,
        },
        {
            label: 'Opublikowane',
            shortLabel: 'Opubl.',
            value: stats.published,
            icon: CheckCircle,
            variant: 'default' as const,
        },
        {
            label: 'Błędy',
            shortLabel: 'Błędy',
            value: stats.failed,
            icon: AlertCircle,
            variant: 'destructive' as const,
            hideIfZero: true,
        },
        {
            label: 'AI Generated',
            shortLabel: 'AI',
            value: stats.aiGenerated,
            icon: Sparkles,
            variant: 'ai' as const,
        },
    ];

    const visibleItems = items.filter(item => !item.hideIfZero || item.value > 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 sm:gap-2.5"
        >
            {visibleItems.map((item, index) => (
                <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                        "flex items-center gap-1.5 sm:gap-2 rounded-xl border px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-[13px]",
                        item.variant === 'ai' &&
                            "border-[hsl(225_100%_78%/0.25)] bg-gradient-to-br from-primary/[0.14] to-accent/10 text-[#c3ccff]",
                        item.variant === 'destructive' &&
                            "border-destructive/20 bg-destructive/10 text-destructive",
                        item.variant === 'default' &&
                            "border-white/[0.07] bg-white/[0.025] text-muted-foreground"
                    )}
                >
                    <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="font-semibold text-foreground">{item.value}</span>
                    <span>
                        <span className="xs:hidden">{item.shortLabel}</span>
                        <span className="hidden xs:inline">{item.label}</span>
                    </span>
                </motion.div>
            ))}
        </motion.div>
    );
}