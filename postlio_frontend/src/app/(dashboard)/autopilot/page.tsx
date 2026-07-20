// src/app/(dashboard)/autopilot/page.tsx
'use client';

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
    Loader2,
    ListTodo,
    BarChart3,
    Settings,
    Zap,
    Rocket,
    CheckCircle2,
    Sparkles,
    Lightbulb,
    FileEdit,
    CalendarClock,
    Send,
    ArrowRight,
    Clock,
} from 'lucide-react';
import {
    AutopilotHeader,
    AutopilotQueue,
    AutopilotStats,
    ConfigPanel,
    CreateConfigModal,
} from '@/components/autopilot';
import { FeatureLocked } from '@/components/common';
import { useAutopilotStore } from '@/store/autopilot-store';
import { useAuthStore } from '@/store/auth-store';
import { useBrands } from '@/hooks/useBrands';
import {
    useAutopilotConfigs,
    useAutopilotConfig,
    useToggleAutopilot,
    usePauseAutopilot,
    useCreateAutopilotConfig,
    useUpdateAutopilotConfig,
    useDeleteAutopilotConfig,
    useAutopilotQueue,
    useQueueStats,
    useGeneratePosts,
} from '@/hooks/useAutopilot';
import { useConnectedAccounts } from '@/hooks/useSocial';
import type { BackendAutopilotConfigCreate, BackendAutopilotConfigUpdate } from '@/types/autopilot';

