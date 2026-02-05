// src/components/dashboard/stats-cards.tsx
/**
 * Karty ze statystykami na dashboardzie
 *
 * ✅ PRAWDZIWE DANE z API
 */

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
import { usePosts } from '@/hooks/usePosts';

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
    // Pobierz prawdziwe dane
    const { data: allPostsData, isLoading: loadingAll } = usePosts({ limit: 1000 });
    const { data: scheduledData, isLoading: loadingScheduled } = usePosts({ status: 'scheduled', limit: 1000 });
    const { data: publishedData, isLoading: loadingPublished } = usePosts({ status: 'published', limit: 1000 });
    const { data: draftData, isLoading: loadingDraft } = usePosts({ status: 'draft', limit: 1000 });

    const isLoading = loadingAll || loadingScheduled || loadingPublished || loadingDraft;

    // Oblicz statystyki
    const stats = {
        total: allPostsData?.count ?? 0,
        scheduled: scheduledData?.count ?? 0,
        published: publishedData?.count ?? 0,
        drafts: draftData?.count ?? 0,
    };

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Wszystkie posty"
                value={stats.total}
                subtitle="Łącznie w systemie"
                icon={<FileText className="h-6 w-6" />}
                gradient="from-blue-500 to-blue-600"
                iconBg="bg-white/20"
                delay={0}
                isLoading={isLoading}
            />
            <StatCard
                title="Zaplanowane"
                value={stats.scheduled}
                subtitle="Oczekujące na publikację"
                icon={<Calendar className="h-6 w-6" />}
                gradient="from-violet-500 to-purple-600"
                iconBg="bg-white/20"
                delay={0.1}
                isLoading={isLoading}
            />
            <StatCard
                title="Opublikowane"
                value={stats.published}
                subtitle="Wysłane na platformy"
                icon={<CheckCircle2 className="h-6 w-6" />}
                gradient="from-emerald-500 to-green-600"
                iconBg="bg-white/20"
                delay={0.2}
                isLoading={isLoading}
            />
            <StatCard
                title="Szkice"
                value={stats.drafts}
                subtitle="Do dokończenia"
                icon={<Edit3 className="h-6 w-6" />}
                gradient="from-amber-500 to-orange-600"
                iconBg="bg-white/20"
                delay={0.3}
                isLoading={isLoading}
            />
        </div>
    );
}