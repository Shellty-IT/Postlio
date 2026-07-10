'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const WEEK_DAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

interface TodayHeroProps {
    draftsCount: number;
}

export function TodayHero({ draftsCount }: TodayHeroProps) {
    const router = useRouter();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="hero-card flex flex-col gap-4 p-6 sm:p-7"
        >
            <div className="relative flex flex-col gap-3.5">
                <div className="inline-flex w-fit items-center gap-2 rounded-[9px] border border-accent/30 bg-accent/[0.14] px-2.5 py-1">
                    <span className="status-dot status-dot-pulse bg-accent text-accent" />
                    <span className="text-xs font-semibold text-accent">Rekomendacja AI</span>
                </div>
                <h2 className="text-xl font-semibold leading-tight tracking-tight sm:text-[25px]">
                    Zaplanuj swój pierwszy tydzień z AI
                </h2>
                <p className="max-w-[560px] text-sm leading-relaxed text-muted-foreground sm:text-[14.5px]">
                    {draftsCount > 0
                        ? `Masz ${draftsCount} ${draftsCount === 1 ? 'szkic' : 'szkice'}. Mogę ułożyć z ${draftsCount === 1 ? 'niego' : 'nich'} tygodniowy plan publikacji — z dobranymi godzinami dla każdej platformy.`
                        : 'Ułożę tygodniowy plan publikacji dopasowany do Twoich platform i najlepszych godzin publikacji.'}
                </p>
            </div>

            <div className="relative grid grid-cols-7 gap-2">
                {WEEK_DAYS.map((day) => (
                    <div key={day} className="flex flex-col gap-1.5">
                        <div className="text-center text-[11px] font-medium text-muted-foreground">{day}</div>
                        <div className="dashed-slot min-h-[52px] sm:min-h-[60px]" />
                    </div>
                ))}
            </div>

            <div className="relative mt-0.5 flex flex-wrap items-center gap-3">
                <button
                    onClick={() => router.push('/calendar')}
                    className="btn-gradient px-6 py-3.5 text-sm"
                >
                    <Sparkles className="h-[17px] w-[17px]" />
                    Zaplanuj tydzień z AI
                </button>
                <button
                    onClick={() => router.push('/saved-posts')}
                    className={cn(
                        'inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5',
                        'text-sm font-medium text-foreground/90 transition-colors hover:bg-white/[0.06]'
                    )}
                >
                    Przejrzyj szkice
                </button>
            </div>
        </motion.div>
    );
}
