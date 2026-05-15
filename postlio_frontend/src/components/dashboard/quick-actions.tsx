// src/components/dashboard/quick-actions.tsx
/**
 * Szybkie akcje na dashboardzie
 *
 * ✅ ZAKTUALIZOWANE - lepsze akcje
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    PenTool,
    Zap,
    Calendar,
    FileText,
    ArrowRight,
} from 'lucide-react';

// ============================================================
// TYPY
// ============================================================

interface ActionCardProps {
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    gradient: string;
    delay?: number;
}

// ============================================================
// KOMPONENT KARTY
// ============================================================

function ActionCard({ title, description, href, icon, gradient, delay = 0 }: ActionCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay }}
        >
            <Link
                href={href}
                className={cn(
                    'group relative flex flex-col overflow-hidden rounded-2xl p-6',
                    'border bg-card',
                    'transition-all duration-300',
                    'hover:shadow-xl hover:-translate-y-1 hover:border-primary/20',
                    'min-h-[140px]'
                )}
            >
                {/* Gradient accent bar */}
                <div className={cn(
                    'absolute top-0 left-0 right-0 h-1',
                    'bg-gradient-to-r',
                    gradient
                )} />

                {/* Icon */}
                <div className="relative mb-auto">
                    <div className={cn(
                        'inline-flex p-3 rounded-xl',
                        'bg-gradient-to-br',
                        gradient
                    )}>
                        <span className="text-white">{icon}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="relative mt-4">
                    <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                        {title}
                        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 text-primary" />
                    </h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </Link>
        </motion.div>
    );
}

// ============================================================
// KOMPONENT GŁÓWNY
// ============================================================

export function QuickActions() {
    const actions: ActionCardProps[] = [
        {
            title: 'Kreator AI',
            description: 'Stwórz post z pomocą asystenta AI',
            href: '/creator',
            icon: <PenTool className="h-6 w-6" />,
            gradient: 'from-blue-500 to-blue-600',
        },
        {
            title: 'Zaplanuj publikację',
            description: 'Ustaw harmonogram postów',
            href: '/calendar',
            icon: <Calendar className="h-6 w-6" />,
            gradient: 'from-emerald-500 to-green-600',
        },
        {
            title: 'Autopilot AI',
            description: 'Automatyczne generowanie i publikacja',
            href: '/autopilot',
            icon: <Zap className="h-6 w-6" />,
            gradient: 'from-violet-500 to-purple-600',
        },
        {
            title: 'Materiały',
            description: 'Przeglądaj zapisane posty',
            href: '/saved-posts',
            icon: <FileText className="h-6 w-6" />,
            gradient: 'from-amber-500 to-orange-600',
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Szybkie akcje</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {actions.map((action, index) => (
                    <ActionCard key={action.href} {...action} delay={index * 0.1} />
                ))}
            </div>
        </div>
    );
}