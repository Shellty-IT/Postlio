// src/hooks/useBrands.ts
/**
 * Hook do zarządzania markami (Brand Voice DNA)
 * Obsługuje: CRUD brands, analiza voice, upload logo
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { brandsApi } from '@/lib/api';
import { useBrandsStore } from '@/store/brands-store';
import type {
    CreateBrandRequest,
    UpdateBrandRequest,
    AnalyzeBrandVoiceRequest,
    AnalyzeBrandVoiceResponse,
} from '@/lib/api/brands';
import type { Brand } from '@/types/brand';

// ============================================================
// QUERY KEYS
// ============================================================

export const brandsKeys = {
    all: ['brands'] as const,
    lists: () => [...brandsKeys.all, 'list'] as const,
    list: () => [...brandsKeys.lists()] as const,
    details: () => [...brandsKeys.all, 'detail'] as const,
    detail: (id: string) => [...brandsKeys.details(), id] as const,
    analytics: (id: string) => [...brandsKeys.all, 'analytics', id] as const,
};

// ============================================================
// HOOK: useBrands
// ============================================================

/**
 * Pobiera listę wszystkich marek użytkownika
 */
export function useBrands() {
    const { setBrands } = useBrandsStore();

    return useQuery({
        queryKey: brandsKeys.list(),
        queryFn: async () => {
            const response = await brandsApi.getBrands();
            setBrands(response.brands);
            return response;
        },
        staleTime: 5 * 60 * 1000, // 5 minut
    });
}

// ============================================================
// HOOK: useBrand
// ============================================================

/**
 * Pobiera pojedynczą markę
 */
export function useBrand(id: string) {
    return useQuery({
        queryKey: brandsKeys.detail(id),
        queryFn: () => brandsApi.getBrand(id),
        enabled: !!id,
    });
}

// ============================================================
// HOOK: useBrandAnalytics
// ============================================================

/**
 * Pobiera analityki marki
 */
export function useBrandAnalytics(id: string) {
    return useQuery({
        queryKey: brandsKeys.analytics(id),
        queryFn: () => brandsApi.getBrandAnalytics(id),
        enabled: !!id,
        staleTime: 10 * 60 * 1000, // 10 minut
    });
}

// ============================================================
// HOOK: useCreateBrand
// ============================================================

interface UseCreateBrandOptions {
    onSuccess?: (brand: Brand) => void;
}

/**
 * Tworzenie nowej marki
 */
export function useCreateBrand(options?: UseCreateBrandOptions) {
    const queryClient = useQueryClient();
    const { addBrand } = useBrandsStore();

    return useMutation({
        mutationFn: (data: CreateBrandRequest) => brandsApi.createBrand(data),
        onSuccess: (brand) => {
            queryClient.invalidateQueries({ queryKey: brandsKeys.lists() });
            addBrand(brand);

            toast.success('Marka utworzona!', {
                description: `${brand.name} jest gotowa do użycia`,
            });

            options?.onSuccess?.(brand);
        },
        onError: (error: Error) => {
            toast.error('Błąd tworzenia marki', {
                description: error.message || 'Nie udało się utworzyć marki'
            });
        },
    });
}

// ============================================================
// HOOK: useUpdateBrand
// ============================================================

interface UseUpdateBrandOptions {
    onSuccess?: (brand: Brand) => void;
}

/**
 * Aktualizacja marki
 */
export function useUpdateBrand(options?: UseUpdateBrandOptions) {
    const queryClient = useQueryClient();
    const { updateBrand: updateBrandStore } = useBrandsStore();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateBrandRequest }) =>
            brandsApi.updateBrand(id, data),
        onMutate: async ({ id, data }) => {
            // Optimistic update
            await queryClient.cancelQueries({ queryKey: brandsKeys.detail(id) });

            const previousBrand = queryClient.getQueryData<Brand>(brandsKeys.detail(id));

            if (previousBrand) {
                const updated: Brand = {
                    ...previousBrand,
                    ...data,
                    updatedAt: new Date(),
                } as Brand;
                queryClient.setQueryData<Brand>(brandsKeys.detail(id), updated);
                updateBrandStore(id, data);
            }

            return { previousBrand };
        },
        onSuccess: (brand) => {
            queryClient.invalidateQueries({ queryKey: brandsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: brandsKeys.detail(brand.id) });

            toast.success('Marka zaktualizowana!');

            options?.onSuccess?.(brand);
        },
        onError: (error: Error, { id }, context) => {
            // Rollback optimistic update
            if (context?.previousBrand) {
                queryClient.setQueryData(brandsKeys.detail(id), context.previousBrand);
            }

            toast.error('Błąd aktualizacji', {
                description: error.message || 'Nie udało się zaktualizować marki'
            });
        },
    });
}

// ============================================================
// HOOK: useDeleteBrand
// ============================================================

interface UseDeleteBrandOptions {
    onSuccess?: () => void;
}

/**
 * Usuwanie marki
 */
