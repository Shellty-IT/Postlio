// src/app/(auth)/onboarding/page.tsx
'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';

import { useAuthStore } from '@/store/auth-store';
import { useOAuthCallbackHandler } from '@/hooks';
import { OnboardingWelcome } from '@/components/onboarding/onboarding-welcome';
import { OnboardingConnect } from '@/components/onboarding/onboarding-connect';
import { OnboardingSuccess } from '@/components/onboarding/onboarding-success';

function OnboardingContent() {
    const router = useRouter();
    const {
        user,
        isAuthenticated,
        isInitialized,
        onboardingStep,
    } = useAuthStore();

    // Obsłuż OAuth callback
    const { isProcessing, hasOAuthParams } = useOAuthCallbackHandler({
        onSuccess: () => {
            // Hook automatycznie ustawia onboardingStep na 'success' jeśli context === 'onboarding'
        },
        onError: (error) => {
            console.error('OAuth error:', error);
            // Wróć do connect jeśli błąd
            useAuthStore.getState().setOnboardingStep('connect');
        },
    });

    // Przekieruj niezalogowanych do logowania
    useEffect(() => {
        if (isInitialized && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isInitialized, router]);

    // Przekieruj jeśli onboarding ukończony
    useEffect(() => {
        if (isInitialized && isAuthenticated && user && !user.needs_onboarding && !hasOAuthParams) {
            router.push('/dashboard');
        }
    }, [isInitialized, isAuthenticated, user, hasOAuthParams, router]);

    // Loading
    if (!isInitialized || isProcessing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">
                        {isProcessing ? 'Łączenie konta...' : 'Ładowanie...'}
                    </p>
                </div>
            </div>
        );
    }

    // Nie pokazuj jeśli niezalogowany
    if (!isAuthenticated || !user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-violet-500/5">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                <AnimatePresence mode="wait">
                    {onboardingStep === 'welcome' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <OnboardingWelcome userName={user.full_name} />
                        </motion.div>
                    )}

                    {onboardingStep === 'connect' && (
                        <motion.div
                            key="connect"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <OnboardingConnect />
                        </motion.div>
                    )}

                    {onboardingStep === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <OnboardingSuccess />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Sparkles className="h-8 w-8 animate-pulse text-primary" />
            </div>
        }>
            <OnboardingContent />
        </Suspense>
    );
}