export default function AutopilotPage() {
    const { capabilities } = useAuthStore();
    const accessLevel = capabilities.access_level;
    const canUseAutopilot = capabilities.can_use_autopilot;

    const {
        selectedConfigId,
        activeTab,
        isCreateModalOpen,
        queueFilter,
        selectConfig,
        setActiveTab,
        setCreateModalOpen,
    } = useAutopilotStore();

    const { data: configs = [], isLoading: isLoadingConfigs } = useAutopilotConfigs();
    const { data: selectedConfig } = useAutopilotConfig(selectedConfigId);

    const { data: queueItems = [] } = useAutopilotQueue(
        selectedConfigId,
        { status: queueFilter === 'all' ? undefined : queueFilter }
    );
    const { data: queueStats } = useQueueStats(selectedConfigId);

    const brandsQuery = useBrands();
    const brands = brandsQuery.data?.brands || [];

    const toggleAutopilot = useToggleAutopilot();
    const pauseAutopilot = usePauseAutopilot();
    const createConfig = useCreateAutopilotConfig();
    const updateConfig = useUpdateAutopilotConfig();
    const deleteConfig = useDeleteAutopilotConfig();
    const generatePosts = useGeneratePosts();

    useEffect(() => {
        if (canUseAutopilot && !selectedConfigId && configs.length > 0) {
            selectConfig(configs[0].id);
        }
    }, [configs, selectedConfigId, selectConfig, canUseAutopilot]);

    const isRunning = selectedConfig ? (selectedConfig.is_active && !selectedConfig.is_paused) : false;
    const isGenerating = generatePosts.isPending;
    const pendingCount = queueStats?.pending_count || 0;

    const hasPlatforms = !!selectedConfig?.platforms?.length;
    const hasBrand = !!selectedConfig?.brand_id;
    const hasSchedule = !!selectedConfig?.posts_per_week;
    const isConfirmed = !!selectedConfig?.is_active;
    const setupStepsDone = [hasPlatforms, hasSchedule, hasBrand, isConfirmed].filter(Boolean).length;

    const workMode: 'offline' | 'review' | 'full' = !selectedConfig
        ? 'offline'
        : selectedConfig.is_active && selectedConfig.auto_publish_on_approve
            ? 'full'
            : selectedConfig.is_active
                ? 'review'
                : 'offline';

    const { data: accountsData } = useConnectedAccounts();
    const connectedAccounts = accountsData?.accounts ?? [];

    // "Pełny Autopilot" (publikacja bez zatwierdzenia) wymaga, żeby KAŻDA
    // platforma configu miała podłączone konto zdolne do auto-publikacji.
    // LinkedIn jest zablokowany zawsze — automatyczna publikacja bez udziału
    // człowieka narusza §3.1(26) LinkedIn API Terms of Use (zbadane wcześniej
    // w tej sesji). Reużywa is_business_account/supports_auto_publish z
    // /social/accounts (Etap 1) - zero nowej logiki klasyfikacji kont.
    const fullAutopilotBlockedReason = useMemo(() => {
        if (!selectedConfig || !hasPlatforms) {
            return 'Wybierz najpierw platformy publikacji.';
        }
        if (selectedConfig.platforms.includes('linkedin')) {
            return 'LinkedIn wymaga zatwierdzenia każdego posta przez człowieka (regulamin LinkedIn API) — dostępny tylko tryb "Do akceptacji".';
        }
        const platformWithoutAutoAccount = selectedConfig.platforms.find((platform) => {
            const accountId = selectedConfig.social_account_mapping?.[platform];
            const account = connectedAccounts.find((a) => a.id === accountId);
            return !account?.supports_auto_publish;
        });
        if (platformWithoutAutoAccount) {
            return `Konto podłączone dla platformy "${platformWithoutAutoAccount}" nie wspiera automatycznej publikacji (wymaga Strony/konta firmowego).`;
        }
        return null;
    }, [selectedConfig, hasPlatforms, connectedAccounts]);

    const canUseFullAutopilot = fullAutopilotBlockedReason === null;

    const handleSelectWorkMode = (mode: 'offline' | 'review' | 'full') => {
        if (!selectedConfigId) {
            setCreateModalOpen(true);
            return;
        }
        if (mode === 'full' && !canUseFullAutopilot) return;

        const updates =
            mode === 'offline'
                ? { is_active: false }
                : mode === 'review'
                    ? { is_active: true, auto_publish_on_approve: false }
                    : { is_active: true, auto_publish_on_approve: true };

        updateConfig.mutate({ configId: selectedConfigId, data: updates });
    };

    const nextAiAction = !selectedConfig
        ? 'Czekam, aż wybierzesz platformy i markę.'
        : !hasPlatforms
            ? 'Czekam na wybór platform publikacji.'
            : !isRunning
                ? 'Gotowy do uruchomienia — wznów Autopilota, gdy zechcesz.'
                : pendingCount > 0
                    ? `Przygotowałem ${pendingCount} ${pendingCount === 1 ? 'post' : 'posty'} do akceptacji.`
                    : 'Monitoruję harmonogram i przygotowuję kolejne treści.';

    const timelineStages = [
        { label: 'Pomysł', icon: Lightbulb, count: 0 },
        { label: 'Szkic', icon: FileEdit, count: queueStats?.pending_count ?? 0 },
        { label: 'Akceptacja', icon: CheckCircle2, count: queueStats?.approved_count ?? 0 },
        { label: 'Harmonogram', icon: CalendarClock, count: queueStats?.scheduled_count ?? 0 },
        { label: 'Publikacja', icon: Send, count: (queueStats?.published_today ?? 0) + (queueStats?.published_this_week ?? 0) },
    ];

    const handleToggleAutopilot = () => {
        if (!selectedConfigId || !selectedConfig) return;

        if (selectedConfig.is_active) {
            if (selectedConfig.is_paused) {
                pauseAutopilot.mutate({ configId: selectedConfigId, paused: false });
            } else {
                pauseAutopilot.mutate({ configId: selectedConfigId, paused: true });
            }
        } else {
            toggleAutopilot.mutate({ configId: selectedConfigId, active: true });
        }
    };

    const handleGenerateNow = () => {
        if (!selectedConfigId) return;

        generatePosts.mutate({
            configId: selectedConfigId,
            request: {
                count: 1,
            },
        });
    };

    const handleCreateConfig = (data: BackendAutopilotConfigCreate) => {
        createConfig.mutate(data, {
            onSuccess: (newConfig) => {
                selectConfig(newConfig.id);
                setCreateModalOpen(false);
            },
        });
    };

    const handleUpdateConfig = (configId: number, updates: BackendAutopilotConfigUpdate) => {
        updateConfig.mutate({ configId, data: updates });
    };

    const handleDeleteConfig = (configId: number) => {
        deleteConfig.mutate(configId, {
            onSuccess: () => {
                if (selectedConfigId === configId) {
                    selectConfig(null);
                }
            },
        });
    };

    const handleSelectConfig = (configId: number) => {
        selectConfig(configId);
    };

    if (!canUseAutopilot) {
        return (
            <div className="p-4 sm:p-6">
                <FeatureLocked
                    feature="autopilot"
                    accessLevel={accessLevel}
                />
            </div>
        );
    }

    if (isLoadingConfigs) {
        return (
            <div className="flex items-center justify-center h-[50vh] sm:h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-3 sm:mb-4 text-primary" />
                    <p className="text-sm text-muted-foreground">Ładowanie konfiguracji...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Autopilot</h1>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-warning/15 text-warning tracking-wide">
                            PRO
                        </span>
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-[15px] mt-2 max-w-xl">
                        Twoje centrum dowodzenia automatyczną publikacją. Skonfiguruj go raz — resztą zajmie się AI.
                    </p>
                </div>
                <div className="inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/[0.025] border border-white/[0.07] self-start sm:self-auto">
                    <span
                        className={cn(
                            'w-2 h-2 rounded-full',
                            isRunning ? 'bg-success animate-pulse' : 'bg-muted-foreground/60'
                        )}
                    />
                    <span className="text-sm text-muted-foreground">Tryb</span>
                    <span className="text-sm font-semibold text-foreground/90">
                        {isRunning ? 'Active' : 'Offline'}
                    </span>
                </div>
            </div>

            <AutopilotHeader
                selectedConfig={selectedConfig}
                configs={configs}
                isRunning={isRunning}
                isGenerating={isGenerating}
                onSelectConfig={(config) => selectConfig(config.id)}
                onToggleAutopilot={handleToggleAutopilot}
                onGenerateNow={handleGenerateNow}
                onCreateNew={() => setCreateModalOpen(true)}
            />

            <div className="flex flex-col gap-3">
                <div className="mono-label">TRYB PRACY</div>
                <div className="grid grid-cols-1 lg:grid-cols-[1.85fr_1fr] gap-4">
                    <div className="hero-card p-6 sm:p-7 flex flex-col gap-4">
                        <div className="relative z-10 flex flex-col gap-3.5">
                            <div className="inline-flex items-center gap-2 self-start px-2.5 py-1 rounded-lg bg-accent/[0.14] border border-accent/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                <span className="text-xs font-semibold text-accent">Rekomendacja AI</span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight leading-tight">
                                Wybierz, jak ma pracować Autopilot
                            </h2>
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                                Zacznij od trybu &bdquo;Do akceptacji&rdquo; — AI przygotuje treści, a Ty zatwierdzasz każdą przed publikacją.
                                W każdej chwili możesz przejść na pełną automatyzację.
                            </p>
                        </div>

                        <div className="relative z-10 grid grid-cols-1 xs:grid-cols-3 gap-3">
                            <button
                                type="button"
                                onClick={() => handleSelectWorkMode('offline')}
                                className={cn(
                                    'rounded-2xl p-4 border flex flex-col gap-2.5 text-left cursor-pointer transition-colors',
                                    workMode === 'offline'
                                        ? 'border-white/10 bg-white/[0.035]'
                                        : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05]'
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="w-8 h-8 rounded-[10px] bg-white/[0.06] flex items-center justify-center text-muted-foreground">
                                        <Zap className="w-4 h-4" />
                                    </span>
                                    {workMode === 'offline' && (
                                        <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md bg-white/[0.08] text-foreground/80 tracking-wide">
                                            OBECNY
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm font-semibold text-foreground/90">Offline</div>
                                <div className="text-xs text-muted-foreground leading-relaxed">
                                    Bez automatyzacji — publikujesz ręcznie z Kreatora.
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSelectWorkMode('review')}
                                className={cn(
                                    'rounded-2xl p-4 border flex flex-col gap-2.5 text-left cursor-pointer transition-colors',
                                    workMode === 'review'
                                        ? 'border-primary/40 bg-primary/[0.1]'
                                        : 'border-primary/30 bg-primary/[0.08] hover:bg-primary/[0.13]'
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="w-8 h-8 rounded-[10px] bg-primary/[0.16] flex items-center justify-center text-primary/80">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </span>
                                    <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md bg-gradient-to-br from-primary/30 to-accent/30 text-foreground/90 tracking-wide">
                                        {workMode === 'review' ? 'OBECNY' : 'SUGEROWANY'}
                                    </span>
                                </div>
                                <div className="text-sm font-semibold text-foreground">Do akceptacji</div>
                                <div className="text-xs text-muted-foreground leading-relaxed">
                                    AI tworzy treści, Ty zatwierdzasz przed publikacją.
                                </div>
                            </button>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectWorkMode('full')}
                                        disabled={!canUseFullAutopilot}
                                        className={cn(
                                            'rounded-2xl p-4 border flex flex-col gap-2.5 text-left transition-colors',
                                            !canUseFullAutopilot
                                                ? 'cursor-not-allowed opacity-50 border-white/[0.07] bg-white/[0.02]'
                                                : 'cursor-pointer',
                                            canUseFullAutopilot && workMode === 'full'
                                                ? 'border-white/10 bg-white/[0.06]'
                                                : canUseFullAutopilot
                                                    ? 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.06]'
                                                    : ''
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="w-8 h-8 rounded-[10px] bg-warning/[0.14] flex items-center justify-center text-warning">
                                                <Rocket className="w-4 h-4" />
                                            </span>
                                            {workMode === 'full' && (
                                                <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md bg-white/[0.08] text-foreground/80 tracking-wide">
                                                    OBECNY
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm font-semibold text-foreground/90">Pełny Autopilot</div>
                                        <div className="text-xs text-muted-foreground leading-relaxed">
                                            AI tworzy i publikuje samodzielnie wg harmonogramu.
                                        </div>
                                    </button>
                                </TooltipTrigger>
                                {!canUseFullAutopilot && fullAutopilotBlockedReason && (
                                    <TooltipContent className="max-w-xs">{fullAutopilotBlockedReason}</TooltipContent>
                                )}
                            </Tooltip>
                        </div>

                        <div className="relative z-10 flex flex-wrap items-center gap-3 mt-0.5">
                            <button
                                onClick={selectedConfig ? handleToggleAutopilot : () => setCreateModalOpen(true)}
                                className="btn-gradient px-6 py-3 text-[14.5px]"
                            >
                                <Rocket className="w-4 h-4" />
                                {selectedConfig ? (isRunning ? 'Wstrzymaj Autopilota' : 'Uruchom Autopilota') : 'Rozpocznij konfigurację'}
                            </button>
                            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm font-medium text-foreground/80 hover:bg-white/[0.06] transition-colors">
                                Zobacz jak to działa
                            </button>
                        </div>
                    </div>

                    <div className="glass-card p-5 sm:p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="text-[15px] font-semibold">Konfiguracja</div>
                            <div className="font-mono text-xs text-muted-foreground">{setupStepsDone} / 4</div>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-primary to-accent shadow-glow-primary transition-all"
                                style={{ width: `${Math.max((setupStepsDone / 4) * 100, 4)}%` }}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            {[
                                { label: 'Wybierz platformy', done: hasPlatforms },
                                { label: 'Ustaw częstotliwość', done: hasSchedule },
                                { label: 'Wybierz markę (Voice DNA)', done: hasBrand },
                                { label: 'Zatwierdź tryb pracy', done: isConfirmed },
                            ].map((step) => (
                                <div
                                    key={step.label}
                                    className={cn(
                                        'flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-colors',
                                        step.done
                                            ? 'bg-primary/[0.08] border border-primary/[0.18] hover:bg-primary/[0.13]'
                                            : 'hover:bg-white/[0.035]'
                                    )}
                                    onClick={() => setActiveTab('config')}
                                >
                                    <span
                                        className={cn(
                                            'w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0',
                                            step.done ? 'border-primary/60 text-primary/80' : 'border-white/[0.14]'
                                        )}
                                    >
                                        {step.done && <CheckCircle2 className="w-3 h-3" />}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-[13.5px]',
                                            step.done ? 'text-foreground font-medium' : 'text-muted-foreground'
                                        )}
                                    >
                                        {step.label}
                                    </span>
                                    {step.done && <ArrowRight className="w-4 h-4 ml-auto text-primary/70" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <div className="mono-label">TWOJA KONFIGURACJA</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="glass-card p-[18px] flex flex-col gap-3">
                        <div className="flex items-center gap-2.5">
                            <span className="w-[30px] h-[30px] rounded-[9px] bg-primary/[0.12] flex items-center justify-center text-primary/80">
                                <ListTodo className="w-[15px] h-[15px]" />
                            </span>
                            <span className="text-[13px] font-medium text-foreground/90">Aktywne platformy</span>
                        </div>
                        <div className="text-[13px] text-muted-foreground/70">
                            {hasPlatforms ? selectedConfig!.platforms.join(', ') : 'Nie wybrano'}
                        </div>
                        <button
                            onClick={() => setActiveTab('config')}
                            className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/25 text-[12.5px] font-semibold text-primary/80 hover:bg-primary/10 transition-colors"
                        >
                            Wybierz platformy
                        </button>
                    </div>

                    <div className="glass-card p-[18px] flex flex-col gap-3">
                        <div className="flex items-center gap-2.5">
                            <span className="w-[30px] h-[30px] rounded-[9px] bg-success/[0.12] flex items-center justify-center text-success">
                                <Clock className="w-[15px] h-[15px]" />
                            </span>
                            <span className="text-[13px] font-medium text-foreground/90">Częstotliwość</span>
                        </div>
                        <div className="text-[13px] text-muted-foreground/70">
                            {hasSchedule
                                ? `${selectedConfig!.posts_per_week} postów / tydzień`
                                : 'Sugerowane: 3 posty / tydzień'}
                        </div>
                        <button
                            onClick={() => setActiveTab('config')}
                            className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/25 text-[12.5px] font-semibold text-primary/80 hover:bg-primary/10 transition-colors"
                        >
                            Ustaw częstotliwość
                        </button>
                    </div>

                    <div className="glass-card p-[18px] flex flex-col gap-3">
                        <div className="flex items-center gap-2.5">
                            <span className="w-[30px] h-[30px] rounded-[9px] bg-accent/[0.14] flex items-center justify-center text-accent/80">
                                <Sparkles className="w-[15px] h-[15px]" />
                            </span>
                            <span className="text-[13px] font-medium text-foreground/90">Marka · Voice DNA</span>
                        </div>
                        <div className="text-[13px] text-muted-foreground/70">
                            {hasBrand ? `Marka #${selectedConfig!.brand_id}` : 'Nie wybrano'}
                        </div>
                        <button
                            onClick={() => setCreateModalOpen(true)}
                            className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/25 text-[12.5px] font-semibold text-primary/80 hover:bg-primary/10 transition-colors"
                        >
                            Wybierz markę
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="mono-label">TIMELINE TREŚCI</div>
                    {!selectedConfig && (
                        <div className="text-xs text-muted-foreground/70">Zapełni się po uruchomieniu Autopilota</div>
                    )}
                </div>
                <div className="glass-card flex items-stretch p-2 overflow-x-auto">
                    {timelineStages.map((stage, index) => (
                        <div key={stage.label} className="flex items-stretch flex-1 min-w-[92px]">
                            <div className="flex-1 px-3.5 py-4 flex flex-col gap-2 rounded-2xl">
                                <span className="w-[26px] h-[26px] rounded-lg bg-white/[0.05] flex items-center justify-center text-muted-foreground">
                                    <stage.icon className="w-3.5 h-3.5" />
                                </span>
                                <div className="text-[12.5px] font-medium text-muted-foreground">{stage.label}</div>
                                <div className="text-[22px] font-semibold text-muted-foreground/70 tracking-tight">
                                    {stage.count}
                                </div>
                            </div>
                            {index < timelineStages.length - 1 && (
                                <div className="flex items-center px-0.5 text-muted-foreground/30">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as typeof activeTab)}
                className="space-y-4 sm:space-y-6"
            >
                <TabsList className="bg-white/[0.03] border border-white/[0.07] w-full xs:w-auto grid grid-cols-3 xs:inline-flex p-1 rounded-xl">
                    <TabsTrigger
                        value="queue"
                        className="gap-1.5 sm:gap-2 text-xs sm:text-sm rounded-lg data-[state=active]:pill-active data-[state=active]:shadow-none"
                    >
                        <ListTodo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Kolejka</span>
                        {pendingCount > 0 && (
                            <span className="ml-0.5 sm:ml-1 px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full bg-white/15">
                                {pendingCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="stats"
                        className="gap-1.5 sm:gap-2 text-xs sm:text-sm rounded-lg data-[state=active]:pill-active data-[state=active]:shadow-none"
                    >
                        <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Statystyki</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="config"
                        className="gap-1.5 sm:gap-2 text-xs sm:text-sm rounded-lg data-[state=active]:pill-active data-[state=active]:shadow-none"
                    >
                        <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Konfiguracja</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="queue" className="mt-0">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-[1.85fr_1fr] gap-4"
                    >
                        <div className="flex flex-col gap-3 min-w-0">
                            <div className="mono-label">KOLEJKA TREŚCI</div>
                            <AutopilotQueue
                                configId={selectedConfigId}
                                queueItems={queueItems}
                            />
                        </div>

                        <div className="flex flex-col gap-[18px]">
                            <div className="flex flex-col gap-3">
                                <div className="mono-label">ASYSTENT AI</div>
                                <div className="ai-card p-5 flex flex-col gap-3.5">
                                    <div className="relative z-10 flex items-center gap-3">
                                        <div className="w-11 h-11 flex-shrink-0 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow-primary">
                                            <Sparkles className="w-[22px] h-[22px] text-white" />
                                        </div>
                                        <div>
                                            <div className="text-[14.5px] font-semibold">Asystent AI</div>
                                            <div className="flex items-center gap-1.5 text-xs text-success mt-0.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                                {isRunning ? 'Aktywny i pracuje' : 'Gotowy do konfiguracji'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative z-10 text-[13px] text-muted-foreground/90 leading-relaxed">
                                        Skonfiguruję Autopilota za Ciebie — wybierz platformy i tryb pracy, a ja przygotuję harmonogram i pierwsze treści.
                                    </div>
                                    <div className="relative z-10 pt-2.5 border-t border-white/[0.08]">
                                        <div className="text-[10.5px] tracking-wide text-muted-foreground/80 uppercase">
                                            Następna akcja AI
                                        </div>
                                        <div className="text-[12.5px] text-foreground/90 mt-1">{nextAiAction}</div>
                                    </div>
                                    <div className="relative z-10 flex items-center justify-between pt-0.5">
                                        <div className="text-xs text-muted-foreground">
                                            Ukończono <span className="text-foreground/90 font-semibold">{setupStepsDone} z 4</span> kroków
                                        </div>
                                        <div className="flex gap-1">
                                            {[0, 1, 2, 3].map((i) => (
                                                <span
                                                    key={i}
                                                    className={cn(
                                                        'w-[22px] h-1 rounded-full',
                                                        i < setupStepsDone ? 'bg-gradient-to-r from-primary to-accent' : 'bg-white/10'
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="mono-label">AKTYWNOŚĆ</div>
                                <div className="glass-card p-5 flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="w-9 h-9 rounded-[10px] bg-white/[0.05] flex items-center justify-center text-muted-foreground">
                                            <Clock className="w-[17px] h-[17px]" />
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13px] font-medium text-foreground/90">Ostatnia publikacja</div>
                                            <div className="text-xs text-muted-foreground/70 mt-0.5">
                                                {selectedConfig?.last_published_at
                                                    ? new Date(selectedConfig.last_published_at).toLocaleString('pl-PL', {
                                                          day: 'numeric',
                                                          month: 'short',
                                                          hour: '2-digit',
                                                          minute: '2-digit',
                                                      })
                                                    : isRunning
                                                        ? 'Jeszcze nie było — czekam na harmonogram.'
                                                        : 'Jeszcze nie było — Autopilot jest offline.'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </TabsContent>

                <TabsContent value="stats" className="mt-0">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <AutopilotStats
                            configId={selectedConfigId}
                            config={selectedConfig}
                            stats={queueStats}
                        />
                    </motion.div>
                </TabsContent>

                <TabsContent value="config" className="mt-0">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <ConfigPanel
                            configs={configs}
                            selectedConfigId={selectedConfigId}
                            onSelectConfig={handleSelectConfig}
                            onUpdateConfig={handleUpdateConfig}
                            onDeleteConfig={handleDeleteConfig}
                            onCreateNew={() => setCreateModalOpen(true)}
                        />
                    </motion.div>
                </TabsContent>
            </Tabs>

            <CreateConfigModal
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSubmit={handleCreateConfig}
                brands={brands}
            />
        </div>
    );
}
