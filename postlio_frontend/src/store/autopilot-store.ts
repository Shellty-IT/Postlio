// src/store/autopilot-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    AutopilotConfig,
    AutopilotStats,
    QueuedPost,
    ActivityLogEntry,
    AutopilotStatus,
    QueueStatus,
} from '@/types/autopilot';

// ==================== MOCK DATA ====================

const mockConfigs: AutopilotConfig[] = [
    {
        id: 'ap-1',
        brandId: 'brand-1',
        name: 'TechStartup Pro - Social Mix',
        status: 'active',
        platforms: ['facebook', 'linkedin', 'instagram'],
        schedule: {
            frequency: 'weekly',
            postsPerPeriod: 5,
            selectedDays: [1, 2, 3, 4, 5],
            timeSlots: [
                { id: '1', time: '09:00', label: 'Poranek' },
                { id: '2', time: '15:00', label: 'Popołudnie' },
            ],
            timezone: 'Europe/Warsaw',
        },
        contentMix: [
            { type: 'educational', percentage: 40, enabled: true },
            { type: 'promotional', percentage: 20, enabled: true },
            { type: 'engagement', percentage: 25, enabled: true },
            { type: 'behind-the-scenes', percentage: 15, enabled: true },
        ],
        topics: [
            { id: 't1', topic: 'Produktywność w pracy zdalnej', category: 'tips', usedCount: 3 },
            { id: 't2', topic: 'Nowości w technologii AI', category: 'news', usedCount: 5 },
            { id: 't3', topic: 'Case study klientów', category: 'promotional', usedCount: 2 },
        ],
        generationSettings: {
            textProvider: 'gemini',
            imageProvider: 'pollinations',
            generateImages: true,
            imageStyle: 'modern, minimalist, tech',
            maxRetries: 3,
            creativityLevel: 70,
            useHashtags: true,
            hashtagCount: 5,
            useEmojis: true,
            includeCallToAction: true,
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-03-10T14:30:00Z',
        lastRunAt: '2024-03-10T09:00:00Z',
        nextRunAt: '2024-03-11T09:00:00Z',
        totalGenerated: 127,
        totalPublished: 118,
        requiresApproval: true,
        autoApproveAfterHours: 24,
        notifyOnGeneration: true,
        notifyOnPublish: true,
        notifyOnError: true,
    },
    {
        id: 'ap-2',
        brandId: 'brand-2',
        name: 'Kawiarnia Artystyczna - Instagram Focus',
        status: 'paused',
        platforms: ['instagram'],
        schedule: {
            frequency: 'daily',
            postsPerPeriod: 1,
            selectedDays: [0, 1, 2, 3, 4, 5, 6],
            timeSlots: [{ id: '1', time: '11:00', label: 'Przed lunchem' }],
            timezone: 'Europe/Warsaw',
        },
        contentMix: [
            { type: 'behind-the-scenes', percentage: 50, enabled: true },
            { type: 'promotional', percentage: 30, enabled: true },
            { type: 'engagement', percentage: 20, enabled: true },
        ],
        topics: [
            { id: 't1', topic: 'Nowe smaki w menu', category: 'promotional', usedCount: 8 },
            { id: 't2', topic: 'Poranna atmosfera', category: 'behind-the-scenes', usedCount: 12 },
        ],
        generationSettings: {
            textProvider: 'groq',
            imageProvider: 'huggingface',
            generateImages: true,
            imageStyle: 'warm, cozy, artistic, coffee shop aesthetic',
            maxRetries: 2,
            creativityLevel: 85,
            useHashtags: true,
            hashtagCount: 10,
            useEmojis: true,
            includeCallToAction: false,
        },
        createdAt: '2024-02-20T12:00:00Z',
        updatedAt: '2024-03-08T16:45:00Z',
        lastRunAt: '2024-03-08T11:00:00Z',
        nextRunAt: undefined,
        totalGenerated: 45,
        totalPublished: 42,
        requiresApproval: false,
        notifyOnGeneration: false,
        notifyOnPublish: true,
        notifyOnError: true,
    },
];

const mockQueue: QueuedPost[] = [
    {
        id: 'q-1',
        autopilotId: 'ap-1',
        brandId: 'brand-1',
        content: '🚀 5 sposobów na zwiększenie produktywności w pracy zdalnej!\n\n1. Stwórz dedykowaną przestrzeń do pracy\n2. Ustal stałe godziny pracy\n3. Rób regularne przerwy\n4. Używaj narzędzi do zarządzania czasem\n5. Komunikuj się proaktywnie z zespołem\n\nKtóry sposób działa u Ciebie najlepiej? 💬\n\n#PracaZdalna #Produktywność #HomeOffice #WorkLifeBalance #Tips',
        platforms: ['linkedin', 'facebook'],
        scheduledFor: '2024-03-11T09:00:00Z',
        status: 'pending_review',
        generatedAt: '2024-03-10T14:00:00Z',
        generatedBy: 'gemini',
        contentType: 'tips',
        topic: 'Produktywność w pracy zdalnej',
        imageUrl: 'https://picsum.photos/seed/productivity/800/600',
        imagePrompt: 'Modern home office setup with laptop, plants, and natural light',
    },
    {
        id: 'q-2',
        autopilotId: 'ap-1',
        brandId: 'brand-1',
        content: '💡 AI zmienia zasady gry w biznesie!\n\nNajnowsze trendy w sztucznej inteligencji na 2024:\n\n• Generative AI w content marketingu\n• Automatyzacja procesów biznesowych\n• Personalizacja customer experience\n• Predykcyjna analityka danych\n\nCzy Twoja firma jest gotowa na rewolucję AI?\n\n#AI #ArtificialIntelligence #BusinessTrends #Innovation #Tech2024',
        platforms: ['linkedin'],
        scheduledFor: '2024-03-11T15:00:00Z',
        status: 'approved',
        generatedAt: '2024-03-10T14:05:00Z',
        generatedBy: 'gemini',
        contentType: 'news',
        topic: 'Nowości w technologii AI',
        reviewedAt: '2024-03-10T16:00:00Z',
    },
    {
        id: 'q-3',
        autopilotId: 'ap-1',
        brandId: 'brand-1',
        content: '🎯 Case Study: Jak firma XYZ zwiększyła konwersję o 150%!\n\nNasz klient stanął przed wyzwaniem niskiej konwersji na stronie...\n\n[Przeczytaj pełne case study w linku w bio]\n\n#CaseStudy #MarketingDigital #Konwersja #Success #Business',
        platforms: ['instagram', 'facebook'],
        scheduledFor: '2024-03-12T09:00:00Z',
        status: 'scheduled',
        generatedAt: '2024-03-10T14:10:00Z',
        generatedBy: 'gemini',
        contentType: 'promotional',
        topic: 'Case study klientów',
        imageUrl: 'https://picsum.photos/seed/casestudy/800/800',
        reviewedAt: '2024-03-10T15:30:00Z',
    },
    {
        id: 'q-4',
        autopilotId: 'ap-1',
        brandId: 'brand-1',
        content: '☕ Poniedziałkowy poranek w biurze!\n\nNasz zespół już przy pracy - planujemy nowe projekty i wymyślamy kreatywne rozwiązania.\n\nJak wygląda Wasz poniedziałek?\n\n#MondayMotivation #TeamWork #OfficeLife #BehindTheScenes',
        platforms: ['instagram'],
        scheduledFor: '2024-03-10T08:00:00Z',
        status: 'published',
        generatedAt: '2024-03-09T14:00:00Z',
        generatedBy: 'groq',
        contentType: 'behind-the-scenes',
        publishedAt: '2024-03-10T08:01:23Z',
        engagementScore: 4.2,
    },
    {
        id: 'q-5',
        autopilotId: 'ap-2',
        brandId: 'brand-2',
        content: '☕✨ Nowy smak w menu!\n\nPrzedstawiamy: Lavender Honey Latte 💜🍯\n\nDelikatna lawenda spotyka się z słodkim miodem w aksamitnej kawie...\n\nDostępne od dziś! Wpadnij i spróbuj! 😋\n\n#NewInMenu #CoffeeLovers #LavendeLatte #KawiarniArtystyczna',
        platforms: ['instagram'],
        scheduledFor: '2024-03-11T11:00:00Z',
        status: 'pending_review',
        generatedAt: '2024-03-10T10:00:00Z',
        generatedBy: 'groq',
        contentType: 'promotional',
        topic: 'Nowe smaki w menu',
        imageUrl: 'https://picsum.photos/seed/latte/800/800',
    },
];

const mockStats: Record<string, AutopilotStats> = {
    'ap-1': {
        configId: 'ap-1',
        totalGenerated: 127,
        totalPublished: 118,
        totalPending: 2,
        totalApproved: 3,
        totalRejected: 4,
        totalFailed: 0,
        avgApprovalTime: 4.5,
        avgEngagementRate: 3.8,
        platformStats: [
            { platform: 'linkedin', postsPublished: 52, avgEngagement: 4.2, topPerformingType: 'educational' },
            { platform: 'facebook', postsPublished: 38, avgEngagement: 3.5, topPerformingType: 'engagement' },
            { platform: 'instagram', postsPublished: 28, avgEngagement: 5.1, topPerformingType: 'behind-the-scenes' },
        ],
        contentTypePerformance: {
            educational: 4.5,
            promotional: 2.8,
            engagement: 4.1,
            'behind-the-scenes': 5.2,
            'user-generated': 0,
            news: 3.2,
            tips: 3.9,
            quote: 0,
            poll: 0,
            announcement: 0,
        },
        lastRunAt: '2024-03-10T09:00:00Z',
        nextRunAt: '2024-03-11T09:00:00Z',
        streak: 14,
        healthScore: 92,
    },
    'ap-2': {
        configId: 'ap-2',
        totalGenerated: 45,
        totalPublished: 42,
        totalPending: 1,
        totalApproved: 0,
        totalRejected: 2,
        totalFailed: 0,
        avgApprovalTime: 0,
        avgEngagementRate: 6.2,
        platformStats: [
            { platform: 'instagram', postsPublished: 42, avgEngagement: 6.2, topPerformingType: 'behind-the-scenes' },
        ],
        contentTypePerformance: {
            educational: 0,
            promotional: 5.8,
            engagement: 6.0,
            'behind-the-scenes': 7.1,
            'user-generated': 0,
            news: 0,
            tips: 0,
            quote: 0,
            poll: 0,
            announcement: 0,
        },
        lastRunAt: '2024-03-08T11:00:00Z',
        nextRunAt: undefined,
        streak: 0,
        healthScore: 75,
    },
};

const mockActivityLog: ActivityLogEntry[] = [
    {
        id: 'log-1',
        autopilotId: 'ap-1',
        type: 'generation_completed',
        message: 'Wygenerowano 3 nowe posty',
        timestamp: '2024-03-10T14:15:00Z',
        details: { postsCount: 3, provider: 'gemini' },
    },
    {
        id: 'log-2',
        autopilotId: 'ap-1',
        type: 'post_approved',
        message: 'Post zatwierdzony do publikacji',
        timestamp: '2024-03-10T16:00:00Z',
        postId: 'q-2',
    },
    {
        id: 'log-3',
        autopilotId: 'ap-1',
        type: 'post_published',
        message: 'Post opublikowany na Instagram',
        timestamp: '2024-03-10T08:01:23Z',
        postId: 'q-4',
    },
    {
        id: 'log-4',
        autopilotId: 'ap-2',
        type: 'autopilot_paused',
        message: 'Autopilot wstrzymany przez użytkownika',
        timestamp: '2024-03-08T17:00:00Z',
    },
];

// ==================== STORE INTERFACE ====================

interface AutopilotStore {
    // State
    configs: AutopilotConfig[];
    queue: QueuedPost[];
    stats: Record<string, AutopilotStats>;
    activityLog: ActivityLogEntry[];
    selectedConfigId: string | null;
    isLoading: boolean;
    isGenerating: boolean;

    // Filters
    queueFilter: QueueStatus | 'all';

    // Actions - Configs
    selectConfig: (id: string | null) => void;
    createConfig: (config: Omit<AutopilotConfig, 'id' | 'createdAt' | 'updatedAt' | 'totalGenerated' | 'totalPublished'>) => void;
    updateConfig: (id: string, updates: Partial<AutopilotConfig>) => void;
    deleteConfig: (id: string) => void;
    toggleConfigStatus: (id: string) => void;

    // Actions - Queue
    setQueueFilter: (filter: QueueStatus | 'all') => void;
    approvePost: (postId: string) => void;
    rejectPost: (postId: string, reason?: string) => void;
    reschedulePost: (postId: string, newDate: string) => void;
    deleteQueuedPost: (postId: string) => void;
    regeneratePost: (postId: string) => void;

    // Actions - Generation
    triggerGeneration: (configId: string) => Promise<void>;

    // Getters
    getConfigById: (id: string) => AutopilotConfig | undefined;
    getQueueByConfig: (configId: string) => QueuedPost[];
    getFilteredQueue: () => QueuedPost[];
    getStatsByConfig: (configId: string) => AutopilotStats | undefined;
    getActivityByConfig: (configId: string) => ActivityLogEntry[];
    getPendingCount: () => number;
}

// ==================== STORE ====================

export const useAutopilotStore = create<AutopilotStore>()(
    persist(
        (set, get) => ({
            // Initial State
            configs: mockConfigs,
            queue: mockQueue,
            stats: mockStats,
            activityLog: mockActivityLog,
            selectedConfigId: null,
            isLoading: false,
            isGenerating: false,
            queueFilter: 'all',

            // Config Actions
            selectConfig: (id) => set({ selectedConfigId: id }),

            createConfig: (config) => {
                const newConfig: AutopilotConfig = {
                    ...config,
                    id: `ap-${Date.now()}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    totalGenerated: 0,
                    totalPublished: 0,
                };
                set((state) => ({
                    configs: [...state.configs, newConfig],
                }));
            },

            updateConfig: (id, updates) => {
                set((state) => ({
                    configs: state.configs.map((c) =>
                        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
                    ),
                }));
            },

            deleteConfig: (id) => {
                set((state) => ({
                    configs: state.configs.filter((c) => c.id !== id),
                    queue: state.queue.filter((q) => q.autopilotId !== id),
                    selectedConfigId: state.selectedConfigId === id ? null : state.selectedConfigId,
                }));
            },

            toggleConfigStatus: (id) => {
                set((state) => ({
                    configs: state.configs.map((c) => {
                        if (c.id !== id) return c;
                        const newStatus: AutopilotStatus = c.status === 'active' ? 'paused' : 'active';
                        return {
                            ...c,
                            status: newStatus,
                            updatedAt: new Date().toISOString(),
                            nextRunAt: newStatus === 'active' ? new Date(Date.now() + 3600000).toISOString() : undefined,
                        };
                    }),
                }));
            },

            // Queue Actions
            setQueueFilter: (filter) => set({ queueFilter: filter }),

            approvePost: (postId) => {
                set((state) => ({
                    queue: state.queue.map((p) =>
                        p.id === postId
                            ? {
                                ...p,
                                status: 'approved' as QueueStatus,
                                reviewedAt: new Date().toISOString(),
                            }
                            : p
                    ),
                }));
            },

            rejectPost: (postId, reason) => {
                set((state) => ({
                    queue: state.queue.map((p) =>
                        p.id === postId
                            ? {
                                ...p,
                                status: 'rejected' as QueueStatus,
                                reviewedAt: new Date().toISOString(),
                                reviewNotes: reason,
                            }
                            : p
                    ),
                }));
            },

            reschedulePost: (postId, newDate) => {
                set((state) => ({
                    queue: state.queue.map((p) =>
                        p.id === postId ? { ...p, scheduledFor: newDate } : p
                    ),
                }));
            },

            deleteQueuedPost: (postId) => {
                set((state) => ({
                    queue: state.queue.filter((p) => p.id !== postId),
                }));
            },

            regeneratePost: (postId) => {
                // In real implementation, this would call the AI API
                const post = get().queue.find((p) => p.id === postId);
                if (!post) return;

                set((state) => ({
                    queue: state.queue.map((p) =>
                        p.id === postId ? { ...p, status: 'generating' as QueueStatus } : p
                    ),
                }));

                // Simulate regeneration
                setTimeout(() => {
                    set((state) => ({
                        queue: state.queue.map((p) =>
                            p.id === postId
                                ? {
                                    ...p,
                                    status: 'pending_review' as QueueStatus,
                                    content: p.content + '\n\n[Zregenerowano]',
                                    generatedAt: new Date().toISOString(),
                                }
                                : p
                        ),
                    }));
                }, 2000);
            },

            // Generation
            triggerGeneration: async (configId) => {
                set({ isGenerating: true });

                // Simulate AI generation delay
                await new Promise((resolve) => setTimeout(resolve, 3000));

                const config = get().configs.find((c) => c.id === configId);
                if (!config) {
                    set({ isGenerating: false });
                    return;
                }

                const newPost: QueuedPost = {
                    id: `q-${Date.now()}`,
                    autopilotId: configId,
                    brandId: config.brandId,
                    content: '🎯 Nowy post wygenerowany przez AI!\n\nTo jest automatycznie wygenerowana treść...\n\n#AutoGenerated #AI #Content',
                    platforms: config.platforms,
                    scheduledFor: new Date(Date.now() + 86400000).toISOString(),
                    status: 'pending_review',
                    generatedAt: new Date().toISOString(),
                    generatedBy: config.generationSettings.textProvider === 'auto' ? 'gemini' : config.generationSettings.textProvider,
                    contentType: 'educational',
                };

                set((state) => ({
                    queue: [newPost, ...state.queue],
                    isGenerating: false,
                    activityLog: [
                        {
                            id: `log-${Date.now()}`,
                            autopilotId: configId,
                            type: 'generation_completed',
                            message: 'Wygenerowano nowy post',
                            timestamp: new Date().toISOString(),
                            postId: newPost.id,
                        },
                        ...state.activityLog,
                    ],
                }));
            },

            // Getters
            getConfigById: (id) => get().configs.find((c) => c.id === id),

            getQueueByConfig: (configId) =>
                get().queue.filter((p) => p.autopilotId === configId),

            getFilteredQueue: () => {
                const { queue, queueFilter, selectedConfigId } = get();
                let filtered = selectedConfigId
                    ? queue.filter((p) => p.autopilotId === selectedConfigId)
                    : queue;

                if (queueFilter !== 'all') {
                    filtered = filtered.filter((p) => p.status === queueFilter);
                }

                return filtered.sort(
                    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
                );
            },

            getStatsByConfig: (configId) => get().stats[configId],

            getActivityByConfig: (configId) =>
                get().activityLog.filter((a) => a.autopilotId === configId),

            getPendingCount: () =>
                get().queue.filter((p) => p.status === 'pending_review').length,
        }),
        {
            name: 'postlio-autopilot',
            partialize: (state) => ({
                selectedConfigId: state.selectedConfigId,
                queueFilter: state.queueFilter,
            }),
        }
    )
);