// src/app/(auth)/onboarding/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

import { useAuthStore } from '@/store/auth-store';
import { OnboardingWelcome } from '@/components/onboarding/onboarding-welcome';
import { OnboardingConnect } from '@/components/onboarding/onboarding-connect';
import { OnboardingSuccess } from '@/components/onboarding/onboarding-success';

export default function OnboardingPage() {
    const router = useRouter();
    const {
        user,
        isAuthenticated,
        isInitialized,
        onboardingStep,
    } = useAuthStore();

    // Przekieruj niezalogowanych
    useEffect(() => {
        if (isInitialized && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isInitialized, isAuthenticated, router]);

    // Przekieruj jeśli onboarding ukończony
    useEffect(() => {
        if (isInitialized && isAuthenticated && user && !user.needs_onboarding) {
            router.replace('/dashboard');
        }
    }, [isInitialized, isAuthenticated, user, router]);

    // Loading
    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Sparkles className="h-8 w-8 animate-pulse text-primary" />
            </div>
        );
    }

    // Niezalogowany - pokaż loading (przekierowanie w toku)
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Sparkles className="h-8 w-8 animate-pulse text-primary" />
            </div>
        );
    }

    // Brak usera - pokaż loading
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Sparkles className="h-8 w-8 animate-pulse text-primary" />
            </div>
        );
    }

    // User nie potrzebuje onboardingu - pokaż loading (przekierowanie w toku)
    if (!user.needs_onboarding) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Sparkles className="h-8 w-8 animate-pulse text-primary" />
            </div>
        );
    }

    // RENDERUJ ONBOARDING
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