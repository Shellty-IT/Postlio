// src/types/autopilot.ts
import type { Platform } from './index';
import type { Brand } from './brand';

// ==================== SCHEDULE TYPES ====================

export type FrequencyType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

// Nowy typ dla backendu (używa nazw dni)
export type DayOfWeekName =
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday';

export interface TimeSlot {
    id: string;
    time: string; // "HH:mm" format
    label?: string; // e.g., "Morning", "Afternoon"
}

export interface ScheduleConfig {
    frequency: FrequencyType;
    postsPerPeriod: number;
    selectedDays: DayOfWeek[];
    timeSlots: TimeSlot[];
    timezone: string;
    startDate?: string; // ISO date
    endDate?: string; // ISO date (optional end)
}

// ==================== CONTENT TYPES ====================

export type ContentType =
    | 'promotional'
    | 'educational'
    | 'engagement'
    | 'behind-the-scenes'
    | 'user-generated'
    | 'news'
    | 'tips'
    | 'quote'
    | 'poll'
    | 'announcement';

export interface ContentMix {
    type: ContentType;
    percentage: number; // 0-100
    enabled: boolean;
}

export interface TopicSuggestion {
    id: string;
    topic: string;
    category: ContentType;
    usedCount: number;
    lastUsed?: string;
}

// ==================== GENERATION SETTINGS ====================

export type AIProvider = 'gemini' | 'groq' | 'auto';

export type ImageProvider = 'pollinations' | 'huggingface' | 'none';

export type PostLength = 'short' | 'medium' | 'long';
export type ImageStyle =
    | 'realistic'
    | 'artistic'
    | 'cartoon'
    | 'minimalist'
    | 'vibrant'
    | 'professional';

export interface GenerationSettings {
    textProvider: AIProvider;
    imageProvider: ImageProvider;
    generateImages: boolean;
    imageStyle?: string;
    maxRetries: number;
    creativityLevel: number; // 0-100, maps to temperature
    useHashtags: boolean;
    hashtagCount: number;
    useEmojis: boolean;
    minLength?: number;
    maxLength?: number;
    includeCallToAction: boolean;
}

// ==================== QUEUE TYPES ====================

export type QueueStatus =
    | 'generating'
    | 'pending_review'
    | 'approved'
    | 'scheduled'
    | 'publishing'
    | 'published'
    | 'failed'
    | 'rejected';

// Status z backendu (mapowany na QueueStatus w UI)
export type BackendQueueStatus =
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'published'
    | 'failed'
    | 'scheduled';

export interface QueuedPost {
    id: string;
    autopilotId: string;
    brandId: string;
    content: string;
    platforms: Platform[];
    scheduledFor: string; // ISO datetime
    status: QueueStatus;
    generatedAt: string;
    generatedBy: AIProvider;
    imageUrl?: string;
    imagePrompt?: string;
    contentType: ContentType;
    topic?: string;
    variations?: PostVariation[];
    error?: string;
    publishedAt?: string;
    engagementScore?: number;
    reviewedBy?: string;
    reviewedAt?: string;
    reviewNotes?: string;
}

export interface PostVariation {
    id: string;
    platform: Platform;
    content: string;
    characterCount: number;
}

// ==================== BACKEND API TYPES ====================
// Typy zsynchronizowane z backendem

export interface BackendAutopilotConfig {
    id: number;
    user_id: number;
    brand_id: number;
    is_active: boolean;
    is_paused: boolean;

    // Schedule
    posts_per_week: number;
    schedule_days: DayOfWeekName[];
    schedule_time: string;
    timezone: string;

    // Platforms & Categories
    platforms: Platform[];
    categories: ThematicCategoryId[];

    // Social Media Mapping
    social_account_mapping: Record<string, number>;
    auto_publish_on_approve: boolean;

    // Generation settings
    creativity_level: number;
    post_length: PostLength;
    include_images: boolean;
    include_hashtags: boolean;
    include_emoji: boolean;

    // AI preferences
    text_provider: string;
    image_provider: string;
    image_style: ImageStyle;

    // Stats
    total_generated: number;
    total_approved: number;
    total_rejected: number;
    total_published: number;
    streak_days: number;
    last_generation_at: string | null;
    last_published_at: string | null;

    // Computed
    health_score?: number;
    next_generation_at?: string | null;

