// src/types/brand.ts
/**
 * Typy dla Brand i Styl pisania (dawniej Brand Voice DNA).
 *
 * Frontend używa camelCase.
 * Transformacja z/do API (snake_case) przez funkcje transform*.
 *
 * TERMINOLOGIA:
 * - "Voice DNA" (wewnętrzna nazwa) → "Styl pisania" (UI)
 * - "Głos marki" → "Charakter treści" (UI)
 * - "Personality Traits" → "Charakter treści" (UI)
 */

// ============================================================
// STYL PISANIA TYPES (dawniej VOICE DNA)
// ============================================================

export type PersonalityTrait =
    | 'innovative'
    | 'traditional'
    | 'friendly'
    | 'professional'
    | 'bold'
    | 'subtle'
    | 'luxurious'
    | 'accessible'
    | 'playful'
    | 'serious'
    | 'trustworthy'
    | 'rebellious'
    | 'caring'
    | 'expert'
    | 'minimalist'
    | 'expressive';

export type CommunicationStyle =
    | 'informative'
    | 'inspirational'
    | 'educational'
    | 'entertaining'
    | 'conversational'
    | 'storytelling';

export type EmojiUsage = 'none' | 'minimal' | 'moderate' | 'frequent';

/**
 * Styl pisania marki.
 * Wewnętrznie nazywany VoiceDNA dla kompatybilności z backendem.
 * W UI wyświetlany jako "Styl pisania".
 */
export interface BrandVoiceDNA {
    toneFormality: number;
    toneEnergy: number;
    toneHumor: number;
    toneEmotion: number;
    personalityTraits: PersonalityTrait[];
    communicationStyle: CommunicationStyle;
    keywords: string[];
    hashtags: string[];
    forbiddenWords: string[];
    samplePosts: string[];
    emojiUsage: EmojiUsage;
    preferredEmojis: string[];
}

// Alias dla czytelności - używaj w nowym kodzie
export type WritingStyle = BrandVoiceDNA;

// ============================================================
// BRAND TYPE (FRONTEND - camelCase)
// ============================================================

