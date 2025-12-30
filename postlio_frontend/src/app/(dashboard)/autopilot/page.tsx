// src/app/(dashboard)/autopilot/page.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ListTodo,
    BarChart3,
    Settings,
} from 'lucide-react';
import {
    AutopilotHeader,
    AutopilotQueue,
    AutopilotStats,
    ConfigPanel,
    CreateConfigModal,
} from '@/components/autopilot';
import { useAutopilotStore } from '@/store/autopilot-store';
import { useBrandsStore } from '@/store/brands-store';
import type { AutopilotConfig } from '@/types/autopilot';

export default function AutopilotPage() {
    const [activeTab, setActiveTab] = useState('queue');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const {
        configs,
        selectedConfigId,
        isGenerating,
        selectConfig,
        createConfig,
        updateConfig,
        deleteConfig,
        toggleConfigStatus,
        getConfigById,
        triggerGeneration,
        getPendingCount,
    } = useAutopilotStore();

    const { brands } = useBrandsStore();

    // Get selected config
    const selectedConfig = selectedConfigId ? getConfigById(selectedConfigId) : undefined;

    // Check if autopilot is running (config is active)
    const isRunning = selectedConfig?.status === 'active';

    // Get pending count
    const pendingCount = getPendingCount();

    // Handle create new config
    const handleCreateConfig = (configData: Omit<AutopilotConfig, 'id' | 'createdAt' | 'updatedAt' | 'totalGenerated' | 'totalPublished'>) => {
        createConfig(configData);
        setIsCreateModalOpen(false);
    };

    // Handle toggle autopilot
    const handleToggleAutopilot = () => {
        if (selectedConfigId) {
            toggleConfigStatus(selectedConfigId);
        }
    };

    // Handle generate now
    const handleGenerateNow = async () => {
        if (selectedConfigId) {
            await triggerGeneration(selectedConfigId);
        }
    };

    // Handle config selection for header
    const handleSelectConfigFromHeader = (config: AutopilotConfig) => {
        selectConfig(config.id);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <AutopilotHeader
                selectedConfig={selectedConfig}
                configs={configs}
                isRunning={isRunning}
                onSelectConfig={handleSelectConfigFromHeader}
                onToggleAutopilot={handleToggleAutopilot}
                onGenerateNow={handleGenerateNow}
                onCreateNew={() => setIsCreateModalOpen(true)}
                isGenerating={isGenerating}
            />

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-card border border-border">
                    <TabsTrigger value="queue" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <ListTodo className="w-4 h-4" />
                        Kolejka
                        {pendingCount > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/20">
                {pendingCount}
              </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <BarChart3 className="w-4 h-4" />
                        Statystyki
                    </TabsTrigger>
                    <TabsTrigger value="config" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Settings className="w-4 h-4" />
                        Konfiguracja
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="queue" className="mt-0">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <AutopilotQueue />
                    </motion.div>
                </TabsContent>

                <TabsContent value="stats" className="mt-0">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <AutopilotStats />
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
                            onSelectConfig={selectConfig}
                            onUpdateConfig={(id, updates) => updateConfig(id, updates)}
                            onDeleteConfig={deleteConfig}
                            onCreateNew={() => setIsCreateModalOpen(true)}
                        />
                    </motion.div>
                </TabsContent>
            </Tabs>

            {/* Create Config Modal */}
            <CreateConfigModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateConfig}
                brands={brands}
            />
        </div>
    );
}