    // Timestamps
    created_at: string;
    updated_at: string;
}

export interface BackendAutopilotConfigCreate {
    brand_id: number;
    posts_per_week?: number;
    schedule_days?: DayOfWeekName[];
    schedule_time?: string;
    timezone?: string;
    platforms?: Platform[];
    categories?: ThematicCategoryId[];
    social_account_mapping?: Record<string, number>;
    auto_publish_on_approve?: boolean;
    creativity_level?: number;
    post_length?: PostLength;
    include_images?: boolean;
    include_hashtags?: boolean;
    include_emoji?: boolean;
    text_provider?: string;
    image_provider?: string;
    image_style?: ImageStyle;
}

export interface BackendAutopilotConfigUpdate {
    is_active?: boolean;
    is_paused?: boolean;
    posts_per_week?: number;
    schedule_days?: DayOfWeekName[];
    schedule_time?: string;
    timezone?: string;
    platforms?: Platform[];
    categories?: ThematicCategoryId[];
    social_account_mapping?: Record<string, number>;
    auto_publish_on_approve?: boolean;
    creativity_level?: number;
    post_length?: PostLength;
    include_images?: boolean;
    include_hashtags?: boolean;
    include_emoji?: boolean;
    text_provider?: string;
    image_provider?: string;
    image_style?: ImageStyle;
}

export interface BackendQueueItem {
    id: number;
    config_id: number;
    user_id: number;
    brand_id: number;

    // Content
    platform: Platform;
    content: string;
    image_url: string | null;
    hashtags: string[];
    category: string | null;

    // Status
    status: BackendQueueStatus;
    scheduled_for: string;
    published_at: string | null;

    // AI info
    topic_used: string | null;
    text_provider_used: string | null;
    image_provider_used: string | null;
    generation_params: Record<string, unknown>;

    // Pola publikacji
    social_account_id: number | null;
    platform_post_id: string | null;
    platform_post_url: string | null;
    publish_error: string | null;
    publish_attempts: number;

    // Feedback
    user_notes: string | null;
    edit_count: number;

    // Timestamps
    created_at: string;
    updated_at: string;
}

export interface BackendQueueItemUpdate {
    content?: string;
    image_url?: string;
    hashtags?: string[];
    status?: BackendQueueStatus;
    scheduled_for?: string;
    user_notes?: string;
    social_account_id?: number;
}

export interface BackendQueueStats {
    pending_count: number;
    approved_count: number;
    scheduled_count: number;
    published_today: number;
    published_this_week: number;
    failed_count: number;
    rejection_rate: number;
    average_edit_count: number;
}

export interface BackendAutopilotDashboard {
    config: BackendAutopilotConfig | null;
    queue_stats: BackendQueueStats;
    pending_items: BackendQueueItem[];
    upcoming_items: BackendQueueItem[];
    recent_published: BackendQueueItem[];
    failed_items: BackendQueueItem[];
    health_score: number;
    streak_days: number;
    next_post_at: string | null;
    recommendations: string[];
    social_accounts_status: Record<string, string>;
}

export interface BackendBulkActionRequest {
    item_ids: number[];
    action: 'approve' | 'reject' | 'delete' | 'publish';
}

export interface BackendBulkActionResponse {
    success_count: number;
    fail_count: number;
    action: string;
}

// ==================== PUBLISH TYPES ====================

export interface PublishRequest {
    social_account_id?: number;
    publish_now?: boolean;
}

export interface PublishResponse {
    success: boolean;
    item_id: number;
    platform: string;
    platform_post_id?: string;
    platform_post_url?: string;
    error?: string;
    published_at?: string;
    requires_manual?: boolean;  // ← DODAJ TO
}

export interface ManualPublishData {
    item_id: number;
    content: string;
    full_content: string;
    hashtags: string[];
    hashtags_string: string;
    image_url: string | null;
    platform: Platform;
    platform_link: string;
    instructions: string;
    share_url?: string;
}

// ==================== AUTOPILOT CONFIG (UI) ====================

export type AutopilotStatus = 'active' | 'paused' | 'inactive' | 'error';

