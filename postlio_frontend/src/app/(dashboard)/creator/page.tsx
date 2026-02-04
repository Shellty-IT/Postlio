// src/app/(dashboard)/creator/page.tsx
/**
 * Kreator Postów z integracją AI i ręczną publikacją
 *
 * NAPRAWIONE:
 * - Wymiar height zmieniony z 630 na 624 (podzielne przez 8 dla HuggingFace FLUX)
 * - ✅ Obsługa trybu edycji z Materiałów (?mode=edit)
 * - ✅ NOWE: Obsługa wielu platform (platforms[])
 * - ✅ NOWE: Przekazywanie platforms[] i postId do modalu publikacji
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle, Pencil, X } from 'lucide-react';

import {
    PlatformSelector,
    PostEditor,
    AIChatPanel,
    PostPreview,
    ActionBar,
    InlineProviderSelector,
    ManualPublishModal,
    createManualPublishData,
} from '@/components/creator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAI, useCreatePost, useUpdatePost } from '@/hooks';
import { useBrandsStore } from '@/store/brands-store';
import type { Platform } from '@/types';
import type { Post } from '@/types/post';
import type { ManualPublishData } from '@/types/autopilot';
import type { Tone, Category, TextProvider, ImageProvider } from '@/lib/api/ai';
import { toast } from 'sonner';

// ============================================================
// KOMPONENT
// ============================================================

export default function CreatorPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // ========================================
    // Tryb edycji
    // ========================================
    const isEditMode = searchParams.get('mode') === 'edit';
    const [editingPostId, setEditingPostId] = useState<string | null>(null);

    // State
    const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['facebook']);
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState<string | undefined>();
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [isChatOpen, setIsChatOpen] = useState(true);

    // Manual publish modal state
    const [isManualPublishOpen, setIsManualPublishOpen] = useState(false);
    const [manualPublishData, setManualPublishData] = useState<ManualPublishData | null>(null);
    const [manualPublishPostId, setManualPublishPostId] = useState<string | null>(null); // ✅ NOWE

    // AI Settings
    const [selectedTone] = useState<Tone>('professional');
    const [selectedCategory] = useState<Category | undefined>();

    // Provider settings
    const [textProvider, setTextProvider] = useState<TextProvider>('gemini');
    const [imageProvider, setImageProvider] = useState<ImageProvider>('pollinations');
    const [imageModel, setImageModel] = useState<string>('flux');

    // Hooks
    const { selectedBrand } = useBrandsStore();
    const {
        generateTextAsync,
        isGeneratingText,
        generateImageAsync,
        isGeneratingImage,
    } = useAI();

    const createPostMutation = useCreatePost();
    const updatePostMutation = useUpdatePost();

    // Aktualnie wybrana platforma (pierwsza z listy) - dla kompatybilności
    const primaryPlatform = selectedPlatforms[0];

    // ========================================
    // Wczytaj post do edycji z sessionStorage
    // ========================================
    useEffect(() => {
        if (!isEditMode) return;

        try {
            const savedPost = sessionStorage.getItem('editPost');
            if (!savedPost) {
                toast.error('Nie znaleziono posta do edycji');
                router.replace('/creator');
                return;
            }

            const post: Post = JSON.parse(savedPost);

            // Ustaw dane w edytorze
            setEditingPostId(String(post.id));
            setContent(post.content || '');
            setImageUrl(post.image_url || undefined);

            // ✅ NOWE: Ustaw platformy (nowe pole lub legacy)
            if (post.platforms && post.platforms.length > 0) {
                setSelectedPlatforms(post.platforms);
            } else if (post.platform) {
                setSelectedPlatforms([post.platform as Platform]);
            }

            // Wyciągnij hashtagi z treści lub użyj zapisanych
            if (post.hashtags && post.hashtags.length > 0) {
                setHashtags(post.hashtags);
            } else {
                const hashtagsFromContent = post.content?.match(/#\w+/g)?.map(h => h.slice(1)) || [];
                if (hashtagsFromContent.length > 0) {
                    setHashtags(hashtagsFromContent);
                    // Usuń hashtagi z treści żeby nie były zduplikowane
                    const contentWithoutHashtags = post.content?.replace(/\n*#\w+\s*/g, '').trim() || '';
                    setContent(contentWithoutHashtags);
                }
            }

            // Wyczyść sessionStorage
            sessionStorage.removeItem('editPost');

            toast.info('Wczytano post do edycji', {
                description: `Post #${post.id}`,
            });
        } catch (error) {
            console.error('Error loading post for edit:', error);
            toast.error('Błąd wczytywania posta');
            router.replace('/creator');
        }
    }, [isEditMode, router]);

    // ========================================
    // Helper: Przygotuj pełną treść z hashtagami
    // ========================================
    const getFullContent = useCallback(() => {
        return hashtags.length > 0
            ? `${content}\n\n${hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}`
            : content;
    }, [content, hashtags]);

    // ========================================
    // Helper: Wyczyść formularz
    // ========================================
    const clearForm = useCallback(() => {
        setEditingPostId(null);
        setContent('');
        setImageUrl(undefined);
        setHashtags([]);
        setSelectedPlatforms(['facebook']);
        setManualPublishPostId(null);
    }, []);

    // ========================================
    // Anuluj edycję
    // ========================================
    const handleCancelEdit = useCallback(() => {
        clearForm();
        router.replace('/creator');
        toast.info('Anulowano edycję');
    }, [router, clearForm]);

    // ========================================
    // Generowanie tekstu z wybranym providerem
    // ========================================
    const handleGenerateText = useCallback(async (topic: string, provider?: TextProvider) => {
        try {
            const result = await generateTextAsync({
                topic,
                platform: selectedPlatforms[0] as 'facebook' | 'instagram' | 'linkedin',
                tone: selectedTone,
                category: selectedCategory,
                language: 'pl',
                include_hashtags: true,
                include_emoji: true,
                provider: provider || textProvider,
            });

            if (result.success && result.data) {
                setContent(result.data.content);

                if (result.data.hashtags && result.data.hashtags.length > 0) {
                    setHashtags(result.data.hashtags);
                }

                return result.data.content;
            }
            throw new Error('Brak treści w odpowiedzi');
        } catch {
            throw new Error('Nie udało się wygenerować tekstu');
        }
    }, [generateTextAsync, selectedPlatforms, selectedTone, selectedCategory, textProvider]);

