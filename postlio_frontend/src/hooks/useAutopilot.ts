// src/hooks/useAutopilot.ts
/**
 * React Query hooks dla Autopilota
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getConfigs,
    getConfig,
    getConfigByBrand,
    createConfig,
    updateConfig,
    deleteConfig,
    activateConfig,
    deactivateConfig,
    pauseConfig,
    resumeConfig,
    getConfigSocialStatus,
    generatePosts,
    getQueueItems,
    getQueueStats,
    getQueueItem,
    updateQueueItem,
    approveQueueItem,
    rejectQueueItem,
    deleteQueueItem,
    bulkQueueAction,
    publishQueueItem,
    publishReadyItems,
    retryFailedItems,
    getDashboard,
} from '@/lib/api/autopilot';
import type {
    BackendAutopilotConfigCreate,
    BackendAutopilotConfigUpdate,
    BackendQueueItemUpdate,
    BackendBulkActionRequest,
    BackendQueueStatus,
    GenerateQueueRequest,
    PublishRequest,
} from '@/types/autopilot';

// === Query Keys ===

export const autopilotKeys = {
    all: ['autopilot'] as const,
    configs: () => [...autopilotKeys.all, 'configs'] as const,
    config: (id: number) => [...autopilotKeys.configs(), id] as const,
    configByBrand: (brandId: number) => [...autopilotKeys.configs(), 'brand', brandId] as const,
    socialStatus: (configId: number) => [...autopilotKeys.all, 'socialStatus', configId] as const,
    queue: (configId: number) => [...autopilotKeys.all, 'queue', configId] as const,
    queueItem: (itemId: number) => [...autopilotKeys.all, 'queueItem', itemId] as const,
    queueStats: (configId: number) => [...autopilotKeys.all, 'stats', configId] as const,
    dashboard: (configId: number) => [...autopilotKeys.all, 'dashboard', configId] as const,
};

// === Config Hooks ===

export function useAutopilotConfigs() {
    return useQuery({
        queryKey: autopilotKeys.configs(),
        queryFn: getConfigs,
    });
}

export function useAutopilotConfig(configId: number | null) {
    return useQuery({
        queryKey: autopilotKeys.config(configId!),
        queryFn: () => getConfig(configId!),
        enabled: !!configId,
    });
}

export function useAutopilotConfigByBrand(brandId: number | null) {
    return useQuery({
        queryKey: autopilotKeys.configByBrand(brandId!),
        queryFn: () => getConfigByBrand(brandId!),
        enabled: !!brandId,
        retry: false,
    });
}

// NOWE: Hook dla statusu social accounts
export function useConfigSocialStatus(configId: number | null) {
    return useQuery({
        queryKey: autopilotKeys.socialStatus(configId!),
        queryFn: () => getConfigSocialStatus(configId!),
        enabled: !!configId,
        refetchInterval: 60000, // Co minutę
    });
}

export function useCreateAutopilotConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: BackendAutopilotConfigCreate) => createConfig(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: autopilotKeys.configs() });
            toast.success('Autopilot skonfigurowany!');
        },
        onError: (error: Error) => {
            toast.error(`Błąd: ${error.message}`);
        },
    });
}

export function useUpdateAutopilotConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ configId, data }: { configId: number; data: BackendAutopilotConfigUpdate }) =>
            updateConfig(configId, data),
        onSuccess: (updatedConfig) => {
            queryClient.invalidateQueries({ queryKey: autopilotKeys.configs() });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.config(updatedConfig.id) });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.dashboard(updatedConfig.id) });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.socialStatus(updatedConfig.id) });
            toast.success('Ustawienia zapisane!');
        },
        onError: (error: Error) => {
            toast.error(`Błąd: ${error.message}`);
        },
    });
}

export function useDeleteAutopilotConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (configId: number) => deleteConfig(configId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: autopilotKeys.configs() });
            toast.success('Autopilot usunięty');
        },
        onError: (error: Error) => {
            toast.error(`Błąd: ${error.message}`);
        },
    });
}

export function useToggleAutopilot() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ configId, active }: { configId: number; active: boolean }) =>
            active ? activateConfig(configId) : deactivateConfig(configId),
        onSuccess: (updatedConfig) => {
            queryClient.invalidateQueries({ queryKey: autopilotKeys.configs() });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.config(updatedConfig.id) });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.dashboard(updatedConfig.id) });
            toast.success(updatedConfig.is_active ? 'Autopilot aktywowany! 🚀' : 'Autopilot wyłączony');
        },
        onError: (error: Error) => {
            toast.error(`Błąd: ${error.message}`);
        },
    });
}

export function usePauseAutopilot() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ configId, paused }: { configId: number; paused: boolean }) =>
            paused ? pauseConfig(configId) : resumeConfig(configId),
        onSuccess: (updatedConfig) => {
            queryClient.invalidateQueries({ queryKey: autopilotKeys.configs() });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.config(updatedConfig.id) });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.dashboard(updatedConfig.id) });
            toast.success(updatedConfig.is_paused ? 'Autopilot wstrzymany' : 'Autopilot wznowiony');
        },
        onError: (error: Error) => {
            toast.error(`Błąd: ${error.message}`);
        },
    });
}

// === Generate Hook ===

export function useGeneratePosts() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ configId, request }: { configId: number; request?: GenerateQueueRequest }) =>
            generatePosts(configId, request),
        onSuccess: (result, { configId }) => {
            queryClient.invalidateQueries({ queryKey: autopilotKeys.queue(configId) });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.queueStats(configId) });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.dashboard(configId) });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.config(configId) });

            if (result.success && result.generated_count > 0) {
                toast.success(
                    `Wygenerowano ${result.generated_count} ${
                        result.generated_count === 1 ? 'post' :
                            result.generated_count < 5 ? 'posty' : 'postów'
                    }! 🎉`,
                    {
                        description: 'Posty czekają na Twoje zatwierdzenie w kolejce.',
                    }
                );
            }

            if (result.failed_count > 0) {
                toast.warning(
                    `${result.failed_count} ${
                        result.failed_count === 1 ? 'post nie został wygenerowany' : 'postów nie zostało wygenerowanych'
                    }`,
                    {
                        description: result.errors.join(', '),
                    }
                );
            }
        },
        onError: (error: Error) => {
            toast.error('Błąd generowania', {
                description: error.message,
            });
        },
    });
}

// === Queue Hooks ===

export function useAutopilotQueue(
    configId: number | null,
    options?: { status?: BackendQueueStatus; limit?: number; offset?: number }
) {
    return useQuery({
        queryKey: [...autopilotKeys.queue(configId!), options],
        queryFn: () => getQueueItems(configId!, options),
        enabled: !!configId,
    });
}

export function useQueueStats(configId: number | null) {
    return useQuery({
        queryKey: autopilotKeys.queueStats(configId!),
        queryFn: () => getQueueStats(configId!),
        enabled: !!configId,
    });
}

export function useQueueItem(itemId: number | null) {
    return useQuery({
        queryKey: autopilotKeys.queueItem(itemId!),
        queryFn: () => getQueueItem(itemId!),
        enabled: !!itemId,
    });
}

export function useUpdateQueueItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ itemId, data }: { itemId: number; data: BackendQueueItemUpdate }) =>
            updateQueueItem(itemId, data),
        onSuccess: (updatedItem) => {
            queryClient.invalidateQueries({ queryKey: autopilotKeys.queue(updatedItem.config_id) });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.queueItem(updatedItem.id) });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.queueStats(updatedItem.config_id) });
            toast.success('Post zaktualizowany');
        },
        onError: (error: Error) => {
            toast.error(`Błąd: ${error.message}`);
        },
    });
}

export function useApproveQueueItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ itemId, publishNow = false }: { itemId: number; publishNow?: boolean }) =>
            approveQueueItem(itemId, publishNow),
        onSuccess: (updatedItem) => {
            queryClient.invalidateQueries({ queryKey: autopilotKeys.queue(updatedItem.config_id) });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.queueStats(updatedItem.config_id) });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.dashboard(updatedItem.config_id) });

            if (updatedItem.status === 'published') {
                toast.success('Post zatwierdzony i opublikowany! 🎉', {
                    description: updatedItem.platform_post_url
                        ? 'Kliknij, aby zobaczyć post'
                        : undefined,
                });
            } else {
                toast.success('Post zatwierdzony! ✅');
            }
        },
        onError: (error: Error) => {
            toast.error(`Błąd: ${error.message}`);
        },
    });
}

export function useRejectQueueItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ itemId, notes }: { itemId: number; notes?: string }) =>
            rejectQueueItem(itemId, notes),
        onSuccess: (updatedItem) => {
            queryClient.invalidateQueries({ queryKey: autopilotKeys.queue(updatedItem.config_id) });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.queueStats(updatedItem.config_id) });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.dashboard(updatedItem.config_id) });
            toast.success('Post odrzucony');
        },
        onError: (error: Error) => {
            toast.error(`Błąd: ${error.message}`);
        },
    });
}

export function useDeleteQueueItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (itemId: number) => deleteQueueItem(itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: autopilotKeys.all });
            toast.success('Post usunięty');
        },
        onError: (error: Error) => {
            toast.error(`Błąd: ${error.message}`);
        },
    });
}

export function useBulkQueueAction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: BackendBulkActionRequest) => bulkQueueAction(data),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: autopilotKeys.all });
            const actionLabels = {
                approve: 'zatwierdzonych',
                reject: 'odrzuconych',
                delete: 'usuniętych',
                publish: 'opublikowanych',
            };
            toast.success(`${result.success_count} postów ${actionLabels[result.action as keyof typeof actionLabels] || result.action}`);
        },
        onError: (error: Error) => {
            toast.error(`Błąd: ${error.message}`);
        },
    });
}

// === NOWE: Publish Hooks ===

export function usePublishQueueItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ itemId, request }: { itemId: number; request?: PublishRequest }) =>
            publishQueueItem(itemId, request),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: autopilotKeys.all });

            if (result.success) {
                toast.success('Post opublikowany! 🎉', {
                    description: result.platform_post_url
                        ? `Opublikowano na ${result.platform}`
                        : `Opublikowano na ${result.platform}`,
                    action: result.platform_post_url ? {
                        label: 'Zobacz post',
                        onClick: () => window.open(result.platform_post_url, '_blank'),
                    } : undefined,
                });
            } else {
                toast.error('Błąd publikacji', {
                    description: result.error,
                });
            }
        },
        onError: (error: Error) => {
            toast.error('Błąd publikacji', {
                description: error.message,
            });
        },
    });
}

export function usePublishReadyItems() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (configId: number) => publishReadyItems(configId),
        onSuccess: (result, configId) => {
            queryClient.invalidateQueries({ queryKey: autopilotKeys.queue(configId) });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.queueStats(configId) });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.dashboard(configId) });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.config(configId) });

            if (result.published > 0) {
                toast.success(`Opublikowano ${result.published} postów! 🎉`);
            }
            if (result.failed > 0) {
                toast.warning(`${result.failed} postów nie udało się opublikować`);
            }
            if (result.total === 0) {
                toast.info('Brak postów gotowych do publikacji');
            }
        },
        onError: (error: Error) => {
            toast.error('Błąd publikacji', {
                description: error.message,
            });
        },
    });
}

export function useRetryFailedItems() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (configId: number) => retryFailedItems(configId),
        onSuccess: (result, configId) => {
            queryClient.invalidateQueries({ queryKey: autopilotKeys.queue(configId) });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.queueStats(configId) });
            queryClient.invalidateQueries({ queryKey: autopilotKeys.dashboard(configId) });

            if (result.success > 0) {
                toast.success(`${result.success} postów opublikowanych po ponowieniu! 🎉`);
            }
            if (result.still_failed > 0) {
                toast.warning(`${result.still_failed} postów nadal nie udało się opublikować`);
            }
        },
        onError: (error: Error) => {
            toast.error('Błąd', {
                description: error.message,
            });
        },
    });
}

// === Dashboard Hook ===

export function useAutopilotDashboard(configId: number | null) {
    return useQuery({
        queryKey: autopilotKeys.dashboard(configId!),
        queryFn: () => getDashboard(configId!),
        enabled: !!configId,
        refetchInterval: 60000,
    });
}