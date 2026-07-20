// src/app/(dashboard)/creator/page.tsx

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle, Pencil, X } from 'lucide-react';

import {
    AccountSelector,
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
import { useAI, useCreatePost, useUpdatePost, useConnectedAccounts, usePublishToSocial } from '@/hooks';
import { useUpdatePlatformStatus } from '@/hooks/usePosts';
import { useBrandsStore } from '@/store/brands-store';
import type { Platform, ConnectedAccount } from '@/types';
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
    imageUrl: string | undefined,
    videoUrl: string | undefined
): PlatformValidation {
    const errors: string[] = [];
    const hasContent = content.trim().length > 0;
    const hasMedia = !!imageUrl || !!videoUrl;

    if (!hasContent && !hasMedia) {
        errors.push('Dodaj treść, zdjęcie lub film');
        return { isValid: false, errors };
    }

    for (const platform of platforms) {
        switch (platform) {
            case 'instagram':
                if (!hasMedia) {
                    errors.push('Instagram wymaga zdjęcia lub filmu');
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

    const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState<string | undefined>();
    const [videoUrl, setVideoUrl] = useState<string | undefined>();
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const [pendingEditPlatforms, setPendingEditPlatforms] = useState<Platform[] | null>(null);
    const [isManualPublishOpen, setIsManualPublishOpen] = useState(false);
    const [manualPublishData, setManualPublishData] = useState<ManualPublishData | null>(null);
    const [manualPublishPostId, setManualPublishPostId] = useState<string | null>(null);
    const [manualPublishPlatforms, setManualPublishPlatforms] = useState<Platform[]>([]);

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
    const { data: accountsData } = useConnectedAccounts();
    const publishToSocial = usePublishToSocial();
    const updatePlatformStatus = useUpdatePlatformStatus({ showToast: false });

    const connectedAccounts = useMemo(
        () => (accountsData?.accounts ?? []).filter((a) => a.is_active && a.status !== 'disconnected'),
        [accountsData]
    );

    const selectedAccounts = useMemo(
        () => connectedAccounts.filter((a) => selectedAccountIds.includes(a.id)),
        [connectedAccounts, selectedAccountIds]
    );

    const selectedPlatforms = useMemo(
        () => Array.from(new Set(selectedAccounts.map((a) => a.platform))) as Platform[],
        [selectedAccounts]
    );

    const primaryPlatform = selectedPlatforms[0];

    // Domyślnie zaznacz pierwsze podłączone konto, gdy lista się załaduje i nic nie jest jeszcze wybrane.
    useEffect(() => {
        if (selectedAccountIds.length === 0 && connectedAccounts.length > 0 && !isEditMode) {
            setSelectedAccountIds([connectedAccounts[0].id]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connectedAccounts]);

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
                setPendingEditPlatforms(post.platforms);
            } else if (post.platform) {
                setPendingEditPlatforms([post.platform as Platform]);
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

    // Post nie pamięta konkretnego account_id per platforma (tylko nazwę platformy),
    // więc przy edycji dopasowujemy pierwsze aktywne podłączone konto danej platformy.
    // Czeka na załadowanie connectedAccounts, dlatego to osobny efekt.
    useEffect(() => {
        if (!pendingEditPlatforms || connectedAccounts.length === 0) return;

        const ids = pendingEditPlatforms
            .map((platform) => connectedAccounts.find((a) => a.platform === platform)?.id)
            .filter((id): id is number => id !== undefined);

        if (ids.length > 0) {
            setSelectedAccountIds(ids);
        }
        setPendingEditPlatforms(null);
    }, [pendingEditPlatforms, connectedAccounts]);

    const getFullContent = useCallback(() => {
        return hashtags.length > 0
            ? `${content}\n\n${hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}`
            : content;
    }, [content, hashtags]);

    const clearForm = useCallback(() => {
        setEditingPostId(null);
        setContent('');
        setImageUrl(undefined);
        setVideoUrl(undefined);
        setHashtags([]);
        setSelectedAccountIds(connectedAccounts.length > 0 ? [connectedAccounts[0].id] : []);
        setManualPublishPostId(null);
    }, [connectedAccounts]);

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
                    setVideoUrl(undefined);
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
        const validation = validatePlatformRequirements(selectedPlatforms, content, imageUrl, videoUrl);

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
    }, [content, selectedPlatforms, imageUrl, videoUrl, selectedBrand, createPostMutation, updatePostMutation, textProvider, editingPostId, router, getFullContent, clearForm]);

    const handleSchedule = useCallback(async (scheduledAt: string) => {
        const validation = validatePlatformRequirements(selectedPlatforms, content, imageUrl, videoUrl);

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
    }, [content, selectedPlatforms, imageUrl, videoUrl, selectedBrand, createPostMutation, updatePostMutation, textProvider, editingPostId, router, getFullContent, clearForm]);

    const handlePublish = useCallback(async () => {
        const validation = validatePlatformRequirements(selectedPlatforms, content, imageUrl, videoUrl);

        if (!validation.isValid) {
            validation.errors.forEach(error => {
                toast.error(error);
            });
            return;
        }

        if (selectedAccounts.length === 0) {
            toast.error('Wybierz przynajmniej jedno konto docelowe');
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

        // Konta z is_business_account=true (Strona FB, IG Business/Creator, Strona LinkedIn)
        // publikują od razu przez prawdziwe API. Reszta (konta osobiste) dostaje
        // instrukcje ręcznej publikacji - jak dotychczas.
        const autoAccounts = selectedAccounts.filter((a) => a.publish_method === 'auto');
        const manualAccounts = selectedAccounts.filter((a) => a.publish_method !== 'auto');

        let autoFailures = 0;

        for (const account of autoAccounts) {
            try {
                const result = await publishToSocial.mutateAsync({
                    account_id: account.id,
                    content: fullContent,
                    image_url: imageUrl,
                    page_id: account.pages?.[0]?.id,
                    instagram_account_id: account.instagram_accounts?.[0]?.id,
                });

                if (result.success && !result.requires_manual_publish) {
                    await updatePlatformStatus.mutateAsync({
                        postId: postIdForModal,
                        platform: account.platform,
                        status: 'published',
                    });
                } else {
                    autoFailures += 1;
                }
            } catch (error) {
                console.error(`Failed to auto-publish to ${account.display_name}:`, error);
                autoFailures += 1;
            }
        }

        if (autoAccounts.length > 0 && autoFailures === 0) {
            toast.success(
                autoAccounts.length === 1
                    ? `Opublikowano na ${autoAccounts[0].display_name}!`
                    : `Opublikowano automatycznie na ${autoAccounts.length} kontach!`
            );
        }

        if (manualAccounts.length === 0) {
            if (autoAccounts.length > 0 && autoFailures < autoAccounts.length) {
                clearForm();
                if (isEditMode) router.replace('/creator');
            }
            return;
        }

        const data = createManualPublishData({
            id: parseInt(postIdForModal, 10),
            post_id: parseInt(postIdForModal, 10),
            content,
            hashtags,
            image_url: imageUrl || null,
            platform: manualAccounts[0].platform,
        });

        setManualPublishData(data);
        setManualPublishPlatforms(manualAccounts.map((a) => a.platform));
        setManualPublishPostId(postIdForModal);
        setIsManualPublishOpen(true);
    }, [
        content, hashtags, imageUrl, videoUrl, selectedPlatforms, selectedAccounts,
        editingPostId, selectedBrand, createPostMutation, textProvider, getFullContent,
        publishToSocial, updatePlatformStatus, clearForm, isEditMode, router,
    ]);

    const handlePlatformPublished = useCallback((_postId?: number, _platform?: Platform) => {
    }, []);

    const handleAllPublished = useCallback(() => {
        clearForm();
        setIsManualPublishOpen(false);
        setManualPublishData(null);
        setManualPublishPlatforms([]);

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
            setManualPublishPlatforms([]);
        }
    }, []);

    const handleContentFromChat = useCallback((newContent: string) => {
        setContent(newContent);
    }, []);

    const handleImageFromChat = useCallback((newImageUrl: string) => {
        setImageUrl(newImageUrl);
        setVideoUrl(undefined);
    }, []);

    const hasMedia = !!imageUrl || !!videoUrl;
    const isSaving = createPostMutation.isPending || updatePostMutation.isPending;

    return (
        <div className="flex flex-col h-[calc(100vh-9.5rem)] xs:h-[calc(100vh-10.5rem)] sm:h-[calc(100vh-11rem)] lg:h-[calc(100vh-6.5rem)] overflow-hidden -mx-3 xs:-mx-4 sm:-mx-6 lg:-mx-8 -mb-4">
            <div className="flex-shrink-0 border-b border-border/40 bg-background/50 backdrop-blur-sm">
                <div className="px-3 py-3 xs:px-4 xs:py-4 sm:p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <AccountSelector
                            selected={selectedAccountIds}
                            onChange={setSelectedAccountIds}
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
                                    <Alert className="rounded-[14px] border-accent/25 bg-accent/[0.06]">
                                        <Pencil className="h-4 w-4 text-accent" />
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
                                <Alert className="rounded-[14px] border-warning/20 bg-warning/[0.06]">
                                    <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                                    <AlertDescription className="text-xs sm:text-sm text-[#d9c8a3]">
                                        <strong className="text-[#f2d3a0]">Kreator</strong> służy do tworzenia postów z AI.
                                        <span className="hidden sm:inline">
                      {' '}Publikacja na <strong className="text-[#f2d3a0]">konta osobiste</strong> wymaga ręcznego skopiowania treści.
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
                                    <Sparkles className="w-3 h-3 text-accent" />
                                    <span className="text-accent hidden xs:inline">Brand Voice aktywny</span>
                                </motion.div>
                            )}

                            <PostEditor
                                content={content}
                                onChange={setContent}
                                imageUrl={imageUrl}
                                onImageChange={setImageUrl}
                                videoUrl={videoUrl}
                                onVideoChange={setVideoUrl}
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
                                videoUrl={videoUrl}
                                platforms={selectedPlatforms}
                                brandName={selectedBrand?.name}
                            />
                        </div>
                    </div>

                    <div className="flex-shrink-0 border-t border-border/40 bg-background/50 backdrop-blur-sm safe-area-bottom">
                        <ActionBar
                            onSaveDraft={handleSaveDraft}
                            onSchedule={handleSchedule}
                            onPublish={handlePublish}
                            isSaving={isSaving}
                            hasContent={!!content.trim()}
                            hasImage={hasMedia}
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
                platforms={manualPublishPlatforms}
                postId={manualPublishPostId || undefined}
                onMarkAsPublished={handlePlatformPublished}
                onAllPublished={handleAllPublished}
            />
        </div>
    );
}