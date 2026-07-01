'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OnboardingStep {
    label: string;
    done: boolean;
}

const STEP_HREFS = ['/dashboard', '/settings', '/brands', '/autopilot'];

interface OnboardingChecklistProps {
    steps: OnboardingStep[];
}

export function OnboardingChecklist({ steps }: OnboardingChecklistProps) {
    const router = useRouter();
    const completedCount = steps.filter((step) => step.done).length;
    const progress = (completedCount / steps.length) * 100;
    const activeIndex = steps.findIndex((step) => !step.done);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="glass-card flex flex-col gap-4 p-5 sm:p-[22px]"
        >
            <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold">Pierwsze kroki</h3>
                <span className="font-mono text-xs text-muted-foreground">
                    {completedCount} / {steps.length}
                </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent shadow-glow-primary transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="mt-0.5 flex flex-col gap-1.5">
                {steps.map((step, index) => {
                    const isActive = !step.done && index === activeIndex;

                    return (
                        <div
                            key={step.label}
                            onClick={() => !step.done && router.push(STEP_HREFS[index] || '/dashboard')}
                            className={cn(
                                'flex items-center gap-2.5 rounded-[11px] px-2.5 py-2 transition-colors',
                                step.done && 'px-1',
                                isActive && 'cursor-pointer border border-primary/20 bg-primary/[0.08] hover:bg-primary/[0.13]',
                                !step.done && !isActive && 'cursor-pointer hover:bg-white/[0.035]'
                            )}
                        >
                            <span
                                className={cn(
                                    'flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full',
                                    step.done && 'border border-success/35 bg-success/15 text-success',
                                    isActive && 'border-[1.5px] border-primary/55 text-primary',
                                    !step.done && !isActive && 'border-[1.5px] border-white/[0.14]'
                                )}
                            >
                                {step.done && <Check className="h-3 w-3" strokeWidth={2.4} />}
                            </span>
                            <span
                                className={cn(
                                    'text-[13.5px]',
                                    step.done && 'text-muted-foreground line-through',
                                    isActive && 'font-medium text-foreground',
                                    !step.done && !isActive && 'text-muted-foreground'
                                )}
                            >
                                {step.label}
                            </span>
                            {isActive && <ChevronRight className="ml-auto h-4 w-4 text-primary" />}
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
