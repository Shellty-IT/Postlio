// src/hooks/index.ts
/**
 * Hooks - Eksport zbiorczy
 */

// ============================================================
// AUTH HOOKS
// ============================================================

export {
    useAuth,
    useUser,
    useLogin,
    useRegister,
    useLogout,
    authKeys,
} from './useAuth';

// ============================================================
// AI HOOKS
// ============================================================

export {
    useAI,
    useAIProviders,
    useGenerateText,
    useGenerateImage,
    useAIChat,
    useImproveText,
    useGenerateVariations,
    aiKeys,
} from './useAI';

// ============================================================
// POSTS HOOKS
// ============================================================

export {
    usePostsManager,
    usePosts,
    usePost,
    useCalendarPosts,
    useCreatePost,
    useUpdatePost,
    useDeletePost,
    useSchedulePost,
    usePublishPost,
    useDuplicatePost,
    useBulkPostsAction,
    postsKeys,
} from './usePosts';

// ============================================================
// BRANDS HOOKS
// ============================================================

export {
    useBrandsManager,
    useBrands,
    useBrand,
    useBrandAnalytics,
    useCreateBrand,
    useUpdateBrand,
    useDeleteBrand,
    useUploadBrandLogo,
    useAnalyzeBrandVoice,
    useSetDefaultBrand,
    brandsKeys,
} from './useBrands';

// ============================================================
// PWA HOOKS
// ============================================================

export { usePWA } from './usePWA';

// ============================================================
// AUTOPILOT HOOKS
// ============================================================

export {
    useAutopilotConfigs,
    useAutopilotConfig,
    useAutopilotConfigByBrand,
    useCreateAutopilotConfig,
    useUpdateAutopilotConfig,
    useDeleteAutopilotConfig,
    useToggleAutopilot,
    usePauseAutopilot,
    useAutopilotQueue,
    useQueueStats,
    useQueueItem,
    useUpdateQueueItem,
    useApproveQueueItem,
    useRejectQueueItem,
    useDeleteQueueItem,
    useBulkQueueAction,
    useAutopilotDashboard,
    autopilotKeys,
} from './useAutopilot';

// ============================================================
// SOCIAL MEDIA HOOKS
// ============================================================

export {
    useConnectedAccounts,
    useAccount,
    useAvailablePlatforms,
    useInitOAuth,
    useOAuthCallback,
    useDisconnectAccount,
    useRefreshToken,
    usePublishToSocial,
    socialKeys,
    getPlatformInfo,
    getStatusText,
    getStatusColor,
} from './useSocial';