// src/components/dashboard/quick-actions.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    PenTool,
    Zap,
    Calendar,
    ImagePlus,
    Sparkles,
    ArrowRight,
} from 'lucide-react';

interface ActionCardProps {
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    gradient: string;
    delay?: number;
}

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
                    'bg-gradient-to-br',
                    gradient,
                    'text-white',
                    'transition-all duration-300',
                    'hover:shadow-xl hover:-translate-y-1',
                    'min-h-[160px]'
                )}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white blur-3xl translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white blur-2xl -translate-x-1/2 translate-y-1/2" />
                </div>

                {/* Icon */}
                <div className="relative mb-auto">
                    <div className="inline-flex p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                        {icon}
                    </div>
                </div>

                {/* Content */}
                <div className="relative mt-4">
                    <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                        {title}
                        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                    </h3>
                    <p className="text-sm text-white/80">{description}</p>
                </div>
            </Link>
        </motion.div>
    );
}

export function QuickActions() {
    const actions: ActionCardProps[] = [
        {
            title: 'Kreator AI',
            description: 'Stwórz post z pomocą asystenta AI',
            href: '/creator',
            icon: <PenTool className="h-6 w-6" />,
            gradient: 'from-primary to-blue-600',
        },
        {
            title: 'Autopilot',
            description: 'Automatyczne generowanie i publikacja',
            href: '/autopilot',
            icon: <Zap className="h-6 w-6" />,
            gradient: 'from-accent to-purple-600',
        },
        {
            title: 'Harmonogram',
            description: 'Zarządzaj kalendarzem publikacji',
            href: '/calendar',
            icon: <Calendar className="h-6 w-6" />,
            gradient: 'from-success to-emerald-600',
        },
        {
            title: 'Generuj Grafiki',
            description: 'Twórz obrazy AI do postów',
            href: '/creator?tab=images',
            icon: <ImagePlus className="h-6 w-6" />,
            gradient: 'from-warning to-orange-600',
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Szybkie akcje</h2>
                <Sparkles className="h-5 w-5 text-accent" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {actions.map((action, index) => (
                    <ActionCard key={action.href} {...action} delay={index * 0.1} />
                ))}
            </div>
        </div>
    );
}