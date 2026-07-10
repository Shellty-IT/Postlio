'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnboardingStep } from './onboarding-checklist';

interface AIAssistantCardProps {
    steps: OnboardingStep[];
}

export function AIAssistantCard({ steps }: AIAssistantCardProps) {
    const completedCount = steps.filter((step) => step.done).length;

    return (
        <div className="flex flex-col gap-3">
            <div className="mono-label">Asystent AI</div>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="ai-card flex flex-col gap-3.5 p-5"
            >
                <div className="relative flex items-center gap-3">
                    <div className="ai-pulse flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-primary to-accent shadow-glow-primary">
                        <Sparkles className="h-[22px] w-[22px] text-white" />
                    </div>
                    <div>
                        <div className="text-[14.5px] font-semibold">Asystent AI</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-success">
                            <span className="status-dot status-dot-pulse bg-success" />
                            Aktywny · analizuję konta
                        </div>
                    </div>
                </div>

                <p className="relative text-[13px] leading-relaxed text-foreground/70">
                    Prowadzę Cię krok po kroku. Połącz konta, a przygotuję gotowy plan publikacji na cały tydzień.
                </p>

                <div className="relative flex items-center justify-between pt-0.5">
                    <span className="text-xs text-muted-foreground">
                        Ukończono <span className="font-semibold text-foreground">{completedCount} z {steps.length}</span> kroków
                    </span>
                    <div className="flex gap-1">
                        {steps.map((step, index) => (
                            <span
                                key={index}
                                className={cn(
                                    'h-1 w-[22px] rounded-sm',
                                    step.done ? 'bg-gradient-to-r from-primary to-accent' : 'bg-white/10'
                                )}
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
