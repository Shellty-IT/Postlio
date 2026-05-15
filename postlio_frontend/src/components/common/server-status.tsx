// src/components/common/server-status.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, WifiOff } from 'lucide-react';
import { useWarmup } from '@/hooks/useWarmup';

export function ServerStatus() {
    const { status, isWarming } = useWarmup();

    return (
        <AnimatePresence>
            {isWarming && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)]"
                >
                    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary animate-spin flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-primary font-medium whitespace-nowrap">
                            Łączenie z serwerem...
                        </span>
                    </div>
                </motion.div>
            )}

            {status === 'error' && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)]"
                >
                    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 backdrop-blur-sm">
                        <WifiOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-destructive font-medium whitespace-nowrap">
                            Nie można połączyć z serwerem
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}