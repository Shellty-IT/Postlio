// src/hooks/useAI.ts
/**
 * Hook do komunikacji z AI API
 *
 * Obsługuje: generowanie tekstu, obrazów, chat, ulepszanie
 */

import { useQuery, useMutation, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { aiApi, ApiException } from '@/lib/api';
import type {
    TextGenerationRequest,
    TextGenerationResponse,
    ImageGenerationRequest,
    ImageGenerationResponse,
    ChatRequest,
    ChatResponse,
    ImproveRequest,
    ImproveResponse,
    VariationsRequest,
    VariationsResponse,
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

export function useAIProviders() {
    return useQuery({
        queryKey: aiKeys.providers(),
        queryFn: () => aiApi.getProviders(),
        staleTime: 10 * 60 * 1000,
    });
}

// ============================================================
// HOOK: useGenerateText
// ============================================================

type GenerateTextOptions = Omit<
    UseMutationOptions<TextGenerationResponse, Error, TextGenerationRequest>,
    'mutationFn'
>;

export function useGenerateText(options?: GenerateTextOptions) {
    return useMutation({
        mutationFn: (data: TextGenerationRequest) => aiApi.generateText(data),
        onError: (error: Error) => {
            const message = error instanceof ApiException
                ? error.message
                : 'Nie udało się wygenerować tekstu';
            toast.error('Błąd AI', { description: message });
        },
        ...options,
    });
}

// ============================================================
// HOOK: useGenerateImage
// ============================================================

type GenerateImageOptions = Omit<
    UseMutationOptions<ImageGenerationResponse, Error, ImageGenerationRequest>,
    'mutationFn'
>;

export function useGenerateImage(options?: GenerateImageOptions) {
    return useMutation({
        mutationFn: (data: ImageGenerationRequest) => aiApi.generateImage(data),
        onError: (error: Error) => {
            const message = error instanceof ApiException
                ? error.message
                : 'Nie udało się wygenerować obrazu';
            toast.error('Błąd AI', { description: message });
        },
        ...options,
    });
}

// ============================================================
// HOOK: useAIChat
// ============================================================

type AIChatOptions = Omit<
    UseMutationOptions<ChatResponse, Error, ChatRequest>,
    'mutationFn'
>;

export function useAIChat(options?: AIChatOptions) {
    return useMutation({
        mutationFn: (data: ChatRequest) => aiApi.chat(data),
        onError: (error: Error) => {
            const message = error instanceof ApiException
                ? error.message
                : 'Nie udało się połączyć z AI';
            toast.error('Błąd AI', { description: message });
        },
        ...options,
    });
}

// ============================================================
// HOOK: useImproveText
// ============================================================

type ImproveTextOptions = Omit<
    UseMutationOptions<ImproveResponse, Error, ImproveRequest>,
    'mutationFn'
>;

export function useImproveText(options?: ImproveTextOptions) {
    return useMutation({
        mutationFn: (data: ImproveRequest) => aiApi.improveText(data),
        onError: (error: Error) => {
            const message = error instanceof ApiException
                ? error.message
                : 'Nie udało się ulepszyć tekstu';
            toast.error('Błąd AI', { description: message });
        },
        ...options,
    });
}

// ============================================================
// HOOK: useGenerateVariations
// ============================================================

type GenerateVariationsOptions = Omit<
    UseMutationOptions<VariationsResponse, Error, VariationsRequest>,
    'mutationFn'
>;

export function useGenerateVariations(options?: GenerateVariationsOptions) {
    return useMutation({
        mutationFn: (data: VariationsRequest) => aiApi.generateVariations(data),
        onError: (error: Error) => {
            const message = error instanceof ApiException
                ? error.message
                : 'Nie udało się wygenerować wariantów';
            toast.error('Błąd AI', { description: message });
        },
        ...options,
    });
}

// ============================================================
// HOOK: useAI (kombinowany)
// ============================================================

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