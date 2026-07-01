'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutopilotStatusCardProps {
    isActive: boolean;
}

export function AutopilotStatusCard({ isActive }: AutopilotStatusCardProps) {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-3">
            <div className="mono-label">Autopilot</div>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card flex flex-col gap-3.5 p-5"
            >
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/[0.12] text-warning">
                        <Zap className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                        <div className="text-sm font-semibold">Mission Control</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span
                                className={cn(
                                    'h-1.5 w-1.5 rounded-full',
                                    isActive ? 'bg-success' : 'bg-muted-foreground/50'
                                )}
                            />
                            {isActive ? 'Aktywny' : 'Offline'}
                        </div>
                    </div>
                </div>

                <p className="text-[13px] leading-relaxed text-muted-foreground">
                    {isActive
                        ? 'Autopilot generuje i publikuje treści zgodnie z Twoim harmonogramem.'
                        : 'Włącz autonomiczne tworzenie i publikację treści. AI poprowadzi Cię przez konfigurację krok po kroku.'}
                </p>

                <button
                    onClick={() => router.push('/autopilot')}
                    className="inline-flex items-center justify-center gap-2 rounded-[11px] border border-primary/[0.22] bg-primary/[0.08] py-2.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/[0.14]"
                >
                    {isActive ? 'Przejdź do Autopilota' : 'Skonfiguruj Autopilota'}
                    <ArrowRight className="h-[15px] w-[15px]" />
                </button>
            </motion.div>
        </div>
    );
}
