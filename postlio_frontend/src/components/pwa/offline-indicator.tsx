// postlio_frontend/src/components/pwa/offline-indicator.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export function OfflineIndicator() {
    const { isOnline } = usePWA();

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ opacity: 0, y: -100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -100 }}
                    className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 py-2 px-4"
                >
                    <div className="container mx-auto flex items-center justify-center gap-2 text-sm font-medium">
                        <WifiOff className="w-4 h-4" />
                        <span>Brak połączenia z internetem</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}