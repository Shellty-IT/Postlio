// postlio_frontend/src/hooks/usePWA.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
    isInstallable: boolean;
    isInstalled: boolean;
    isOnline: boolean;
    isUpdateAvailable: boolean;
}

// Rozszerzenie Navigator dla iOS Safari
interface NavigatorStandalone extends Navigator {
    standalone?: boolean;
}

export function usePWA() {
    const [state, setState] = useState<PWAState>({
        isInstallable: false,
        isInstalled: false,
        isOnline: true,
        isUpdateAvailable: false,
    });

    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    // Sprawdź czy zainstalowana
    useEffect(() => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isIOSInstalled = (navigator as NavigatorStandalone).standalone === true;

        setState(prev => ({
            ...prev,
            isInstalled: isStandalone || isIOSInstalled,
            isOnline: navigator.onLine
        }));
    }, []);

    // Status online/offline
    useEffect(() => {
        const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
        const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Install prompt
    useEffect(() => {
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setState(prev => ({ ...prev, isInstallable: true }));
        };

        const handleAppInstalled = () => {
            setDeferredPrompt(null);
            setState(prev => ({ ...prev, isInstallable: false, isInstalled: true }));
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    // Service Worker registration
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('[PWA] SW registered');

                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker?.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                setState(prev => ({ ...prev, isUpdateAvailable: true }));
                            }
                        });
                    });
                })
                .catch((error) => console.error('[PWA] SW failed:', error));
        }
    }, []);

    const installApp = useCallback(async (): Promise<boolean> => {
        if (!deferredPrompt) return false;

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            setDeferredPrompt(null);
            setState(prev => ({ ...prev, isInstallable: false }));
            return outcome === 'accepted';
        } catch {
            return false;
        }
    }, [deferredPrompt]);

    const updateApp = useCallback(async () => {
        const registration = await navigator.serviceWorker?.ready;
        registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
    }, []);

    return { ...state, installApp, updateApp };
}