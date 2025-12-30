// src/components/calendar/calendar-stats.tsx
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
            value: stats.scheduled,
            icon: Clock,
            color: 'text-warning',
            bgColor: 'bg-warning/10',
        },
        {
            label: 'Opublikowane',
            value: stats.published,
            icon: CheckCircle,
            color: 'text-success',
            bgColor: 'bg-success/10',
        },
        {
            label: 'Błędy',
            value: stats.failed,
            icon: AlertCircle,
            color: 'text-destructive',
            bgColor: 'bg-destructive/10',
        },
        {
            label: 'AI Generated',
            value: stats.aiGenerated,
            icon: Sparkles,
            color: 'text-violet-500',
            bgColor: 'bg-violet-500/10',
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-3 mb-6"
        >
            {items.map((item, index) => (
                <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg",
                        item.bgColor
                    )}
                >
                    <item.icon className={cn("h-4 w-4", item.color)} />
                    <span className="text-sm font-medium">{item.value}</span>
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                </motion.div>
            ))}
        </motion.div>
    );
}