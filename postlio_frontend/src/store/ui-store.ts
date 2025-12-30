// src/store/ui-store.ts
/**
 * UI Store
 *
 * Globalny stan interfejsu użytkownika.
 * Theme, sidebar, modale, powiadomienia.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================
// TYPY
// ============================================================

type Theme = 'light' | 'dark' | 'system';

type ModalType =
    | 'create-post'
    | 'edit-post'
    | 'delete-post'
    | 'create-brand'
    | 'edit-brand'
    | 'ai-settings'
    | 'schedule-post'
    | 'image-preview'
    | null;

interface ModalData {
    [key: string]: unknown;
}

interface UIState {
    // Theme
    theme: Theme;
    setTheme: (theme: Theme) => void;

    // Sidebar
    sidebarOpen: boolean;
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setSidebarCollapsed: (collapsed: boolean) => void;

    // Mobile menu
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;

    // Modal
    activeModal: ModalType;
    modalData: ModalData | null;
    openModal: (type: ModalType, data?: ModalData) => void;
    closeModal: () => void;

    // AI Panel (dla trybu Kreator)
    aiPanelOpen: boolean;
    setAiPanelOpen: (open: boolean) => void;
    toggleAiPanel: () => void;

    // Global loading (dla operacji blokujących)
    globalLoading: boolean;
    globalLoadingMessage: string | null;
    setGlobalLoading: (loading: boolean, message?: string) => void;

    // Command palette (Cmd+K)
    commandPaletteOpen: boolean;
    setCommandPaletteOpen: (open: boolean) => void;
    toggleCommandPalette: () => void;
}

// ============================================================
// STORE
// ============================================================

export const useUIStore = create<UIState>()(
    persist(
        (set, get) => ({
            // ==================== THEME ====================
            theme: 'system',

            setTheme: (theme: Theme) => {
                set({ theme });

                // Aplikuj theme do dokumentu
                if (typeof window !== 'undefined') {
                    const root = window.document.documentElement;
                    root.classList.remove('light', 'dark');

                    if (theme === 'system') {
                        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                            ? 'dark'
                            : 'light';
                        root.classList.add(systemTheme);
                    } else {
                        root.classList.add(theme);
                    }
                }
            },

            // ==================== SIDEBAR ====================
            sidebarOpen: true,
            sidebarCollapsed: false,

            toggleSidebar: () => {
                const { sidebarOpen } = get();
                set({ sidebarOpen: !sidebarOpen });
            },

            setSidebarOpen: (open: boolean) => {
                set({ sidebarOpen: open });
            },

            setSidebarCollapsed: (collapsed: boolean) => {
                set({ sidebarCollapsed: collapsed });
            },

            // ==================== MOBILE MENU ====================
            mobileMenuOpen: false,

            setMobileMenuOpen: (open: boolean) => {
                set({ mobileMenuOpen: open });

                // Blokuj scroll gdy menu otwarte
                if (typeof window !== 'undefined') {
                    document.body.style.overflow = open ? 'hidden' : '';
                }
            },

            // ==================== MODAL ====================
            activeModal: null,
            modalData: null,

            openModal: (type: ModalType, data?: ModalData) => {
                set({
                    activeModal: type,
                    modalData: data || null,
                });
            },

            closeModal: () => {
                set({
                    activeModal: null,
                    modalData: null,
                });
            },

            // ==================== AI PANEL ====================
            aiPanelOpen: false,

            setAiPanelOpen: (open: boolean) => {
                set({ aiPanelOpen: open });
            },

            toggleAiPanel: () => {
                const { aiPanelOpen } = get();
                set({ aiPanelOpen: !aiPanelOpen });
            },

            // ==================== GLOBAL LOADING ====================
            globalLoading: false,
            globalLoadingMessage: null,

            setGlobalLoading: (loading: boolean, message?: string) => {
                set({
                    globalLoading: loading,
                    globalLoadingMessage: message || null,
                });
            },

            // ==================== COMMAND PALETTE ====================
            commandPaletteOpen: false,

            setCommandPaletteOpen: (open: boolean) => {
                set({ commandPaletteOpen: open });
            },

            toggleCommandPalette: () => {
                const { commandPaletteOpen } = get();
                set({ commandPaletteOpen: !commandPaletteOpen });
            },
        }),
        {
            name: 'postlio-ui',
            // Zapisuj tylko wybrane pola w localStorage
            partialize: (state) => ({
                theme: state.theme,
                sidebarCollapsed: state.sidebarCollapsed,
            }),
        }
    )
);

// ============================================================
// HOOKI POMOCNICZE
// ============================================================

/**
 * Hook do zarządzania theme
 */
export function useTheme() {
    const theme = useUIStore((state) => state.theme);
    const setTheme = useUIStore((state) => state.setTheme);

    return { theme, setTheme };
}

/**
 * Hook do zarządzania sidebar
 */
export function useSidebar() {
    const sidebarOpen = useUIStore((state) => state.sidebarOpen);
    const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
    const toggleSidebar = useUIStore((state) => state.toggleSidebar);
    const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);
    const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed);

    return {
        isOpen: sidebarOpen,
        isCollapsed: sidebarCollapsed,
        toggle: toggleSidebar,
        setOpen: setSidebarOpen,
        setCollapsed: setSidebarCollapsed,
    };
}

/**
 * Hook do zarządzania modala
 */
export function useModal() {
    const activeModal = useUIStore((state) => state.activeModal);
    const modalData = useUIStore((state) => state.modalData);
    const openModal = useUIStore((state) => state.openModal);
    const closeModal = useUIStore((state) => state.closeModal);

    return {
        activeModal,
        modalData,
        open: openModal,
        close: closeModal,
        isOpen: (type: ModalType) => activeModal === type,
    };
}

/**
 * Hook do AI Panel
 */
export function useAiPanel() {
    const aiPanelOpen = useUIStore((state) => state.aiPanelOpen);
    const setAiPanelOpen = useUIStore((state) => state.setAiPanelOpen);
    const toggleAiPanel = useUIStore((state) => state.toggleAiPanel);

    return {
        isOpen: aiPanelOpen,
        setOpen: setAiPanelOpen,
        toggle: toggleAiPanel,
    };
}

export default useUIStore;