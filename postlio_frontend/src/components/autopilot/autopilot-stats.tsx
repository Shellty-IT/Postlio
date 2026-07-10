// src/components/autopilot/autopilot-stats.tsx
'use client';

import { motion } from 'framer-motion';
import {
    TrendingUp,
    CheckCircle2,
    Clock,
    XCircle,
    Zap,
    BarChart3,
    Target,
    Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { BackendAutopilotConfig, BackendQueueStats } from '@/types/autopilot';

interface AutopilotStatsProps {
    configId: number | null;
    config?: BackendAutopilotConfig;
    stats?: BackendQueueStats;
}

export function AutopilotStats({ configId, config, stats }: AutopilotStatsProps) {
    if (!configId || !config) {
        return (
            <div className="empty-state-card">
                <div className="w-[54px] h-[54px] rounded-2xl bg-white/[0.05] flex items-center justify-center text-muted-foreground">
                    <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-semibold text-base">Brak statystyk</h3>
                    <p className="text-sm text-muted-foreground mt-1.5">Wybierz konfigurację aby zobaczyć statystyki</p>
                </div>
            </div>
        );
    }

    const healthScore = config.health_score ?? 75;
    const streakDays = config.streak_days ?? 0;

    const statCards = [
        {
            title: 'Wygenerowano',
            value: config.total_generated,
            icon: Zap,
            color: 'text-violet-500',
            bgColor: 'bg-violet-500/10',
        },
        {
            title: 'Opublikowano',
            value: config.total_published,
            icon: CheckCircle2,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
        },
        {
            title: 'W kolejce',
            value: (stats?.pending_count ?? 0) + (stats?.approved_count ?? 0),
            icon: Clock,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
        },
        {
            title: 'Odrzucono',
            value: config.total_rejected,
            icon: XCircle,
            color: 'text-red-500',
            bgColor: 'bg-red-500/10',
        },
    ];

    const platformStats = config.platforms.map((platform: string) => ({
        platform,
        postsPublished: Math.floor(config.total_published / config.platforms.length),
        avgEngagement: 3.5 + Math.random() * 2,
    }));

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="glass-card shadow-none">
                            <CardContent className="p-3 xs:p-4">
                                <div className="flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground truncate">{stat.title}</p>
                                        <p className="text-lg xs:text-xl sm:text-2xl font-bold mt-0.5 xs:mt-1">{stat.value}</p>
                                    </div>
                                    <div className={cn("p-2 xs:p-2.5 sm:p-3 rounded-lg xs:rounded-xl flex-shrink-0", stat.bgColor)}>
                                        <stat.icon className={cn("w-4 h-4 xs:w-5 xs:h-5", stat.color)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Card className="glass-card shadow-none">
                    <CardHeader className="pb-2 p-3 xs:p-4 sm:p-6 sm:pb-2">
                        <CardTitle className="text-xs xs:text-sm font-medium flex items-center gap-2">
                            <Target className="w-4 h-4 text-primary" />
                            Health Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 xs:p-4 sm:p-6 pt-0 sm:pt-0">
                        <div className="flex items-center gap-3 xs:gap-4">
                            <div className="relative w-16 h-16 xs:w-20 xs:h-20 flex-shrink-0">
                                <svg className="w-16 h-16 xs:w-20 xs:h-20 -rotate-90">
                                    <circle
                                        cx="50%"
                                        cy="50%"
                                        r="45%"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="none"
                                        className="text-muted"
                                    />
                                    <circle
                                        cx="50%"
                                        cy="50%"
                                        r="45%"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="none"
                                        strokeDasharray={`${(healthScore / 100) * 180} 180`}
                                        className={cn(
                                            healthScore >= 80 ? "text-green-500" :
                                                healthScore >= 50 ? "text-amber-500" : "text-red-500"
                                        )}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-base xs:text-xl font-bold">{healthScore}</span>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs xs:text-sm text-muted-foreground">
                                    {healthScore >= 80 ? 'Świetnie! Autopilot działa optymalnie.' :
                                        healthScore >= 50 ? 'Dobrze, ale jest miejsce na poprawę.' :
                                            'Wymaga uwagi.'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card shadow-none">
                    <CardHeader className="pb-2 p-3 xs:p-4 sm:p-6 sm:pb-2">
                        <CardTitle className="text-xs xs:text-sm font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            Seria publikacji
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 xs:p-4 sm:p-6 pt-0 sm:pt-0">
                        <div className="flex items-center gap-3 xs:gap-4">
                            <div className="text-3xl xs:text-4xl font-bold text-orange-500 flex-shrink-0">
                                {streakDays}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm xs:text-base">dni z rzędu</p>
                                <p className="text-xs xs:text-sm text-muted-foreground">
                                    {streakDays > 0
                                        ? 'Świetna passa!'
                                        : 'Uruchom Autopilota.'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="glass-card shadow-none">
                <CardHeader className="p-3 xs:p-4 sm:p-6">
                    <CardTitle className="text-xs xs:text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Wydajność platform
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 xs:p-4 sm:p-6 pt-0 sm:pt-0">
                    <div className="space-y-3 xs:space-y-4">
                        {platformStats.map((platformStat) => {
                            const colors: Record<string, string> = {
                                facebook: '#1877F2',
                                instagram: '#E4405F',
                                linkedin: '#0A66C2',
                            };

                            const totalPublished = config.total_published || 1;

                            return (
                                <div key={platformStat.platform} className="space-y-1.5 xs:space-y-2">
                                    <div className="flex items-center justify-between text-xs xs:text-sm">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2.5 h-2.5 xs:w-3 xs:h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: colors[platformStat.platform] || '#6B7280' }}
                                            />
                                            <span className="capitalize">{platformStat.platform}</span>
                                        </div>
                                        <span className="text-muted-foreground text-[10px] xs:text-xs">
                                            {platformStat.postsPublished} postów
                                        </span>
                                    </div>
                                    <Progress
                                        value={(platformStat.postsPublished / totalPublished) * 100}
                                        className="h-1.5 xs:h-2"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {stats && (
                <Card className="glass-card shadow-none">
                    <CardHeader className="p-3 xs:p-4 sm:p-6">
                        <CardTitle className="text-xs xs:text-sm font-medium">Statystyki kolejki</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 xs:p-4 sm:p-6 pt-0 sm:pt-0">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 xs:gap-4 text-center">
                            <div>
                                <p className="text-lg xs:text-xl sm:text-2xl font-bold text-amber-500">{stats.pending_count}</p>
                                <p className="text-[10px] xs:text-xs text-muted-foreground">Do przeglądu</p>
                            </div>
                            <div>
                                <p className="text-lg xs:text-xl sm:text-2xl font-bold text-green-500">{stats.approved_count}</p>
                                <p className="text-[10px] xs:text-xs text-muted-foreground">Zatwierdzone</p>
                            </div>
                            <div>
                                <p className="text-lg xs:text-xl sm:text-2xl font-bold text-blue-500">{stats.published_today}</p>
                                <p className="text-[10px] xs:text-xs text-muted-foreground">Dziś</p>
                            </div>
                            <div>
                                <p className="text-lg xs:text-xl sm:text-2xl font-bold text-purple-500">{stats.published_this_week}</p>
                                <p className="text-[10px] xs:text-xs text-muted-foreground">Ten tydzień</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {config.next_generation_at && (
                <Card className="glass-card shadow-none">
                    <CardContent className="p-3 xs:p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 xs:gap-3 min-w-0">
                                <div className="p-1.5 xs:p-2 rounded-lg bg-primary/10 flex-shrink-0">
                                    <Clock className="w-4 h-4 xs:w-5 xs:h-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-sm xs:text-base">Następne generowanie</p>
                                    <p className="text-xs xs:text-sm text-muted-foreground truncate">
                                        {new Date(config.next_generation_at).toLocaleString('pl-PL', {
                                            weekday: 'short',
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}