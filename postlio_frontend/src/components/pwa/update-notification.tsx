// postlio_frontend/src/components/pwa/update-notification.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';

export function UpdateNotification() {
    const { isUpdateAvailable, updateApp } = usePWA();

    if (!isUpdateAvailable) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className="fixed bottom-20 left-4 right-4 md:bottom-8 md:left-auto md:right-8 md:w-80 z-50"
            >
                <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                    {/* Gradient accent */}
                    <div className="h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-500" />

                    <div className="p-4">
                        <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-white mb-1">
                                    Nowa wersja dostępna!
                                </h4>
                                <p className="text-xs text-slate-400 mb-3">
                                    Odśwież aplikację aby korzystać z najnowszych funkcji.
                                </p>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={updateApp}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                                    >
                                        <RefreshCw className="w-3 h-3 mr-1.5" />
                                        Aktualizuj
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}