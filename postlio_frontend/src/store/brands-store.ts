// src/store/brands-store.ts
/**
 * Store Zustand dla marek (Brand Voice DNA)
 */
import { create } from 'zustand';
import { Brand, DEFAULT_VOICE_DNA } from '@/types/brand';
import type { UpdateBrandRequest } from '@/lib/api/brands';

interface BrandsStore {
    // State
    brands: Brand[];
    selectedBrand: Brand | null;
    isLoading: boolean;
    isFormOpen: boolean;
    editingBrandId: string | null;

    // Actions
    setBrands: (brands: Brand[]) => void;
    addBrand: (brand: Brand) => void;
    updateBrand: (id: string, data: Partial<Brand> | UpdateBrandRequest) => void;
    deleteBrand: (id: string) => void;
    selectBrand: (brand: Brand | null) => void;
    setSelectedBrand: (brand: Brand | null) => void;
    setLoading: (loading: boolean) => void;
    openForm: (brandId?: string) => void;
    closeForm: () => void;

    // Helpers
    getBrandById: (id: string) => Brand | undefined;
    getActiveBrands: () => Brand[];
    getDefaultBrand: () => Brand | undefined;
}

// Mock data - będzie zastąpione danymi z API
const mockBrands: Brand[] = [
    {
        id: '1',
        name: 'TechStartup Pro',
        description: 'Innowacyjna firma technologiczna',
        primaryColor: '#8B5CF6',
        secondaryColor: '#C4B5FD',
        industry: 'Technologia',
        targetAudience: 'Młodzi profesjonaliści 25-40',
        voiceDNA: {
            ...DEFAULT_VOICE_DNA,
            toneFormality: 40,
            toneEnergy: 75,
            toneHumor: 45,
            toneEmotion: 60,
            personalityTraits: ['innovative', 'bold', 'friendly'],
            communicationStyle: 'inspirational',
            keywords: ['innowacja', 'przyszłość', 'technologia', 'rozwój'],
            hashtags: ['#tech', '#startup', '#innovation', '#future'],
            emojiUsage: 'moderate',
            preferredEmojis: ['🚀', '💡', '⚡', '🔥'],
        },
        isActive: true,
        isDefault: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-03-10'),
        postsCount: 47,
    },
    {
        id: '2',
        name: 'Elegancja & Styl',
        description: 'Butik z luksusową modą',
        primaryColor: '#D4AF37',
        secondaryColor: '#F5E6CC',
        industry: 'Moda & Uroda',
        targetAudience: 'Kobiety 30-55, wysokie dochody',
        voiceDNA: {
            ...DEFAULT_VOICE_DNA,
            toneFormality: 70,
            toneEnergy: 40,
            toneHumor: 15,
            toneEmotion: 65,
            personalityTraits: ['luxurious', 'subtle', 'expressive'],
            communicationStyle: 'storytelling',
            keywords: ['elegancja', 'styl', 'jakość', 'wyjątkowość'],
            hashtags: ['#fashion', '#luxury', '#style', '#elegance'],
            emojiUsage: 'minimal',
            preferredEmojis: ['✨', '💎', '🌸'],
        },
        isActive: true,
        isDefault: false,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-03-08'),
        postsCount: 32,
    },
    {
        id: '3',
        name: 'FitLife Coach',
        description: 'Trening personalny i zdrowy styl życia',
        primaryColor: '#10B981',
        secondaryColor: '#A7F3D0',
        industry: 'Zdrowie & Fitness',
        targetAudience: 'Aktywni dorośli 20-45',
        voiceDNA: {
            ...DEFAULT_VOICE_DNA,
            toneFormality: 25,
            toneEnergy: 90,
            toneHumor: 50,
            toneEmotion: 75,
            personalityTraits: ['friendly', 'caring', 'bold', 'expert'],
            communicationStyle: 'inspirational',
            keywords: ['motywacja', 'zdrowie', 'siła', 'zmiana'],
            hashtags: ['#fitness', '#motivation', '#health', '#workout'],
            emojiUsage: 'frequent',
            preferredEmojis: ['💪', '🔥', '🏃', '💚', '⚡'],
        },
        isActive: true,
        isDefault: false,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-03-12'),
        postsCount: 89,
    },
];

export const useBrandsStore = create<BrandsStore>((set, get) => ({
    // Initial state
    brands: mockBrands,
    selectedBrand: null,
    isLoading: false,
    isFormOpen: false,
    editingBrandId: null,

    // Actions
    setBrands: (brands) => set({ brands }),

    addBrand: (brand) => set((state) => ({
        brands: [...state.brands, brand]
    })),

    updateBrand: (id, data) => set((state) => ({
        brands: state.brands.map((brand) =>
            brand.id === id
                ? { ...brand, ...data, updatedAt: new Date() } as Brand
                : brand
        ),
        selectedBrand: state.selectedBrand?.id === id
            ? { ...state.selectedBrand, ...data, updatedAt: new Date() } as Brand
            : state.selectedBrand,
    })),

    deleteBrand: (id) => set((state) => ({
        brands: state.brands.filter((brand) => brand.id !== id),
        selectedBrand: state.selectedBrand?.id === id ? null : state.selectedBrand,
    })),

    selectBrand: (brand) => set({ selectedBrand: brand }),

    setSelectedBrand: (brand) => set({ selectedBrand: brand }),

    setLoading: (loading) => set({ isLoading: loading }),

    openForm: (brandId) => set({
        isFormOpen: true,
        editingBrandId: brandId || null
    }),

    closeForm: () => set({
        isFormOpen: false,
        editingBrandId: null
    }),

    // Helpers
    getBrandById: (id) => get().brands.find((brand) => brand.id === id),

    getActiveBrands: () => get().brands.filter((brand) => brand.isActive),

    getDefaultBrand: () => get().brands.find((brand) => brand.isDefault),
}));

export default useBrandsStore;