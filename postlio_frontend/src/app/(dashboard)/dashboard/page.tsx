// src/app/(dashboard)/dashboard/page.tsx
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

    // Powitanie zależne od pory dnia
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Dzień dobry';
        if (hour < 18) return 'Cześć';
        return 'Dobry wieczór';
    };

    const firstName = user?.full_name?.split(' ')[0] || 'Użytkowniku';

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h1 className="text-2xl sm:text-3xl font-bold">
                    {getGreeting()}, {firstName}! 👋
                </h1>
                <p className="text-muted-foreground mt-1">
                    Oto podsumowanie Twojej aktywności w social media
                </p>
            </motion.div>

            {/* Stats Cards */}
            <StatsCards />

            {/* Quick Actions */}
            <QuickActions />

            {/* Main Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Recent Posts (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-2xl border bg-card p-6">
                        <RecentPosts />
                    </div>
                </div>

                {/* Right Column - Sidebar (1/3 width) */}
                <div className="space-y-6">
                    {/* Platform Stats */}
                    <div className="rounded-2xl border bg-card p-6">
                        <PlatformStats />
                    </div>

                    {/* AI Activity */}
                    <div className="rounded-2xl border bg-card p-6">
                        <AIActivity />
                    </div>
                </div>
            </div>
        </div>
    );
}