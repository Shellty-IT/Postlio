// src/components/landing/pricing-toggle.tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PricingToggleProps {
    isYearly: boolean;
    onToggle: (isYearly: boolean) => void;
}

export function PricingToggle({ isYearly, onToggle }: PricingToggleProps) {
    return (
        <div className="flex items-center justify-center gap-3 sm:gap-4">
            <span
                className={cn(
                    'text-xs sm:text-sm font-medium transition-colors cursor-pointer',
                    !isYearly ? 'text-foreground' : 'text-muted-foreground'
                )}
                onClick={() => onToggle(false)}
            >
                Miesięcznie
            </span>

            <button
                onClick={() => onToggle(!isYearly)}
                className="relative w-14 sm:w-16 h-7 sm:h-8 rounded-full bg-muted border border-border transition-colors hover:border-primary/50"
                aria-label="Toggle billing period"
            >
                <motion.div
                    className="absolute top-0.5 sm:top-1 w-5.5 sm:w-6 h-5.5 sm:h-6 rounded-full bg-gradient-to-br from-primary to-violet-500 shadow-lg"
                    style={{ width: 22, height: 22 }}
                    animate={{ left: isYearly ? 'calc(100% - 26px)' : '4px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
                <span
                    className={cn(
                        'text-xs sm:text-sm font-medium transition-colors cursor-pointer',
                        isYearly ? 'text-foreground' : 'text-muted-foreground'
                    )}
                    onClick={() => onToggle(true)}
                >
                    Rocznie
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] sm:text-xs font-medium">
                    -20%
                </span>
            </div>
        </div>
    );
}