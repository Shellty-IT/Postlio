// postlio_frontend/src/components/pwa/install-prompt.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Zap, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';

export function InstallPrompt() {
    const { isInstallable, isInstalled, installApp } = usePWA();
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Sprawdź localStorage
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const dismissedTime = new Date(dismissed).getTime();
            if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
                setIsDismissed(true);
                return;
            }
        }

        // Pokaż po 30 sekundach
        if (isInstallable && !isInstalled && !isDismissed) {
            const timer = setTimeout(() => setIsVisible(true), 30000);
            return () => clearTimeout(timer);
        }
    }, [isInstallable, isInstalled, isDismissed]);

    const handleInstall = async () => {
        const success = await installApp();
        if (success) setIsVisible(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        setIsDismissed(true);
        localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    };

    if (isInstalled || isDismissed) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={handleDismiss}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-4 left-4 right-4 md:bottom-8 md:left-auto md:right-8 md:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Gradient line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-blue-500" />

                        {/* Close */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
                                    <Smartphone className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Zainstaluj Postlio</h3>
                                    <p className="text-sm text-slate-400">Szybszy dostęp</p>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <span>Błyskawiczny dostęp z ekranu głównego</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-300">
                                    <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
                                        <Bell className="w-4 h-4 text-violet-400" />
                                    </div>
                                    <span>Powiadomienia o zaplanowanych postach</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleInstall}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Zainstaluj
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={handleDismiss}
                                    className="text-slate-400 hover:text-white"
                                >
                                    Nie teraz
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}