// postlio_frontend/src/app/offline/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/common/app-logo';
import Link from 'next/link';

export default function OfflinePage() {
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Automatyczne przekierowanie gdy online
    useEffect(() => {
        if (isOnline) {
            const timer = setTimeout(() => {
                window.location.href = '/';
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isOnline]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 text-center max-w-md mx-auto"
            >
                {/* Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="mb-8"
                >
                    <div className="relative inline-flex">
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
                        <div className="relative w-24 h-24 bg-slate-800/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-slate-700">
                            {isOnline ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                >
                                    <RefreshCw className="w-10 h-10 text-green-400" />
                                </motion.div>
                            ) : (
                                <WifiOff className="w-10 h-10 text-slate-400" />
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Content */}
                {isOnline ? (
                    <div className="space-y-4">
                        <h1 className="text-2xl font-bold text-white">
                            Połączenie przywrócone!
                        </h1>
                        <p className="text-slate-400">Przekierowuję do aplikacji...</p>
                    </div>
                ) : (
                    <>
                        <h1 className="text-3xl font-bold text-white mb-4">
                            Brak połączenia
                        </h1>
                        <p className="text-slate-400 mb-8">
                            Sprawdź swoje połączenie z internetem i spróbuj ponownie.
                        </p>

                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 mb-8 border border-slate-700">
                            <p className="text-sm text-slate-400">
                                Funkcje AI i synchronizacja postów wymagają połączenia z internetem.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                onClick={() => window.location.reload()}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Spróbuj ponownie
                            </Button>

                            <Button variant="outline" className="border-slate-700" asChild>
                                <Link href="/">
                                    <Home className="w-4 h-4 mr-2" />
                                    Strona główna
                                </Link>
                            </Button>
                        </div>
                    </>
                )}

                {/* Branding */}
                <div className="mt-12 flex items-center justify-center gap-2 text-slate-500">
                    <AppLogo className="h-6 w-6" />
                    <span className="font-semibold">Postlio</span>
                </div>
            </motion.div>
        </div>
    );
}
