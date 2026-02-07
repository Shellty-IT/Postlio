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
            color: 'text-warning',
            bgColor: 'bg-warning/10',
        },
        {
            label: 'Opublikowane',
            shortLabel: 'Opubl.',
            value: stats.published,
            icon: CheckCircle,
            color: 'text-success',
            bgColor: 'bg-success/10',
        },
        {
            label: 'Błędy',
            shortLabel: 'Błędy',
            value: stats.failed,
            icon: AlertCircle,
            color: 'text-destructive',
            bgColor: 'bg-destructive/10',
            hideIfZero: true,
        },
        {
            label: 'AI Generated',
            shortLabel: 'AI',
            value: stats.aiGenerated,
            icon: Sparkles,
            color: 'text-violet-500',
            bgColor: 'bg-violet-500/10',
        },
    ];

    const visibleItems = items.filter(item => !item.hideIfZero || item.value > 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 sm:gap-3"
        >
            {visibleItems.map((item, index) => (
                <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                        "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg",
                        item.bgColor
                    )}
                >
                    <item.icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", item.color)} />
                    <span className="text-xs sm:text-sm font-medium">{item.value}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                        <span className="xs:hidden">{item.shortLabel}</span>
                        <span className="hidden xs:inline">{item.label}</span>
                    </span>
                </motion.div>
            ))}
        </motion.div>
    );
}