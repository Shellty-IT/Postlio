// src/hooks/useAI.ts
/**
 * Hook do komunikacji z AI API
 *
 * Obsługuje: generowanie tekstu, obrazów, chat, ulepszanie
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { aiApi, ApiException } from '@/lib/api';
import type {
    TextGenerationRequest,
    ImageGenerationRequest,
    ChatRequest,
    ImproveRequest,
    VariationsRequest,
} from '@/lib/api/ai';

// ============================================================
// QUERY KEYS
// ============================================================

export const aiKeys = {
    all: ['ai'] as const,
    providers: () => [...aiKeys.all, 'providers'] as const,
};

// ============================================================
// HOOK: useAIProviders
// ============================================================

/**
 * Pobiera listę dostępnych providerów AI
 */
export function useAIProviders() {
    return useQuery({
        queryKey: aiKeys.providers(),
        queryFn: () => aiApi.getProviders(),
        staleTime: 10 * 60 * 1000, // 10 minut
    });
}

// ============================================================
// HOOK: useGenerateText
// ============================================================

/**
 * Mutacja do generowania tekstu
 */
export function useGenerateText() {
    return useMutation({
        mutationFn: (data: TextGenerationRequest) => aiApi.generateText(data),
        onError: (error: Error) => {
            const message = error instanceof ApiException
                ? error.message
                : 'Nie udało się wygenerować tekstu';
            toast.error('Błąd AI', { description: message });
        },
    });
}

// ============================================================
// HOOK: useGenerateImage
// ============================================================

/**
 * Mutacja do generowania obrazów
 */
export function useGenerateImage() {
    return useMutation({
        mutationFn: (data: ImageGenerationRequest) => aiApi.generateImage(data),
        onError: (error: Error) => {
            const message = error instanceof ApiException
                ? error.message
                : 'Nie udało się wygenerować obrazu';
            toast.error('Błąd AI', { description: message });
        },
    });
}

// ============================================================
// HOOK: useAIChat
// ============================================================

/**
 * Mutacja do chatu z AI
 */
export function useAIChat() {
    return useMutation({
        mutationFn: (data: ChatRequest) => aiApi.chat(data),
        onError: (error: Error) => {
            const message = error instanceof ApiException
                ? error.message
                : 'Nie udało się połączyć z AI';
            toast.error('Błąd AI', { description: message });
        },
    });
}

// ============================================================
// HOOK: useImproveText
// ============================================================

/**
 * Mutacja do ulepszania tekstu
 */
export function useImproveText() {
    return useMutation({
        mutationFn: (data: ImproveRequest) => aiApi.improveText(data),
        onError: (error: Error) => {
            const message = error instanceof ApiException
                ? error.message
                : 'Nie udało się ulepszyć tekstu';
            toast.error('Błąd AI', { description: message });
        },
    });
}

// ============================================================
// HOOK: useGenerateVariations
// ============================================================

/**
 * Mutacja do generowania wariantów tekstu
 */
export function useGenerateVariations() {
    return useMutation({
        mutationFn: (data: VariationsRequest) => aiApi.generateVariations(data),
        onError: (error: Error) => {
            const message = error instanceof ApiException
                ? error.message
                : 'Nie udało się wygenerować wariantów';
            toast.error('Błąd AI', { description: message });
        },
    });
}

// ============================================================
// HOOK: useAI (kombinowany)
// ============================================================

/**
 * Główny hook AI - łączy wszystkie funkcjonalności
 */
export function useAI() {
    const generateText = useGenerateText();
    const generateImage = useGenerateImage();
    const chat = useAIChat();
    const improve = useImproveText();
    const variations = useGenerateVariations();

    return {
        // Generate Text
        generateText: generateText.mutate,
        generateTextAsync: generateText.mutateAsync,
        isGeneratingText: generateText.isPending,
        generatedText: generateText.data,
        textError: generateText.error,

        // Generate Image
        generateImage: generateImage.mutate,
        generateImageAsync: generateImage.mutateAsync,
        isGeneratingImage: generateImage.isPending,
        generatedImages: generateImage.data,
        imageError: generateImage.error,

        // Chat
        chat: chat.mutate,
        chatAsync: chat.mutateAsync,
        isChatting: chat.isPending,
        chatResponse: chat.data,
        chatError: chat.error,

        // Improve
        improve: improve.mutate,
        improveAsync: improve.mutateAsync,
        isImproving: improve.isPending,
        improvedText: improve.data,
        improveError: improve.error,

        // Variations
        generateVariations: variations.mutate,
        generateVariationsAsync: variations.mutateAsync,
        isGeneratingVariations: variations.isPending,
        generatedVariations: variations.data,
        variationsError: variations.error,

        // Reset all
        reset: () => {
            generateText.reset();
            generateImage.reset();
            chat.reset();
            improve.reset();
            variations.reset();
        },
    };
}

export default useAI;