export interface AutopilotConfig {
    id: string;
    brandId: string;
    brand?: Brand;
    name: string;
    status: AutopilotStatus;
    platforms: Platform[];
    schedule: ScheduleConfig;
    contentMix: ContentMix[];
    topics: TopicSuggestion[];
    generationSettings: GenerationSettings;
    createdAt: string;
    updatedAt: string;
    lastRunAt?: string;
    nextRunAt?: string;
    totalGenerated: number;
    totalPublished: number;
    requiresApproval: boolean;
    autoApproveAfterHours?: number;
    notifyOnGeneration: boolean;
    notifyOnPublish: boolean;
    notifyOnError: boolean;
}

// ==================== STATISTICS ====================

export interface PlatformStat {
    platform: Platform;
    postsPublished: number;
    avgEngagement: number;
    topPerformingType: ContentType;
    lastPublished?: string;
}

export interface AutopilotStats {
    configId: string;
    totalGenerated: number;
    totalPublished: number;
    totalPending: number;
    totalApproved: number;
    totalRejected: number;
    totalFailed: number;
    avgApprovalTime: number;
    avgEngagementRate: number;
    platformStats: PlatformStat[];
    contentTypePerformance: Record<ContentType, number>;
    lastRunAt?: string;
    nextRunAt?: string;
    streak: number;
    healthScore: number;
}

// ==================== ACTIVITY LOG ====================

export type ActivityType =
    | 'config_created'
    | 'config_updated'
    | 'autopilot_started'
    | 'autopilot_paused'
    | 'generation_started'
    | 'generation_completed'
    | 'generation_failed'
    | 'post_approved'
    | 'post_rejected'
    | 'post_published'
    | 'post_failed'
    | 'schedule_changed';

export interface ActivityLogEntry {
    id: string;
    autopilotId: string;
    type: ActivityType;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    postId?: string;
}

// ==================== FORM/UI TYPES ====================

export interface AutopilotFormData {
    name: string;
    brandId: string;
    platforms: Platform[];
    frequency: FrequencyType;
    postsPerPeriod: number;
    selectedDays: DayOfWeek[];
    timeSlots: string[];
    requiresApproval: boolean;
    generateImages: boolean;
    textProvider: AIProvider;
    imageProvider: ImageProvider;
    creativityLevel: number;
}

export interface QuickSchedulePreset {
    id: string;
    name: string;
    description: string;
    icon: string;
    schedule: Partial<ScheduleConfig>;
}

// ==================== THEMATIC CATEGORIES ====================

export type ThematicCategoryId =
    | 'fitness'
    | 'health'
    | 'beauty'
    | 'cooking'
    | 'business'
    | 'technology'
    | 'travel'
    | 'lifestyle'
    | 'education'
    | 'entertainment'
    | 'nature'
    | 'diet';

export interface ThematicCategory {
    id: string;
    name: string;
    icon: string;
    color: string;
    keywords: string[];
}

export interface SelectedCategory {
    categoryId: string;
    percentage: number;
}

// ==================== GENERATE QUEUE TYPES ====================

export interface GenerateQueueRequest {
    count?: number;
    topics?: string[];
    platforms?: string[];
}

export interface GenerateQueueResponse {
    success: boolean;
    generated_count: number;
    failed_count: number;
    items: BackendQueueItem[];
    errors: string[];
}

// ==================== CONSTANTS ====================

export const DAYS_OF_WEEK: { value: DayOfWeek; label: string; short: string; name: DayOfWeekName }[] = [
    { value: 0, label: 'Niedziela', short: 'Nd', name: 'sunday' },
    { value: 1, label: 'Poniedziałek', short: 'Pn', name: 'monday' },
    { value: 2, label: 'Wtorek', short: 'Wt', name: 'tuesday' },
    { value: 3, label: 'Środa', short: 'Śr', name: 'wednesday' },
    { value: 4, label: 'Czwartek', short: 'Cz', name: 'thursday' },
    { value: 5, label: 'Piątek', short: 'Pt', name: 'friday' },
    { value: 6, label: 'Sobota', short: 'Sb', name: 'saturday' },
];

