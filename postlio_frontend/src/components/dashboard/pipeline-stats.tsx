'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Edit3, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineStatsProps {
    drafts: number;
    scheduled: number;
    published: number;
}

interface Segment {
    label: string;
    value: number;
    subtitle: string;
    icon: React.ReactNode;
    active: boolean;
    iconBg: string;
    iconColor: string;
    subtitleColor: string;
}

export function PipelineStats({ drafts, scheduled, published }: PipelineStatsProps) {
    const segments: Segment[] = [
        {
            label: 'Szkice',
            value: drafts,
            subtitle: 'do dokończenia',
            icon: <Edit3 className="h-[15px] w-[15px]" />,
            active: drafts > 0,
            iconBg: 'bg-warning/15',
            iconColor: 'text-warning',
            subtitleColor: 'text-warning',
        },
        {
            label: 'Zaplanowane',
            value: scheduled,
            subtitle: 'w kolejce',
            icon: <Clock className="h-[15px] w-[15px]" />,
            active: false,
            iconBg: 'bg-primary/[0.12]',
            iconColor: 'text-primary',
            subtitleColor: 'text-muted-foreground',
        },
        {
            label: 'Opublikowane',
            value: published,
            subtitle: 'w tym miesiącu',
            icon: <CheckCircle2 className="h-[15px] w-[15px]" />,
            active: false,
            iconBg: 'bg-success/[0.12]',
            iconColor: 'text-success',
            subtitleColor: 'text-muted-foreground',
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-card flex flex-col items-stretch gap-2 p-2 sm:flex-row sm:gap-0"
        >
            {segments.map((segment, index) => (
                <div key={segment.label} className="flex flex-1 items-stretch">
                    <div
                        className={cn(
                            'flex flex-1 flex-col gap-2.5 rounded-[15px] px-5 py-4',
                            segment.active && 'border border-warning/15 bg-warning/[0.06]'
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <span className={cn('flex h-7 w-7 items-center justify-center rounded-[9px]', segment.iconBg, segment.iconColor)}>
                                {segment.icon}
                            </span>
                            <span className="text-[13px] font-medium text-muted-foreground">{segment.label}</span>
                        </div>
                        <div className="flex items-baseline gap-2.5">
                            <span
                                className={cn(
                                    'text-[34px] font-semibold leading-none tracking-tight',
                                    !segment.active && segment.value === 0 && 'text-muted-foreground'
                                )}
                            >
                                {segment.value}
                            </span>
                            <span className={cn('text-[12.5px]', segment.subtitleColor)}>{segment.subtitle}</span>
                        </div>
                    </div>
                    {index < segments.length - 1 && (
                        <div className="hidden items-center px-1.5 text-muted-foreground/60 sm:flex">
                            <ArrowRight className="h-5 w-5" />
                        </div>
                    )}
                </div>
            ))}
        </motion.div>
    );
}
