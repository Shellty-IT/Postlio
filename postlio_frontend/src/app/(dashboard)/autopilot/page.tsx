// src/app/(dashboard)/autopilot/page.tsx
'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ListTodo, BarChart3, Settings } from 'lucide-react';
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
import type { BackendAutopilotConfigCreate, BackendAutopilotConfigUpdate } from '@/types/autopilot';

export default function AutopilotPage() {
    // Auth Store - sprawdź uprawnienia
    const { capabilities } = useAuthStore();
    const accessLevel = capabilities.access_level;
    const canUseAutopilot = capabilities.can_use_autopilot;

    // UI Store
    const {
        selectedConfigId,
        activeTab,
        isCreateModalOpen,
        queueFilter,
        selectConfig,
        setActiveTab,
        setCreateModalOpen,
    } = useAutopilotStore();

    // React Query - Configs (tylko jeśli ma dostęp)
    const { data: configs = [], isLoading: isLoadingConfigs } = useAutopilotConfigs();
    const { data: selectedConfig } = useAutopilotConfig(selectedConfigId);

    // React Query - Queue & Stats
    const { data: queueItems = [] } = useAutopilotQueue(
        selectedConfigId,
        { status: queueFilter === 'all' ? undefined : queueFilter }
    );
    const { data: queueStats } = useQueueStats(selectedConfigId);

    // React Query - Brands
    const brandsQuery = useBrands();
    const brands = brandsQuery.data?.brands || [];

    // Mutations
    const toggleAutopilot = useToggleAutopilot();
    const pauseAutopilot = usePauseAutopilot();
    const createConfig = useCreateAutopilotConfig();
    const updateConfig = useUpdateAutopilotConfig();
    const deleteConfig = useDeleteAutopilotConfig();
    const generatePosts = useGeneratePosts();

    // Auto-select first config if none selected
    useEffect(() => {
        if (canUseAutopilot && !selectedConfigId && configs.length > 0) {
            selectConfig(configs[0].id);
        }
    }, [configs, selectedConfigId, selectConfig, canUseAutopilot]);

    // Computed
    const isRunning = selectedConfig ? (selectedConfig.is_active && !selectedConfig.is_paused) : false;
    const isGenerating = generatePosts.isPending;
    const pendingCount = queueStats?.pending_count || 0;

    // Handlers
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

    // ============================================================
    // BLOKADA - Brak konta firmowego
    // ============================================================
    if (!canUseAutopilot) {
        return (
            <div className="p-6">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-3xl font-bold">Autopilot AI</h1>
                    <p className="text-muted-foreground mt-1">
                        Automatyczne generowanie i publikacja postów z pomocą AI
                    </p>
                </motion.div>

                <FeatureLocked
                    feature="autopilot"
                    accessLevel={accessLevel}
                />
            </div>
        );
    }

    // Loading state
    if (isLoadingConfigs) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Ładowanie konfiguracji...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
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

            {/* Main Content */}
            <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as typeof activeTab)}
                className="space-y-6"
            >
                <TabsList className="bg-card border border-border">
                    <TabsTrigger
                        value="queue"
                        className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        <ListTodo className="w-4 h-4" />
                        Kolejka
                        {pendingCount > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/20">
                                {pendingCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="stats"
                        className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        <BarChart3 className="w-4 h-4" />
                        Statystyki
                    </TabsTrigger>
                    <TabsTrigger
                        value="config"
                        className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        <Settings className="w-4 h-4" />
                        Konfiguracja
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="queue" className="mt-0">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <AutopilotQueue
                            configId={selectedConfigId}
                            queueItems={queueItems}
                        />
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

            {/* Create Config Modal */}
            <CreateConfigModal
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSubmit={handleCreateConfig}
                brands={brands}
            />
        </div>
    );
}