export const CONTENT_TYPE_LABELS: Record<ContentType, { label: string; icon: string; color: string }> = {
    promotional: { label: 'Promocyjny', icon: 'Megaphone', color: '#F59E0B' },
    educational: { label: 'Edukacyjny', icon: 'GraduationCap', color: '#3B82F6' },
    engagement: { label: 'Angażujący', icon: 'MessageCircle', color: '#10B981' },
    'behind-the-scenes': { label: 'Za kulisami', icon: 'Camera', color: '#8B5CF6' },
    'user-generated': { label: 'Od użytkowników', icon: 'Users', color: '#EC4899' },
    news: { label: 'Aktualności', icon: 'Newspaper', color: '#6366F1' },
    tips: { label: 'Porady', icon: 'Lightbulb', color: '#14B8A6' },
    quote: { label: 'Cytat', icon: 'Quote', color: '#F97316' },
    poll: { label: 'Ankieta', icon: 'BarChart3', color: '#06B6D4' },
    announcement: { label: 'Ogłoszenie', icon: 'Bell', color: '#EF4444' },
};

export const QUICK_SCHEDULE_PRESETS: QuickSchedulePreset[] = [
    {
        id: 'starter',
        name: 'Starter',
        description: '3 posty tygodniowo (Pn, Śr, Pt)',
        icon: 'Zap',
        schedule: {
            frequency: 'weekly',
            postsPerPeriod: 3,
            selectedDays: [1, 3, 5],
            timeSlots: [{ id: '1', time: '10:00', label: 'Poranek' }],
        },
    },
    {
        id: 'growth',
        name: 'Growth',
        description: '5 postów tygodniowo (Pn-Pt)',
        icon: 'TrendingUp',
        schedule: {
            frequency: 'weekly',
            postsPerPeriod: 5,
            selectedDays: [1, 2, 3, 4, 5],
            timeSlots: [{ id: '1', time: '09:00', label: 'Poranek' }],
        },
    },
    {
        id: 'aggressive',
        name: 'Aggressive',
        description: '2 posty dziennie, 7 dni w tygodniu',
        icon: 'Rocket',
        schedule: {
            frequency: 'daily',
            postsPerPeriod: 2,
            selectedDays: [0, 1, 2, 3, 4, 5, 6],
            timeSlots: [
                { id: '1', time: '09:00', label: 'Poranek' },
                { id: '2', time: '18:00', label: 'Wieczór' },
            ],
        },
    },
    {
        id: 'weekend',
        name: 'Weekend Focus',
        description: '4 posty w weekendy (Sb, Nd)',
        icon: 'Sun',
        schedule: {
            frequency: 'weekly',
            postsPerPeriod: 4,
            selectedDays: [0, 6],
            timeSlots: [
                { id: '1', time: '11:00', label: 'Przed południem' },
                { id: '2', time: '19:00', label: 'Wieczór' },
            ],
        },
    },
];