export function useDeleteBrand(options?: UseDeleteBrandOptions) {
    const queryClient = useQueryClient();
    const { deleteBrand: deleteBrandStore } = useBrandsStore();

    return useMutation({
        mutationFn: (id: string) => brandsApi.deleteBrand(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: brandsKeys.lists() });
            queryClient.removeQueries({ queryKey: brandsKeys.detail(id) });
            deleteBrandStore(id);

            toast.success('Marka usunięta');

            options?.onSuccess?.();
        },
        onError: (error: Error) => {
            toast.error('Błąd usuwania', {
                description: error.message || 'Nie udało się usunąć marki'
            });
        },
    });
}

// ============================================================
// HOOK: useUploadBrandLogo
// ============================================================

/**
 * Upload logo marki z progress
 */
export function useUploadBrandLogo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
                         brandId,
                         file,
                         onProgress
                     }: {
            brandId: string;
            file: File;
            onProgress?: (percent: number) => void;
        }) => brandsApi.uploadBrandLogo(brandId, file, onProgress),
        onSuccess: (_, { brandId }) => {
            queryClient.invalidateQueries({ queryKey: brandsKeys.detail(brandId) });
            queryClient.invalidateQueries({ queryKey: brandsKeys.lists() });

            toast.success('Logo zaktualizowane!');
        },
        onError: (error: Error) => {
            toast.error('Błąd przesyłania', {
                description: error.message || 'Nie udało się przesłać logo'
            });
        },
    });
}

// ============================================================
// HOOK: useAnalyzeBrandVoice
// ============================================================

interface UseAnalyzeBrandVoiceOptions {
    onSuccess?: (data: AnalyzeBrandVoiceResponse) => void;
}

/**
 * Analiza Brand Voice na podstawie przykładowych treści
 */
export function useAnalyzeBrandVoice(options?: UseAnalyzeBrandVoiceOptions) {
    return useMutation({
        mutationFn: (data: AnalyzeBrandVoiceRequest) => brandsApi.analyzeBrandVoice(data),
        onSuccess: (data) => {
            toast.success('Analiza zakończona!', {
                description: 'Brand Voice DNA został wygenerowany',
            });

            options?.onSuccess?.(data);
        },
        onError: (error: Error) => {
            toast.error('Błąd analizy', {
                description: error.message || 'Nie udało się przeanalizować głosu marki'
            });
        },
    });
}

// ============================================================
// HOOK: useSetDefaultBrand
// ============================================================

/**
 * Ustawienie marki jako domyślnej
 */
export function useSetDefaultBrand() {
    const queryClient = useQueryClient();
    const { setSelectedBrand } = useBrandsStore();

    return useMutation({
        mutationFn: (id: string) => brandsApi.setDefaultBrand(id),
        onSuccess: (brand) => {
            queryClient.invalidateQueries({ queryKey: brandsKeys.lists() });
            setSelectedBrand(brand);

            toast.success('Domyślna marka zmieniona', {
                description: brand.name,
            });
        },
        onError: (error: Error) => {
            toast.error('Błąd', {
                description: error.message || 'Nie udało się ustawić domyślnej marki'
            });
        },
    });
}

// ============================================================
// HOOK: useBrandsManager (kombinowany)
// ============================================================

/**
 * Główny hook marek - łączy wszystkie funkcjonalności
 */
export function useBrandsManager() {
    const brands = useBrands();
    const createBrand = useCreateBrand();
    const updateBrand = useUpdateBrand();
    const deleteBrand = useDeleteBrand();
    const uploadLogo = useUploadBrandLogo();
    const analyzeVoice = useAnalyzeBrandVoice();
    const setDefault = useSetDefaultBrand();
    const { selectedBrand } = useBrandsStore();

    return {
        // Dane
        brands: brands.data?.brands || [],
        total: brands.data?.total || 0,
        isLoading: brands.isLoading,
        isError: brands.isError,
        error: brands.error,
        refetch: brands.refetch,
        selectedBrand,

        // Mutacje
        create: createBrand.mutate,
        createAsync: createBrand.mutateAsync,
        isCreating: createBrand.isPending,

        update: updateBrand.mutate,
        updateAsync: updateBrand.mutateAsync,
        isUpdating: updateBrand.isPending,

        delete: deleteBrand.mutate,
        deleteAsync: deleteBrand.mutateAsync,
        isDeleting: deleteBrand.isPending,

        uploadLogo: uploadLogo.mutate,
        uploadLogoAsync: uploadLogo.mutateAsync,
        isUploadingLogo: uploadLogo.isPending,

        analyzeVoice: analyzeVoice.mutate,
        analyzeVoiceAsync: analyzeVoice.mutateAsync,
        isAnalyzing: analyzeVoice.isPending,
        analyzedVoice: analyzeVoice.data,

        setDefault: setDefault.mutate,
        isSettingDefault: setDefault.isPending,
    };
}

export default useBrandsManager;