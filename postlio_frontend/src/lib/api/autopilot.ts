// src/lib/api/autopilot.ts
/**
 * API Client dla Autopilota
 */
import { apiClient } from './client';
import type {
    BackendAutopilotConfig,
    BackendAutopilotConfigCreate,
    BackendAutopilotConfigUpdate,
    BackendQueueItem,
    BackendQueueItemUpdate,
    BackendQueueStats,
    BackendAutopilotDashboard,
    BackendBulkActionRequest,
    BackendBulkActionResponse,
    BackendQueueStatus,
    GenerateQueueRequest,
    GenerateQueueResponse,
    // NOWE
    PublishRequest,
    PublishResponse,
    BulkPublishResponse,
    SocialStatusResponse,
} from '@/types/autopilot';

// === Config API ===

export async function getConfigs(): Promise<BackendAutopilotConfig[]> {
    return apiClient.get<BackendAutopilotConfig[]>('/autopilot/configs');
}

export async function getConfig(configId: number): Promise<BackendAutopilotConfig> {
    return apiClient.get<BackendAutopilotConfig>(`/autopilot/configs/${configId}`);
}

export async function getConfigByBrand(brandId: number): Promise<BackendAutopilotConfig> {
    return apiClient.get<BackendAutopilotConfig>(`/autopilot/configs/brand/${brandId}`);
}

export async function createConfig(data: BackendAutopilotConfigCreate): Promise<BackendAutopilotConfig> {
    return apiClient.post<BackendAutopilotConfig>('/autopilot/configs', data);
}

export async function updateConfig(
    configId: number,
    data: BackendAutopilotConfigUpdate
): Promise<BackendAutopilotConfig> {
    return apiClient.patch<BackendAutopilotConfig>(`/autopilot/configs/${configId}`, data);
}

export async function deleteConfig(configId: number): Promise<void> {
    await apiClient.delete(`/autopilot/configs/${configId}`);
}

export async function activateConfig(configId: number): Promise<BackendAutopilotConfig> {
    return apiClient.post<BackendAutopilotConfig>(`/autopilot/configs/${configId}/activate`);
}

export async function deactivateConfig(configId: number): Promise<BackendAutopilotConfig> {
    return apiClient.post<BackendAutopilotConfig>(`/autopilot/configs/${configId}/deactivate`);
}

export async function pauseConfig(configId: number): Promise<BackendAutopilotConfig> {
    return apiClient.post<BackendAutopilotConfig>(`/autopilot/configs/${configId}/pause`);
}

export async function resumeConfig(configId: number): Promise<BackendAutopilotConfig> {
    return apiClient.post<BackendAutopilotConfig>(`/autopilot/configs/${configId}/resume`);
}

// === NOWE: Social Status API ===

export async function getConfigSocialStatus(configId: number): Promise<SocialStatusResponse> {
    return apiClient.get<SocialStatusResponse>(`/autopilot/configs/${configId}/social-status`);
}

// === Generate API ===

export async function generatePosts(
    configId: number,
    request?: GenerateQueueRequest
): Promise<GenerateQueueResponse> {
    return apiClient.post<GenerateQueueResponse>(
        `/autopilot/configs/${configId}/generate`,
        request || {}
    );
}

// === Queue API ===

export async function getQueueItems(
    configId: number,
    options?: {
        status?: BackendQueueStatus;
        limit?: number;
        offset?: number;
    }
): Promise<BackendQueueItem[]> {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<BackendQueueItem[]>(`/autopilot/configs/${configId}/queue${query}`);
}

export async function getQueueStats(configId: number): Promise<BackendQueueStats> {
    return apiClient.get<BackendQueueStats>(`/autopilot/configs/${configId}/queue/stats`);
}

export async function getQueueItem(itemId: number): Promise<BackendQueueItem> {
    return apiClient.get<BackendQueueItem>(`/autopilot/queue/${itemId}`);
}

export async function updateQueueItem(
    itemId: number,
    data: BackendQueueItemUpdate
): Promise<BackendQueueItem> {
    return apiClient.patch<BackendQueueItem>(`/autopilot/queue/${itemId}`, data);
}

export async function approveQueueItem(
    itemId: number,
    publishNow: boolean = false
): Promise<BackendQueueItem> {
    const params = publishNow ? '?publish_now=true' : '';
    return apiClient.post<BackendQueueItem>(`/autopilot/queue/${itemId}/approve${params}`);
}

export async function rejectQueueItem(itemId: number, notes?: string): Promise<BackendQueueItem> {
    const params = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    return apiClient.post<BackendQueueItem>(`/autopilot/queue/${itemId}/reject${params}`);
}

export async function deleteQueueItem(itemId: number): Promise<void> {
    await apiClient.delete(`/autopilot/queue/${itemId}`);
}

export async function bulkQueueAction(data: BackendBulkActionRequest): Promise<BackendBulkActionResponse> {
    return apiClient.post<BackendBulkActionResponse>('/autopilot/queue/bulk', data);
}

// === NOWE: Publish API ===

export async function publishQueueItem(
    itemId: number,
    request?: PublishRequest
): Promise<PublishResponse> {
    return apiClient.post<PublishResponse>(
        `/autopilot/queue/${itemId}/publish`,
        request || {}
    );
}

export async function publishReadyItems(configId: number): Promise<BulkPublishResponse> {
    return apiClient.post<BulkPublishResponse>(
        `/autopilot/configs/${configId}/publish-ready`
    );
}

export async function retryFailedItems(configId: number): Promise<{
    retried: number;
    success: number;
    still_failed: number;
}> {
    return apiClient.post(`/autopilot/configs/${configId}/retry-failed`);
}

// === Dashboard API ===

export async function getDashboard(configId: number): Promise<BackendAutopilotDashboard> {
    return apiClient.get<BackendAutopilotDashboard>(`/autopilot/dashboard/${configId}`);
}

// === Export ===

export const autopilotApi = {
    // Config
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

    // Generate
    generatePosts,

    // Queue
    getQueueItems,
    getQueueStats,
    getQueueItem,
    updateQueueItem,
    approveQueueItem,
    rejectQueueItem,
    deleteQueueItem,
    bulkQueueAction,

    // Publish (NOWE)
    publishQueueItem,
    publishReadyItems,
    retryFailedItems,

    // Dashboard
    getDashboard,
};

export default autopilotApi;