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
            <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <h3 className="font-medium mb-1">Brak statystyk</h3>
                <p className="text-sm">Wybierz konfigurację aby zobaczyć statystyki</p>
            </div>
        );
    }

    // Oblicz health score (jeśli nie ma z backendu, użyj domyślnego)
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

    // Statystyki platform (symulowane na podstawie danych)
    const platformStats = config.platforms.map((platform: string) => ({
        platform,
        postsPublished: Math.floor(config.total_published / config.platforms.length),
        avgEngagement: 3.5 + Math.random() * 2,
    }));

    return (
        <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                    </div>
                                    <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                                        <stat.icon className={cn("w-5 h-5", stat.color)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Health Score & Streak */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Health Score */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Target className="w-4 h-4 text-primary" />
                            Health Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="relative w-20 h-20">
                                <svg className="w-20 h-20 -rotate-90">
                                    <circle
                                        cx="40"
                                        cy="40"
                                        r="35"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="none"
                                        className="text-muted"
                                    />
                                    <circle
                                        cx="40"
                                        cy="40"
                                        r="35"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="none"
                                        strokeDasharray={`${(healthScore / 100) * 220} 220`}
                                        className={cn(
                                            healthScore >= 80 ? "text-green-500" :
                                                healthScore >= 50 ? "text-amber-500" : "text-red-500"
                                        )}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xl font-bold">{healthScore}</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">
                                    {healthScore >= 80 ? 'Świetnie! Autopilot działa optymalnie.' :
                                        healthScore >= 50 ? 'Dobrze, ale jest miejsce na poprawę.' :
                                            'Wymaga uwagi. Sprawdź konfigurację.'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Streak */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            Seria publikacji
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="text-4xl font-bold text-orange-500">
                                {streakDays}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">dni z rzędu</p>
                                <p className="text-sm text-muted-foreground">
                                    {streakDays > 0
                                        ? 'Świetna passa! Kontynuuj tak dalej.'
                                        : 'Uruchom Autopilota aby rozpocząć serię.'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Platform Performance */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Wydajność platform
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {platformStats.map((platformStat) => {
                            const colors: Record<string, string> = {
                                facebook: '#1877F2',
                                instagram: '#E4405F',
                                linkedin: '#0A66C2',
                            };

                            const totalPublished = config.total_published || 1;

                            return (
                                <div key={platformStat.platform} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: colors[platformStat.platform] || '#6B7280' }}
                                            />
                                            <span className="capitalize">{platformStat.platform}</span>
                                        </div>
                                        <span className="text-muted-foreground">
                                            {platformStat.postsPublished} postów • {platformStat.avgEngagement.toFixed(1)}% engagement
                                        </span>
                                    </div>
                                    <Progress
                                        value={(platformStat.postsPublished / totalPublished) * 100}
                                        className="h-2"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Queue Stats */}
            {stats && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Statystyki kolejki</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-amber-500">{stats.pending_count}</p>
                                <p className="text-xs text-muted-foreground">Do przeglądu</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-500">{stats.approved_count}</p>
                                <p className="text-xs text-muted-foreground">Zatwierdzone</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-blue-500">{stats.published_today}</p>
                                <p className="text-xs text-muted-foreground">Dziś opublikowane</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-purple-500">{stats.published_this_week}</p>
                                <p className="text-xs text-muted-foreground">Ten tydzień</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Next Run */}
            {config.next_generation_at && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                    <Clock className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">Następne generowanie</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(config.next_generation_at).toLocaleString('pl-PL', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
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