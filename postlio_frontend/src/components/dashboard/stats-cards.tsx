// src/components/dashboard/stats-cards.tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    FileText,
    Calendar,
    CheckCircle2,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: React.ReactNode;
    color: 'blue' | 'violet' | 'green' | 'orange';
    delay?: number;
}

const colorVariants = {
    blue: {
        bg: 'bg-primary/10',
        icon: 'text-primary',
        border: 'border-primary/20',
    },
    violet: {
        bg: 'bg-accent/10',
        icon: 'text-accent',
        border: 'border-accent/20',
    },
    green: {
        bg: 'bg-success/10',
        icon: 'text-success',
        border: 'border-success/20',
    },
    orange: {
        bg: 'bg-warning/10',
        icon: 'text-warning',
        border: 'border-warning/20',
    },
};

function StatCard({ title, value, change, changeLabel, icon, color, delay = 0 }: StatCardProps) {
    const colors = colorVariants[color];
    const isPositive = change && change > 0;
    const isNegative = change && change < 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className={cn(
                'relative overflow-hidden rounded-2xl border bg-card p-6',
                'transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
                colors.border
            )}
        >
            {/* Background Gradient */}
            <div
                className={cn(
                    'absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2',
                    colors.bg
                )}
            />

            <div className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className={cn('p-2.5 rounded-xl', colors.bg)}>
                        <div className={colors.icon}>{icon}</div>
                    </div>

                    {change !== undefined && (
                        <div
                            className={cn(
                                'flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full',
                                isPositive && 'text-success bg-success/10',
                                isNegative && 'text-destructive bg-destructive/10',
                                !isPositive && !isNegative && 'text-muted-foreground bg-muted'
                            )}
                        >
                            {isPositive && <ArrowUpRight className="h-3.5 w-3.5" />}
                            {isNegative && <ArrowDownRight className="h-3.5 w-3.5" />}
                            {Math.abs(change)}%
                        </div>
                    )}
                </div>

                {/* Value */}
                <div className="space-y-1">
                    <h3 className="text-3xl font-bold">{value}</h3>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    {changeLabel && (
                        <p className="text-xs text-muted-foreground">{changeLabel}</p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

interface StatsCardsProps {
    stats?: {
        totalPosts: number;
        scheduledPosts: number;
        publishedPosts: number;
        engagementRate: number;
        totalPostsChange?: number;
        scheduledPostsChange?: number;
        publishedPostsChange?: number;
        engagementChange?: number;
    };
}

export function StatsCards({ stats }: StatsCardsProps) {
    // Mock data jeśli brak prawdziwych danych
    const data = stats || {
        totalPosts: 47,
        scheduledPosts: 12,
        publishedPosts: 35,
        engagementRate: 4.8,
        totalPostsChange: 12,
        scheduledPostsChange: 8,
        publishedPostsChange: 15,
        engagementChange: -2,
    };

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Wszystkie posty"
                value={data.totalPosts}
                change={data.totalPostsChange}
                changeLabel="vs poprzedni miesiąc"
                icon={<FileText className="h-5 w-5" />}
                color="blue"
                delay={0}
            />
            <StatCard
                title="Zaplanowane"
                value={data.scheduledPosts}
                change={data.scheduledPostsChange}
                changeLabel="do publikacji"
                icon={<Calendar className="h-5 w-5" />}
                color="violet"
                delay={0.1}
            />
            <StatCard
                title="Opublikowane"
                value={data.publishedPosts}
                change={data.publishedPostsChange}
                changeLabel="w tym miesiącu"
                icon={<CheckCircle2 className="h-5 w-5" />}
                color="green"
                delay={0.2}
            />
            <StatCard
                title="Engagement"
                value={`${data.engagementRate}%`}
                change={data.engagementChange}
                changeLabel="średni współczynnik"
                icon={<TrendingUp className="h-5 w-5" />}
                color="orange"
                delay={0.3}
            />
        </div>
    );
}