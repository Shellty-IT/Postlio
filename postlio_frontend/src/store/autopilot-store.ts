// src/store/autopilot-store.ts
/**
 * Store Autopilota - tylko stan UI (filtry, selekcja)
 * Dane pobierane są przez React Query hooks
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BackendQueueStatus } from '@/types/autopilot';

// ==================== STORE INTERFACE ====================

interface AutopilotUIStore {
    // Selection
    selectedConfigId: number | null;

    // Filters
    queueFilter: BackendQueueStatus | 'all';
    searchQuery: string;

    // UI State
    activeTab: 'queue' | 'stats' | 'config';
    isCreateModalOpen: boolean;

    // Actions
    selectConfig: (id: number | null) => void;
    setQueueFilter: (filter: BackendQueueStatus | 'all') => void;
    setSearchQuery: (query: string) => void;
    setActiveTab: (tab: 'queue' | 'stats' | 'config') => void;
    setCreateModalOpen: (open: boolean) => void;
    reset: () => void;
}

// ==================== STORE ====================

const initialState = {
    selectedConfigId: null,
    queueFilter: 'all' as BackendQueueStatus | 'all',
    searchQuery: '',
    activeTab: 'queue' as const,
    isCreateModalOpen: false,
};

export const useAutopilotStore = create<AutopilotUIStore>()(
    persist(
        (set) => ({
            ...initialState,

            selectConfig: (id) => set({ selectedConfigId: id }),

            setQueueFilter: (filter) => set({ queueFilter: filter }),

            setSearchQuery: (query) => set({ searchQuery: query }),

            setActiveTab: (tab) => set({ activeTab: tab }),

            setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),

            reset: () => set(initialState),
        }),
        {
            name: 'postlio-autopilot-ui',
            partialize: (state) => ({
                selectedConfigId: state.selectedConfigId,
                queueFilter: state.queueFilter,
                activeTab: state.activeTab,
            }),
        }
    )
);