'use client';

import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
    StatsCards,
    QuickActions,
    RecentPosts,
    PlatformStats,
    AIActivity,
} from '@/components/dashboard';

export default function DashboardPage() {
    const { user } = useAuth();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Dzień dobry';
        if (hour < 18) return 'Cześć';
        return 'Dobry wieczór';
    };

    const firstName = user?.full_name?.split(' ')[0] || 'Użytkowniku';

    return (
        <div className="space-y-4 xs:space-y-6 sm:space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold">
                    {getGreeting()}, {firstName}! 👋
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                    Oto podsumowanie Twojej aktywności w social media
                </p>
            </motion.div>

            <StatsCards />

            <QuickActions />

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    <div className="rounded-xl sm:rounded-2xl border bg-card p-4 sm:p-6">
                        <RecentPosts />
                    </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                    <div className="rounded-xl sm:rounded-2xl border bg-card p-4 sm:p-6">
                        <PlatformStats />
                    </div>

                    <div className="rounded-xl sm:rounded-2xl border bg-card p-4 sm:p-6">
                        <AIActivity />
                    </div>
                </div>
            </div>
        </div>
    );
}