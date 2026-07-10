'use client';

import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { usePostsStats } from '@/hooks/usePosts';
import { useConnectedAccounts } from '@/hooks/useSocial';
import { useAutopilotConfigs } from '@/hooks/useAutopilot';
import { useBrands } from '@/hooks/useBrands';
import {
    TodayHero,
    OnboardingChecklist,
    PipelineStats,
    UpcomingPublications,
    RecentDrafts,
    AIAssistantCard,
    ConnectedAccountsCard,
    AutopilotStatusCard,
} from '@/components/dashboard';

export default function DashboardPage() {
    const { user } = useAuth();
    const { data: stats } = usePostsStats();
    const { data: accountsData } = useConnectedAccounts();
    const { data: autopilotConfigs } = useAutopilotConfigs();
    const { data: brandsData } = useBrands();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Dzień dobry';
        if (hour < 18) return 'Cześć';
        return 'Dobry wieczór';
    };

    const firstName = user?.full_name?.split(' ')[0] || 'Użytkowniku';
    const drafts = stats?.by_status?.draft ?? 0;
    const scheduled = stats?.by_status?.scheduled ?? 0;
    const published = stats?.by_status?.published ?? 0;

    const connectedAccounts = accountsData?.accounts || [];
    const brands = brandsData?.brands || [];
    const hasActiveAutopilot = (autopilotConfigs || []).some((config) => config.is_active);

    const dateLabel = new Date().toLocaleDateString('pl-PL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
    const capitalizedDate = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

    const onboardingSteps = [
        { label: 'Konto utworzone', done: true },
        { label: 'Połącz konta social media', done: connectedAccounts.length > 0 },
        { label: 'Zdefiniuj markę (Voice DNA)', done: brands.length > 0 },
        { label: 'Włącz Autopilota', done: hasActiveAutopilot },
    ];

    return (
        <div className="space-y-6 sm:space-y-7">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
            >
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-[30px]">
                        {getGreeting()}, {firstName}
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground sm:text-[15px]">
                        {capitalizedDate}
                        {drafts > 0 && (
                            <>
                                {' '}
                                · masz{' '}
                                <span className="font-medium text-foreground/80">
                                    {drafts} {drafts === 1 ? 'szkic' : 'szkice'}
                                </span>{' '}
                                do dokończenia
                            </>
                        )}
                        . Zacznij od jednej rzeczy.
                    </p>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-2.5">
                    <span
                        className={
                            hasActiveAutopilot
                                ? 'h-2 w-2 rounded-full bg-success status-dot-pulse text-success'
                                : 'h-2 w-2 rounded-full bg-muted-foreground/50'
                        }
                    />
                    <span className="text-[13px] text-muted-foreground">Autopilot</span>
                    <span className="text-[13px] font-semibold text-foreground/90">
                        {hasActiveAutopilot ? 'Aktywny' : 'Offline'}
                    </span>
                </div>
            </motion.div>

            <div className="flex flex-col gap-3">
                <div className="mono-label">Co dziś zrobić?</div>
                <div className="grid gap-4 lg:grid-cols-[1.85fr_1fr]">
                    <TodayHero draftsCount={drafts} />
                    <OnboardingChecklist steps={onboardingSteps} />
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <div className="mono-label">Pipeline treści</div>
                <PipelineStats drafts={drafts} scheduled={scheduled} published={published} />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.85fr_1fr]">
                <div className="flex flex-col gap-5">
                    <UpcomingPublications />
                    <RecentDrafts />
                </div>

                <div className="flex flex-col gap-5">
                    <AIAssistantCard steps={onboardingSteps} />
                    <ConnectedAccountsCard accounts={connectedAccounts} />
                    <AutopilotStatusCard isActive={hasActiveAutopilot} />
                </div>
            </div>
        </div>
    );
}