export const STATUS_CONFIG: Record<QueueStatus, { label: string; color: string; bgColor: string }> = {
    generating: { label: 'Generowanie...', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.1)' },
    pending_review: { label: 'Do przeglądu', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)' },
    approved: { label: 'Zatwierdzony', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' },
    scheduled: { label: 'Zaplanowany', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.1)' },
    publishing: { label: 'Publikowanie...', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.1)' },
    published: { label: 'Opublikowany', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' },
    failed: { label: 'Błąd', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
    rejected: { label: 'Odrzucony', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.1)' },
};

export const BACKEND_STATUS_MAP: Record<BackendQueueStatus, QueueStatus> = {
    pending: 'pending_review',
    approved: 'approved',
    rejected: 'rejected',
    published: 'published',
    failed: 'failed',
    scheduled: 'scheduled',
};

export const AUTOPILOT_STATUS_CONFIG: Record<AutopilotStatus, { label: string; color: string; icon: string }> = {
    active: { label: 'Aktywny', color: '#10B981', icon: 'Play' },
    paused: { label: 'Wstrzymany', color: '#F59E0B', icon: 'Pause' },
    inactive: { label: 'Nieaktywny', color: '#6B7280', icon: 'Square' },
    error: { label: 'Błąd', color: '#EF4444', icon: 'AlertCircle' },
};

export const THEMATIC_CATEGORIES: ThematicCategory[] = [
    // Lifestyle & Food
    { id: 'kitchen', name: 'Kuchnia', icon: '🍳', color: '#F59E0B', keywords: ['przepisy', 'gotowanie', 'jedzenie'] },
    { id: 'cooking', name: 'Gotowanie', icon: '👨‍🍳', color: '#EF4444', keywords: ['przepis', 'danie', 'posiłek'] },
    { id: 'baking', name: 'Pieczenie', icon: '🧁', color: '#FB7185', keywords: ['ciasta', 'cukiernictwo', 'wypieki'] },
    { id: 'coffee', name: 'Kawa', icon: '☕', color: '#92400E', keywords: ['barista', 'kawiarnia', 'espresso'] },
    { id: 'wine', name: 'Wino', icon: '🍷', color: '#881337', keywords: ['winnica', 'degustacja', 'sommelier'] },
    { id: 'vegan', name: 'Wegańskie', icon: '🥬', color: '#22C55E', keywords: ['roślinne', 'vege', 'bez mięsa'] },

    // Health & Wellness
    { id: 'health', name: 'Zdrowie', icon: '💚', color: '#10B981', keywords: ['wellness', 'zdrowy styl życia'] },
    { id: 'diet', name: 'Dieta', icon: '🥗', color: '#84CC16', keywords: ['odżywianie', 'kalorie', 'przepisy fit'] },
    { id: 'mental-health', name: 'Zdrowie psychiczne', icon: '🧠', color: '#8B5CF6', keywords: ['mindfulness', 'stres'] },

    // Beauty & Fashion
    { id: 'beauty', name: 'Uroda', icon: '💄', color: '#EC4899', keywords: ['makijaż', 'pielęgnacja'] },
    { id: 'cosmetics', name: 'Kosmetyki', icon: '🧴', color: '#F472B6', keywords: ['skincare', 'beauty', 'krem'] },
    { id: 'fashion', name: 'Moda', icon: '👗', color: '#F43F5E', keywords: ['style', 'ubrania', 'trendy'] },
    { id: 'hair', name: 'Włosy', icon: '💇', color: '#A855F7', keywords: ['fryzury', 'pielęgnacja włosów'] },

    // Fitness & Sport
    { id: 'training', name: 'Trening', icon: '💪', color: '#3B82F6', keywords: ['ćwiczenia', 'siłownia'] },
    { id: 'exercises', name: 'Ćwiczenia', icon: '🏋️', color: '#6366F1', keywords: ['workout', 'fitness'] },
    { id: 'sport', name: 'Sport', icon: '⚽', color: '#14B8A6', keywords: ['aktywność', 'zawody'] },
    { id: 'yoga', name: 'Joga', icon: '🧘', color: '#A855F7', keywords: ['medytacja', 'mindfulness'] },
    { id: 'running', name: 'Bieganie', icon: '🏃', color: '#F97316', keywords: ['jogging', 'maraton'] },
    { id: 'cycling', name: 'Kolarstwo', icon: '🚴', color: '#0EA5E9', keywords: ['rower', 'trasy rowerowe'] },
    { id: 'fitness', name: 'Fitness', icon: '🏃‍♂️', color: '#3B82F6', keywords: ['trening', 'forma'] },

    // Nature & Outdoors
    { id: 'nature', name: 'Przyroda', icon: '🌿', color: '#22C55E', keywords: ['natura', 'ekologia'] },
    { id: 'animals', name: 'Zwierzęta', icon: '🐾', color: '#A78BFA', keywords: ['pets', 'pupile', 'psy', 'koty'] },
    { id: 'gardening', name: 'Ogrodnictwo', icon: '🌱', color: '#16A34A', keywords: ['rośliny', 'ogród'] },
    { id: 'travel', name: 'Podróże', icon: '✈️', color: '#0EA5E9', keywords: ['wakacje', 'turystyka'] },
    { id: 'hiking', name: 'Turystyka górska', icon: '🏔️', color: '#64748B', keywords: ['góry', 'szlaki'] },

    // Tech & Business
    { id: 'technology', name: 'Technologia', icon: '💻', color: '#6366F1', keywords: ['tech', 'gadżety', 'AI'] },
    { id: 'business', name: 'Biznes', icon: '💼', color: '#1E40AF', keywords: ['przedsiębiorczość', 'startup'] },
    { id: 'marketing', name: 'Marketing', icon: '📊', color: '#7C3AED', keywords: ['social media', 'reklama'] },
    { id: 'finance', name: 'Finanse', icon: '💰', color: '#059669', keywords: ['pieniądze', 'inwestycje'] },
    { id: 'ecommerce', name: 'E-commerce', icon: '🛒', color: '#F59E0B', keywords: ['sklep', 'sprzedaż'] },

    // Creative
    { id: 'art', name: 'Sztuka', icon: '🎨', color: '#E11D48', keywords: ['kreatywność', 'design'] },
    { id: 'music', name: 'Muzyka', icon: '🎵', color: '#DB2777', keywords: ['piosenki', 'koncerty'] },
    { id: 'photography', name: 'Fotografia', icon: '📸', color: '#7C3AED', keywords: ['zdjęcia', 'foto'] },
    { id: 'handmade', name: 'Rękodzieło', icon: '🧶', color: '#F97316', keywords: ['DIY', 'handmade'] },

    // Entertainment
    { id: 'books', name: 'Książki', icon: '📚', color: '#8B5CF6', keywords: ['literatura', 'czytanie'] },
    { id: 'movies', name: 'Film', icon: '🎬', color: '#EF4444', keywords: ['kino', 'seriale'] },
    { id: 'gaming', name: 'Gry', icon: '🎮', color: '#10B981', keywords: ['gaming', 'esport'] },
    { id: 'entertainment', name: 'Rozrywka', icon: '🎭', color: '#EC4899', keywords: ['zabawa', 'imprezy'] },

    // Home & Family
    { id: 'home', name: 'Dom', icon: '🏠', color: '#F59E0B', keywords: ['wnętrza', 'dekoracje'] },
    { id: 'diy', name: 'DIY', icon: '🔧', color: '#F97316', keywords: ['zrób to sam', 'naprawy'] },
    { id: 'parenting', name: 'Rodzicielstwo', icon: '👶', color: '#EC4899', keywords: ['dzieci', 'rodzina'] },
    { id: 'education', name: 'Edukacja', icon: '📖', color: '#3B82F6', keywords: ['nauka', 'rozwój'] },
    { id: 'kids', name: 'Dzieci', icon: '🧒', color: '#F472B6', keywords: ['zabawki', 'zabawy'] },
    { id: 'lifestyle', name: 'Lifestyle', icon: '✨', color: '#A855F7', keywords: ['styl życia', 'inspiracje'] },

    // Motivation & Personal Development
    { id: 'motivation', name: 'Motywacja', icon: '🔥', color: '#EF4444', keywords: ['inspiracja', 'rozwój osobisty'] },
    { id: 'quotes', name: 'Cytaty', icon: '💬', color: '#8B5CF6', keywords: ['mądrości', 'sentencje'] },
    { id: 'productivity', name: 'Produktywność', icon: '⚡', color: '#F59E0B', keywords: ['efektywność', 'organizacja'] },
    { id: 'career', name: 'Kariera', icon: '📈', color: '#3B82F6', keywords: ['praca', 'rozwój zawodowy'] },

    // Events & Seasons
    { id: 'holidays', name: 'Święta', icon: '🎄', color: '#EF4444', keywords: ['Boże Narodzenie', 'Wielkanoc'] },
    { id: 'events', name: 'Wydarzenia', icon: '🎉', color: '#A855F7', keywords: ['imprezy', 'eventy'] },
    { id: 'seasons', name: 'Pory roku', icon: '🍂', color: '#F97316', keywords: ['wiosna', 'lato', 'jesień', 'zima'] },

    // Local & Community
    { id: 'local', name: 'Lokalne', icon: '📍', color: '#14B8A6', keywords: ['miasto', 'okolica'] },
    { id: 'community', name: 'Społeczność', icon: '🤝', color: '#6366F1', keywords: ['ludzie', 'networking'] },
];

export const AI_PROVIDER_LABELS: Record<AIProvider, { name: string; description: string; icon: string; speed: string }> = {
    gemini: { name: 'Gemini 2.5', description: 'Google AI - kreatywny i dokładny', icon: '✨', speed: 'Szybki' },
    groq: { name: 'Groq (Llama 3.3)', description: 'Ultra szybki, świetny do krótkich postów', icon: '⚡', speed: 'Błyskawiczny' },
    auto: { name: 'Auto', description: 'System sam wybierze najlepszy', icon: '🤖', speed: 'Zależy' },
};

export const IMAGE_PROVIDER_LABELS: Record<ImageProvider, { name: string; description: string; icon: string; quality: string }> = {
    pollinations: { name: 'Pollinations', description: 'Darmowy, dobra jakość', icon: '🌸', quality: 'Dobra' },
    huggingface: { name: 'HuggingFace FLUX', description: 'Najlepsza jakość obrazów', icon: '🤗', quality: 'Świetna' },
    none: { name: 'Bez obrazów', description: 'Tylko tekst', icon: '📝', quality: '-' },
};

export const CREATIVITY_LEVEL_LABELS: { value: number; label: string; description: string; icon: string }[] = [
    { value: 20, label: 'Bezpieczny', description: 'Sprawdzone, klasyczne podejście', icon: '🛡️' },
    { value: 40, label: 'Zbalansowany', description: 'Złoty środek', icon: '⚖️' },
    { value: 60, label: 'Kreatywny', description: 'Więcej unikalnych pomysłów', icon: '✨' },
    { value: 80, label: 'Bardzo kreatywny', description: 'Odważne i świeże treści', icon: '🎨' },
    { value: 100, label: 'Szalony', description: 'Eksperymentalne, nieszablonowe', icon: '🚀' },
];

export const POST_LENGTH_PRESETS: { id: PostLength; label: string; minLength: number; maxLength: number; description: string }[] = [
    { id: 'short', label: 'Krótki', minLength: 50, maxLength: 150, description: '50-150 znaków' },
    { id: 'medium', label: 'Średni', minLength: 150, maxLength: 300, description: '150-300 znaków' },
    { id: 'long', label: 'Długi', minLength: 300, maxLength: 500, description: '300-500 znaków' },
];

export interface TimeSlotSuggestion {
    time: string;
    label: string;
    icon: string;
    description: string;
    color: string;
}

export const TIME_SLOT_SUGGESTIONS: TimeSlotSuggestion[] = [
    { time: '07:00', label: 'Wczesny poranek', icon: '🌅', description: 'Przed pracą', color: '#F59E0B' },
    { time: '09:00', label: 'Poranek', icon: '☀️', description: 'Początek dnia pracy', color: '#F97316' },
    { time: '12:00', label: 'Południe', icon: '🌞', description: 'Przerwa obiadowa', color: '#EAB308' },
    { time: '15:00', label: 'Popołudnie', icon: '🌤️', description: 'Po lunchu', color: '#F59E0B' },
    { time: '18:00', label: 'Wieczór', icon: '🌆', description: 'Po pracy', color: '#F97316' },
    { time: '21:00', label: 'Późny wieczór', icon: '🌙', description: 'Relaks przed snem', color: '#8B5CF6' },
];

// ==================== HELPER FUNCTIONS ====================

export function mapBackendConfigToUI(config: BackendAutopilotConfig): Partial<AutopilotConfig> {
    return {
        id: String(config.id),
        brandId: String(config.brand_id),
        status: config.is_active
            ? (config.is_paused ? 'paused' : 'active')
            : 'inactive',
        platforms: config.platforms,
        totalGenerated: config.total_generated,
        totalPublished: config.total_published,
        createdAt: config.created_at,
        updatedAt: config.updated_at,
        lastRunAt: config.last_generation_at || undefined,
        nextRunAt: config.next_generation_at || undefined,
    };
}

export function mapBackendQueueItemToUI(item: BackendQueueItem): Partial<QueuedPost> {
    return {
        id: String(item.id),
        autopilotId: String(item.config_id),
        brandId: String(item.brand_id),
        content: item.content,
        platforms: [item.platform],
        scheduledFor: item.scheduled_for,
        status: BACKEND_STATUS_MAP[item.status] || 'pending_review',
        generatedAt: item.created_at,
        imageUrl: item.image_url || undefined,
        topic: item.topic_used || undefined,
        publishedAt: item.published_at || undefined,
        reviewNotes: item.user_notes || undefined,
    };
}

export function dayNumberToName(day: DayOfWeek): DayOfWeekName {
    const dayInfo = DAYS_OF_WEEK.find(d => d.value === day);
    return dayInfo?.name || 'monday';
}

export function dayNameToNumber(name: DayOfWeekName): DayOfWeek {
    const dayInfo = DAYS_OF_WEEK.find(d => d.name === name);
    return dayInfo?.value ?? 1;
}