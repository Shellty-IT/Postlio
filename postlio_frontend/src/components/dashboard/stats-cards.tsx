// src/components/dashboard/stats-cards.tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    FileText,
    Calendar,
    CheckCircle2,
    Edit3,
    Loader2,
} from 'lucide-react';
import { usePostsStats } from '@/hooks/usePosts';

// ============================================================
// TYPY
// ============================================================

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    gradient: string;
    iconBg: string;
    delay?: number;
    isLoading?: boolean;
}

// ============================================================
// KOMPONENT KARTY
// ============================================================

function StatCard({
                      title,
                      value,
                      subtitle,
                      icon,
                      gradient,
                      iconBg,
                      delay = 0,
                      isLoading
                  }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className={cn(
                'relative overflow-hidden rounded-2xl p-6',
                'bg-gradient-to-br',
                gradient,
                'text-white',
                'transition-all duration-300 hover:shadow-xl hover:-translate-y-1'
            )}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white blur-3xl translate-x-1/2 -translate-y-1/2" />
            </div>

            <div className="relative">
                {/* Icon */}
                <div className={cn('inline-flex p-3 rounded-xl mb-4', iconBg)}>
                    {icon}
                </div>

                {/* Value */}
                <div className="space-y-1">
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <h3 className="text-4xl font-bold">{value}</h3>
                    )}
                    <p className="text-white/90 font-medium">{title}</p>
                    {subtitle && (
                        <p className="text-sm text-white/70">{subtitle}</p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================
// KOMPONENT GŁÓWNY
// ============================================================

export function StatsCards() {
    // Używamy lekkiego endpointu /posts/stats zamiast pobierania wszystkich postów
    const { data: stats, isLoading, isError } = usePostsStats();

    // Oblicz wartości z odpowiedzi API
    const total = stats?.total ?? 0;
    const scheduled = stats?.by_status?.scheduled ?? 0;
    const published = stats?.by_status?.published ?? 0;
    const drafts = stats?.by_status?.draft ?? 0;

    // W przypadku błędu pokazujemy 0
    const showLoading = isLoading && !isError;

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Wszystkie posty"
                value={total}
                subtitle="Łącznie w systemie"
                icon={<FileText className="h-6 w-6" />}
                gradient="from-blue-500 to-blue-600"
                iconBg="bg-white/20"
                delay={0}
                isLoading={showLoading}
            />
            <StatCard
                title="Zaplanowane"
                value={scheduled}
                subtitle="Oczekujące na publikację"
                icon={<Calendar className="h-6 w-6" />}
                gradient="from-violet-500 to-purple-600"
                iconBg="bg-white/20"
                delay={0.1}
                isLoading={showLoading}
            />
            <StatCard
                title="Opublikowane"
                value={published}
                subtitle="Wysłane na platformy"
                icon={<CheckCircle2 className="h-6 w-6" />}
                gradient="from-emerald-500 to-green-600"
                iconBg="bg-white/20"
                delay={0.2}
                isLoading={showLoading}
            />
            <StatCard
                title="Szkice"
                value={drafts}
                subtitle="Do dokończenia"
                icon={<Edit3 className="h-6 w-6" />}
                gradient="from-amber-500 to-orange-600"
                iconBg="bg-white/20"
                delay={0.3}
                isLoading={showLoading}
            />
        </div>
    );
}