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

interface PlatformValidation {
    isValid: boolean;
    errors: string[];
}

function validatePlatformRequirements(
    platforms: Platform[],
    content: string,
    imageUrl: string | undefined
): PlatformValidation {
    const errors: string[] = [];
    const hasContent = content.trim().length > 0;
    const hasImage = !!imageUrl;

    if (!hasContent && !hasImage) {
        errors.push('Dodaj treść lub zdjęcie');
        return { isValid: false, errors };
    }

    for (const platform of platforms) {
        switch (platform) {
            case 'instagram':
                if (!hasImage) {
                    errors.push('Instagram wymaga zdjęcia');
                }
                break;
            case 'facebook':
            case 'linkedin':
                break;
        }
    }

    return {
        isValid: errors.length === 0,
        errors: Array.from(new Set(errors)),
    };
}

export default function CreatorPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const isEditMode = searchParams.get('mode') === 'edit';
    const [editingPostId, setEditingPostId] = useState<string | null>(null);

    const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['facebook']);
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState<string | undefined>();
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const [isManualPublishOpen, setIsManualPublishOpen] = useState(false);
    const [manualPublishData, setManualPublishData] = useState<ManualPublishData | null>(null);
    const [manualPublishPostId, setManualPublishPostId] = useState<string | null>(null);

    const [selectedTone] = useState<Tone>('professional');
    const [selectedCategory] = useState<Category | undefined>();

    const [textProvider, setTextProvider] = useState<TextProvider>('gemini');
    const [imageProvider, setImageProvider] = useState<ImageProvider>('pollinations');
    const [imageModel, setImageModel] = useState<string>('flux');

    const { selectedBrand } = useBrandsStore();
    const {
        generateTextAsync,
        isGeneratingText,
        generateImageAsync,
        isGeneratingImage,
    } = useAI();

    const createPostMutation = useCreatePost();
    const updatePostMutation = useUpdatePost();

    const primaryPlatform = selectedPlatforms[0];

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsChatOpen(true);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

            setEditingPostId(String(post.id));
            setContent(post.content || '');
            setImageUrl(post.image_url || undefined);

            if (post.platforms && post.platforms.length > 0) {
                setSelectedPlatforms(post.platforms);
            } else if (post.platform) {
                setSelectedPlatforms([post.platform as Platform]);
            }

            if (post.hashtags && post.hashtags.length > 0) {
                setHashtags(post.hashtags);
            } else {
                const hashtagsFromContent = post.content?.match(/#\w+/g)?.map(h => h.slice(1)) || [];
                if (hashtagsFromContent.length > 0) {
                    setHashtags(hashtagsFromContent);
                    const contentWithoutHashtags = post.content?.replace(/\n*#\w+\s*/g, '').trim() || '';
                    setContent(contentWithoutHashtags);
                }
            }

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

    const getFullContent = useCallback(() => {
        return hashtags.length > 0
            ? `${content}\n\n${hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}`
            : content;
    }, [content, hashtags]);

    const clearForm = useCallback(() => {
        setEditingPostId(null);
        setContent('');
        setImageUrl(undefined);
        setHashtags([]);
        setSelectedPlatforms(['facebook']);
        setManualPublishPostId(null);
    }, []);

    const handleCancelEdit = useCallback(() => {
        clearForm();
        router.replace('/creator');
        toast.info('Anulowano edycję');
    }, [router, clearForm]);

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

    const handleGenerateImage = useCallback(async (
        prompt: string,
        provider?: ImageProvider,
        model?: string
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
                model: model || imageModel,
            });

            if (result.success && result.data) {
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
    }, [generateImageAsync, imageProvider, imageModel]);

    const handleSaveDraft = useCallback(async () => {
        const validation = validatePlatformRequirements(selectedPlatforms, content, imageUrl);

        if (!validation.isValid) {
            validation.errors.forEach(error => {
                toast.error(error);
            });
            return;
        }

        const fullContent = getFullContent();

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

    const handleSchedule = useCallback(async (scheduledAt: string) => {
        const validation = validatePlatformRequirements(selectedPlatforms, content, imageUrl);

        if (!validation.isValid) {
            validation.errors.forEach(error => {
                toast.error(error);
            });
            return;
        }

        const fullContent = getFullContent();

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

    const handlePublishManually = useCallback(async () => {
        const validation = validatePlatformRequirements(selectedPlatforms, content, imageUrl);

        if (!validation.isValid) {
            validation.errors.forEach(error => {
                toast.error(error);
            });
            return;
        }

        const fullContent = getFullContent();
        let postIdForModal = editingPostId;

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

    const handlePlatformPublished = useCallback((postId?: number, platform?: Platform) => {
        console.log(`Platform ${platform} marked as published for post ${postId}`);
    }, []);

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

    const handleModalClose = useCallback((open: boolean) => {
        setIsManualPublishOpen(open);
        if (!open) {
            setManualPublishData(null);
        }
    }, []);

    const handleContentFromChat = useCallback((newContent: string) => {
        setContent(newContent);
    }, []);

    const handleImageFromChat = useCallback((newImageUrl: string) => {
        setImageUrl(newImageUrl);
    }, []);

    const isSaving = createPostMutation.isPending || updatePostMutation.isPending;

    return (
        <div className="flex flex-col h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] overflow-hidden -mx-3 xs:-mx-4 sm:-mx-6 lg:-mx-8 -mb-4">
            <div className="flex-shrink-0 border-b border-border/40 bg-background/50 backdrop-blur-sm">
                <div className="px-3 py-3 xs:px-4 xs:py-4 sm:p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <PlatformSelector
                            selected={selectedPlatforms}
                            onChange={setSelectedPlatforms}
                        />

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
                    <div className="flex-1 overflow-y-auto px-3 py-4 xs:px-4 sm:p-6">
                        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">

                            {editingPostId && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Alert className="border-violet-500/30 bg-violet-500/5">
                                        <Pencil className="h-4 w-4 text-violet-500" />
                                        <AlertDescription className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                                            <span className="text-sm">
                                                <strong>Tryb edycji</strong> — Post #{editingPostId}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleCancelEdit}
                                                className="h-8 px-2 text-muted-foreground hover:text-foreground self-end xs:self-auto"
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Anuluj
                                            </Button>
                                        </AlertDescription>
                                    </Alert>
                                </motion.div>
                            )}

                            {!editingPostId && (
                                <Alert className="border-amber-500/30 bg-amber-500/5">
                                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                    <AlertDescription className="text-xs sm:text-sm">
                                        <strong>Kreator</strong> służy do tworzenia postów z AI.
                                        <span className="hidden sm:inline">
                                            {' '}Publikacja na <strong>konta osobiste</strong> wymaga ręcznego skopiowania treści.
                                        </span>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {selectedBrand && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground"
                                >
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: selectedBrand.primaryColor || '#3B82F6' }}
                                    />
                                    <span>Tworzysz jako</span>
                                    <span className="font-medium text-foreground">{selectedBrand.name}</span>
                                    <Sparkles className="w-3 h-3 text-violet-500" />
                                    <span className="text-violet-500 hidden xs:inline">Brand Voice aktywny</span>
                                </motion.div>
                            )}

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

                            <PostPreview
                                content={content}
                                imageUrl={imageUrl}
                                platforms={selectedPlatforms}
                                brandName={selectedBrand?.name}
                            />
                        </div>
                    </div>

                    <div className="flex-shrink-0 border-t border-border/40 bg-background/50 backdrop-blur-sm safe-area-bottom">
                        <ActionBar
                            onSaveDraft={handleSaveDraft}
                            onSchedule={handleSchedule}
                            onPublishManually={handlePublishManually}
                            isSaving={isSaving}
                            hasContent={!!content.trim()}
                            hasImage={!!imageUrl}
                            selectedPlatform={primaryPlatform}
                            selectedPlatforms={selectedPlatforms}
                            isEditMode={!!editingPostId}
                        />
                    </div>
                </div>

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