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
        <div className="space-y-4 sm:space-y-6">
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

            <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as typeof activeTab)}
                className="space-y-4 sm:space-y-6"
            >
                <TabsList className="bg-card border border-border w-full xs:w-auto grid grid-cols-3 xs:inline-flex">
                    <TabsTrigger
                        value="queue"
                        className="gap-1.5 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        <ListTodo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Kolejka</span>
                        {pendingCount > 0 && (
                            <span className="ml-0.5 sm:ml-1 px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full bg-primary/20">
                                {pendingCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger
                        value="stats"
                        className="gap-1.5 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Statystyki</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="config"
                        className="gap-1.5 sm:gap-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                        <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Konfiguracja</span>
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

            <CreateConfigModal
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSubmit={handleCreateConfig}
                brands={brands}
            />
        </div>
    );
}