export interface Brand {
    id: string;
    name: string;
    description?: string;
    logoUrl?: string;
    primaryColor: string;
    secondaryColor?: string;
    industry?: string;
    targetAudience?: string;
    voiceDNA: BrandVoiceDNA;  // Wewnętrznie voiceDNA, w UI "Styl pisania"
    isActive: boolean;
    isDefault: boolean;
    postsCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface BrandFormData {
    name: string;
    description?: string;
    logoUrl?: string;
    primaryColor: string;
    secondaryColor?: string;
    industry?: string;
    targetAudience?: string;
    voiceDNA: Partial<BrandVoiceDNA>;
}

// ============================================================
// API TYPES (snake_case - jak przychodzi z backendu)
// ============================================================

export interface ApiBrandVoiceDNA {
    tone_formality: number;
    tone_energy: number;
    tone_humor: number;
    tone_emotion: number;
    personality_traits: string[];
    communication_style: string;
    keywords: string[];
    hashtags: string[];
    forbidden_words: string[];
    sample_posts: string[];
    emoji_usage: string;
    preferred_emojis: string[];
}

export interface ApiBrand {
    id: number;
    name: string;
    description?: string;
    logo_url?: string;
    primary_color: string;
    secondary_color?: string;
    industry?: string;
    target_audience?: string;
    voice_dna: ApiBrandVoiceDNA;
    is_active: boolean;
    is_default: boolean;
    posts_count: number;
    created_at: string;
    updated_at: string;
}

export interface ApiBrandsListResponse {
    brands: ApiBrand[];
    total: number;
}

export interface ApiAnalyzeVoiceResponse {
    voice_dna: ApiBrandVoiceDNA;
    analysis: {
        tone_breakdown: Record<string, number>;
        common_phrases: string[];
        vocabulary_level: string;
        emoji_usage_detected: string;
        hashtag_style: string;
    };
}

// ============================================================
// TRANSFORMERS (API ↔ Frontend)
// ============================================================

export function transformApiVoiceDNAToFrontend(api: ApiBrandVoiceDNA | null | undefined): BrandVoiceDNA {
    if (!api) return DEFAULT_VOICE_DNA;

    return {
        toneFormality: api.tone_formality ?? 50,
        toneEnergy: api.tone_energy ?? 50,
        toneHumor: api.tone_humor ?? 30,
        toneEmotion: api.tone_emotion ?? 50,
        personalityTraits: (api.personality_traits || ['professional', 'friendly']) as PersonalityTrait[],
        communicationStyle: (api.communication_style || 'informative') as CommunicationStyle,
        keywords: api.keywords || [],
        hashtags: api.hashtags || [],
        forbiddenWords: api.forbidden_words || [],
        samplePosts: api.sample_posts || [],
        emojiUsage: (api.emoji_usage || 'moderate') as EmojiUsage,
        preferredEmojis: api.preferred_emojis || [],
    };
}

export function transformApiBrandToFrontend(api: ApiBrand): Brand {
    return {
        id: String(api.id),
        name: api.name,
        description: api.description,
        logoUrl: api.logo_url,
        primaryColor: api.primary_color || '#8B5CF6',
        secondaryColor: api.secondary_color,
        industry: api.industry,
        targetAudience: api.target_audience,
        voiceDNA: transformApiVoiceDNAToFrontend(api.voice_dna),
        isActive: api.is_active,
        isDefault: api.is_default,
        postsCount: api.posts_count || 0,
        createdAt: new Date(api.created_at),
        updatedAt: new Date(api.updated_at),
    };
}

export function transformVoiceDNAToApi(voiceDNA: Partial<BrandVoiceDNA>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if (voiceDNA.toneFormality !== undefined) result.tone_formality = voiceDNA.toneFormality;
    if (voiceDNA.toneEnergy !== undefined) result.tone_energy = voiceDNA.toneEnergy;
    if (voiceDNA.toneHumor !== undefined) result.tone_humor = voiceDNA.toneHumor;
    if (voiceDNA.toneEmotion !== undefined) result.tone_emotion = voiceDNA.toneEmotion;
    if (voiceDNA.personalityTraits) result.personality_traits = voiceDNA.personalityTraits;
    if (voiceDNA.communicationStyle) result.communication_style = voiceDNA.communicationStyle;
    if (voiceDNA.keywords) result.keywords = voiceDNA.keywords;
    if (voiceDNA.hashtags) result.hashtags = voiceDNA.hashtags;
    if (voiceDNA.forbiddenWords) result.forbidden_words = voiceDNA.forbiddenWords;
    if (voiceDNA.samplePosts) result.sample_posts = voiceDNA.samplePosts;
    if (voiceDNA.emojiUsage) result.emoji_usage = voiceDNA.emojiUsage;
    if (voiceDNA.preferredEmojis) result.preferred_emojis = voiceDNA.preferredEmojis;

    return result;
}

export function transformBrandToApi(brand: Partial<Brand> & { name: string }): Record<string, unknown> {
    return {
        name: brand.name,
        description: brand.description,
        logo_url: brand.logoUrl,
        primary_color: brand.primaryColor || '#8B5CF6',
        secondary_color: brand.secondaryColor,
        industry: brand.industry,
        target_audience: brand.targetAudience,
        voice_dna: brand.voiceDNA ? transformVoiceDNAToApi(brand.voiceDNA) : undefined,
    };
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Cechy charakteru treści (dawniej Personality Traits).
 * W UI wyświetlane jako "Charakter treści".
 */
export const PERSONALITY_TRAITS: Record<PersonalityTrait, { label: string; icon: string }> = {
    innovative: { label: 'Innowacyjny', icon: '💡' },
    traditional: { label: 'Tradycyjny', icon: '🏛️' },
    friendly: { label: 'Przyjazny', icon: '😊' },
    professional: { label: 'Profesjonalny', icon: '💼' },
    bold: { label: 'Odważny', icon: '🔥' },
    subtle: { label: 'Subtelny', icon: '🌸' },
    luxurious: { label: 'Luksusowy', icon: '✨' },
    accessible: { label: 'Przystępny', icon: '🤝' },
    playful: { label: 'Zabawny', icon: '🎮' },
    serious: { label: 'Poważny', icon: '📊' },
    trustworthy: { label: 'Godny zaufania', icon: '🛡️' },
    rebellious: { label: 'Buntowniczy', icon: '⚡' },
    caring: { label: 'Troskliwy', icon: '💚' },
    expert: { label: 'Ekspert', icon: '🎓' },
    minimalist: { label: 'Minimalistyczny', icon: '◻️' },
    expressive: { label: 'Ekspresyjny', icon: '🎨' },
};

export const COMMUNICATION_STYLES: Record<CommunicationStyle, { label: string; description: string }> = {
    informative: {
        label: 'Informacyjny',
        description: 'Przekazuje fakty i dane w jasny sposób'
    },
    inspirational: {
        label: 'Inspirujący',
        description: 'Motywuje i zachęca do działania'
    },
    educational: {
        label: 'Edukacyjny',
        description: 'Uczy i wyjaśnia złożone tematy'
    },
    entertaining: {
        label: 'Rozrywkowy',
        description: 'Bawi i angażuje przez zabawę'
    },
    conversational: {
        label: 'Konwersacyjny',
        description: 'Prowadzi dialog z odbiorcą'
    },
    storytelling: {
        label: 'Narracyjny',
        description: 'Opowiada historie i buduje narrację'
    },
};

export const INDUSTRIES = [
    'Technologia',
    'E-commerce',
    'Usługi',
    'Edukacja',
    'Zdrowie & Fitness',
    'Moda & Uroda',
    'Jedzenie & Gastronomia',
    'Finanse',
    'Nieruchomości',
    'Rozrywka',
    'Podróże',
    'Sport',
    'Sztuka & Design',
    'Non-profit',
    'Inne',
];

export const DEFAULT_VOICE_DNA: BrandVoiceDNA = {
    toneFormality: 50,
    toneEnergy: 50,
    toneHumor: 30,
    toneEmotion: 50,
    personalityTraits: ['professional', 'friendly'],
    communicationStyle: 'informative',
    keywords: [],
    hashtags: [],
    forbiddenWords: [],
    samplePosts: [],
    emojiUsage: 'moderate',
    preferredEmojis: [],
};

// Alias dla nowej terminologii
export const DEFAULT_WRITING_STYLE = DEFAULT_VOICE_DNA;