// ========================================
// Generowanie obrazu z wybranym providerem i modelem
// ========================================
    const handleGenerateImage = useCallback(async (
        prompt: string,
        provider?: ImageProvider,
        model?: string  // ✅ NOWE: model (flux/nanobanana)
    ) => {
        try {
            const width = 1024;
            const height = 1024;

            const result = await generateImageAsync({
                prompt,
                width,
                height,
                style: 'professional',
                provider: provider || imageProvider,
                model: model,  // ✅ NOWE: przekaż model
            });

            if (result.success && result.data) {
                // ✅ POPRAWKA: Preferuj image_data (base64) nad image_url
                const generatedImageUrl = result.data.image_data || result.data.image_url;

                if (generatedImageUrl) {
                    setImageUrl(generatedImageUrl);
                    return generatedImageUrl;
                }
            }

            throw new Error(result.error || 'Nie udało się wygenerować obrazu');
        } catch (err) {
            console.error('Image generation error:', err);
            throw new Error('Nie udało się wygenerować obrazu');
        }
    }, [generateImageAsync, imageProvider]);

    // ========================================
    // ✅ NAPRAWIONE: Zapisz jako szkic LUB aktualizuj (z platforms[])
    // ========================================
    const handleSaveDraft = useCallback(async () => {
        if (!content.trim()) return;

        const fullContent = getFullContent();

        // TRYB EDYCJI: Aktualizuj istniejący post
        if (editingPostId) {
            await updatePostMutation.mutateAsync({
                id: editingPostId,
                data: {
                    content: fullContent,
                    platforms: selectedPlatforms,
                    image_url: imageUrl,
                },
            });

            clearForm();
            router.replace('/creator');

            toast.success('Post zaktualizowany!', {
                description: 'Zmiany zostały zapisane.',
            });
            return;
        }

        // TRYB TWORZENIA: Utwórz nowy post
        await createPostMutation.mutateAsync({
            content: fullContent,
            platforms: selectedPlatforms,
            brand_id: selectedBrand?.id ? Number(selectedBrand.id) : undefined,
            image_url: imageUrl,
            ai_generated: true,
            ai_model: textProvider,
        });

        toast.success('Zapisano jako szkic!');
    }, [content, selectedPlatforms, imageUrl, selectedBrand, createPostMutation, updatePostMutation, textProvider, editingPostId, router, getFullContent, clearForm]);

    // ========================================
    // ✅ NAPRAWIONE: Zaplanuj post (z platforms[])
    // ========================================
    const handleSchedule = useCallback(async (scheduledAt: string) => {
        if (!content.trim()) return;

        const fullContent = getFullContent();

        // TRYB EDYCJI: Aktualizuj i zaplanuj
        if (editingPostId) {
            await updatePostMutation.mutateAsync({
                id: editingPostId,
                data: {
                    content: fullContent,
                    platforms: selectedPlatforms,
                    image_url: imageUrl,
                    scheduled_at: scheduledAt,
                    status: 'scheduled',
                },
            });

            clearForm();
            router.replace('/creator');

            toast.success('Post zaktualizowany i zaplanowany!', {
                description: `Publikacja: ${new Date(scheduledAt).toLocaleString('pl-PL')}`,
            });
            return;
        }

        await createPostMutation.mutateAsync({
            content: fullContent,
            platforms: selectedPlatforms,
            brand_id: selectedBrand?.id ? Number(selectedBrand.id) : undefined,
            image_url: imageUrl,
            scheduled_at: scheduledAt,
            ai_generated: true,
            ai_model: textProvider,
        });

        toast.success('Post zaplanowany!', {
            description: 'Możesz go zobaczyć w kalendarzu.',
        });
    }, [content, selectedPlatforms, imageUrl, selectedBrand, createPostMutation, updatePostMutation, textProvider, editingPostId, router, getFullContent, clearForm]);

    // ========================================
    // ✅ NOWE: Otwórz modal ręcznej publikacji
    // ========================================
    const handlePublishManually = useCallback(async () => {
        if (!content.trim()) {
            toast.error('Dodaj treść posta');
            return;
        }

        if (selectedPlatforms.includes('instagram') && !imageUrl) {
            toast.error('Instagram wymaga zdjęcia', {
                description: 'Dodaj lub wygeneruj obraz przed publikacją.',
            });
            return;
        }

        const fullContent = getFullContent();
        let postIdForModal = editingPostId;

        // ✅ NOWE: Jeśli post nie istnieje, utwórz go jako draft
        if (!postIdForModal) {
            try {
                const newPost = await createPostMutation.mutateAsync({
                    content: fullContent,
                    platforms: selectedPlatforms,
                    brand_id: selectedBrand?.id ? Number(selectedBrand.id) : undefined,
                    image_url: imageUrl,
                    ai_generated: true,
                    ai_model: textProvider,
                });
                postIdForModal = String(newPost.id);
            } catch (error) {
                console.error('Failed to create post before publish:', error);
                toast.error('Nie udało się przygotować posta');
                return;
            }
        }

        // Przygotuj dane dla modalu
        const data = createManualPublishData({
            id: parseInt(postIdForModal, 10),
            post_id: parseInt(postIdForModal, 10),
            content,
            hashtags,
            image_url: imageUrl || null,
            platform: primaryPlatform,
        });

        setManualPublishData(data);
        setManualPublishPostId(postIdForModal);
        setIsManualPublishOpen(true);
    }, [content, hashtags, imageUrl, selectedPlatforms, primaryPlatform, editingPostId, selectedBrand, createPostMutation, textProvider, getFullContent]);

    // ========================================
    // ✅ NOWE: Handler dla pojedynczej platformy opublikowanej
    // ========================================
    const handlePlatformPublished = useCallback((postId?: number, platform?: Platform) => {
        // Modal sam zapisuje status do backendu
        // Tu możemy dodać dodatkową logikę jeśli potrzebna
        console.log(`Platform ${platform} marked as published for post ${postId}`);
    }, []);

    // ========================================
    // ✅ NOWE: Handler gdy wszystkie platformy opublikowane
    // ========================================
    const handleAllPublished = useCallback(() => {
        clearForm();
        setIsManualPublishOpen(false);
        setManualPublishData(null);

        if (isEditMode) {
            router.replace('/creator');
        }

        toast.success('Wszystkie platformy opublikowane! 🎉', {
            description: 'Formularz został wyczyszczony.',
        });
    }, [isEditMode, router, clearForm]);

    // ========================================
    // Zamknięcie modalu
    // ========================================
    const handleModalClose = useCallback((open: boolean) => {
        setIsManualPublishOpen(open);
        if (!open) {
            setManualPublishData(null);
            // Nie czyścimy formularza - user może chcieć kontynuować edycję
        }
    }, []);

    // ========================================
    // Aktualizacja contentu z chatu AI
    // ========================================
    const handleContentFromChat = useCallback((newContent: string) => {
        setContent(newContent);
    }, []);

    // ========================================
    // Aktualizacja obrazu z chatu AI
    // ========================================
    const handleImageFromChat = useCallback((newImageUrl: string) => {
        setImageUrl(newImageUrl);
    }, []);

    const isSaving = createPostMutation.isPending || updatePostMutation.isPending;

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
            {/* Header z wyborem platform i providerów */}
            <div className="flex-shrink-0 border-b border-border/40 bg-background/50 backdrop-blur-sm">
                <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <PlatformSelector
                            selected={selectedPlatforms}
                            onChange={setSelectedPlatforms}
                        />

                        {/* Provider selector */}
                        <InlineProviderSelector
                            textProvider={textProvider}
                            imageProvider={imageProvider}
                            imageModel={imageModel}
                            onTextProviderChange={setTextProvider}
                            onImageProviderChange={(provider, model) => {
                                setImageProvider(provider);
                                if (model) setImageModel(model);
                            }}
                        />
                    </div>
                </div>
            </div>


            <div className="flex-1 flex overflow-hidden">

                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
                        <div className="max-w-2xl mx-auto space-y-6">


                            {editingPostId && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Alert className="border-violet-500/30 bg-violet-500/5">
                                        <Pencil className="h-4 w-4 text-violet-500" />
                                        <AlertDescription className="flex items-center justify-between">
                                            <span className="text-sm">
                                                <strong>Tryb edycji</strong> — Edytujesz post #{editingPostId}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleCancelEdit}
                                                className="h-7 px-2 text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Anuluj
                                            </Button>
                                        </AlertDescription>
                                    </Alert>
                                </motion.div>
                            )}

                            {/* Info o ręcznej publikacji */}
                            {!editingPostId && (
                                <Alert className="border-amber-500/30 bg-amber-500/5">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    <AlertDescription className="text-sm">
                                        <strong>Kreator</strong> służy do tworzenia postów z pomocą AI.
                                        Publikacja na <strong>konta osobiste</strong> (Facebook/Instagram)
                                        wymaga ręcznego skopiowania treści.{' '}
                                        <span className="text-muted-foreground">
                                            Automatyczna publikacja jest dostępna tylko dla Facebook Pages i Instagram Business
                                            w module Autopilot.
                                        </span>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Brand indicator */}
                            {selectedBrand && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 text-sm text-muted-foreground"
                                >
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: selectedBrand.primaryColor || '#3B82F6' }}
                                    />
                                    <span>Tworzysz jako</span>
                                    <span className="font-medium text-foreground">{selectedBrand.name}</span>
                                    <Sparkles className="w-3 h-3 text-violet-500" />
                                    <span className="text-violet-500">Brand Voice aktywny</span>
                                </motion.div>
                            )}

                            {/* Edytor */}
                            <PostEditor
                                content={content}
                                onChange={setContent}
                                imageUrl={imageUrl}
                                onImageChange={setImageUrl}
                                hashtags={hashtags}
                                onHashtagsChange={setHashtags}
                                platforms={selectedPlatforms}
                                isGenerating={isGeneratingText || isGeneratingImage}
                                onGenerateText={handleGenerateText}
                                onGenerateImage={handleGenerateImage}
                                defaultTextProvider={textProvider}
                                defaultImageProvider={imageProvider}
                                defaultImageModel={imageModel}
                            />

                            {/* Podgląd */}
                            <PostPreview
                                content={content}
                                imageUrl={imageUrl}
                                platforms={selectedPlatforms}
                                brandName={selectedBrand?.name}
                            />
                        </div>
                    </div>

                    {/* Action bar */}
                    <div className="flex-shrink-0 border-t border-border/40 bg-background/50 backdrop-blur-sm">
                        <ActionBar
                            onSaveDraft={handleSaveDraft}
                            onSchedule={handleSchedule}
                            onPublishManually={handlePublishManually}
                            isSaving={isSaving}
                            hasContent={!!content.trim()}
                            hasImage={!!imageUrl}
                            selectedPlatform={primaryPlatform}
                            isEditMode={!!editingPostId}
                        />
                    </div>
                </div>

                {/* Prawa strona - AI Chat Panel */}
                <AIChatPanel
                    isOpen={isChatOpen}
                    onToggle={() => setIsChatOpen(!isChatOpen)}
                    currentContent={content}
                    selectedPlatforms={selectedPlatforms}
                    selectedBrandId={selectedBrand?.id}
                    selectedBrandName={selectedBrand?.name}
                    onContentGenerated={handleContentFromChat}
                    onImageGenerated={handleImageFromChat}
                    isGeneratingText={isGeneratingText}
                    isGeneratingImage={isGeneratingImage}
                    textProvider={textProvider}
                    imageProvider={imageProvider}
                />
            </div>

            {/* ✅ NOWE: Manual Publish Modal z platforms[] i postId */}
            <ManualPublishModal
                open={isManualPublishOpen}
                onOpenChange={handleModalClose}
                data={manualPublishData}
                platforms={selectedPlatforms}
                postId={manualPublishPostId || undefined}
                onMarkAsPublished={handlePlatformPublished}
                onAllPublished={handleAllPublished}
            />
        </div>
    );
}