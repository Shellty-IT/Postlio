// src/app/(dashboard)/creator/page.tsx
/**
 * Kreator Postów z integracją AI
 */

'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

import {
    PlatformSelector,
    PostEditor,
    AIChatPanel,
    PostPreview,
    ActionBar,
} from '@/components/creator';
import { useAI, useCreatePost } from '@/hooks';
import { useBrandsStore } from '@/store/brands-store';
import type { Platform } from '@/types';

// ============================================================
// KOMPONENT
// ============================================================

export default function CreatorPage() {
    // State
    const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['facebook']);
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState<string | undefined>();
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [isChatOpen, setIsChatOpen] = useState(true);

    // Hooks
    const { selectedBrand } = useBrandsStore();
    const {
        generateTextAsync,
        isGeneratingText,
        generateImageAsync,
        isGeneratingImage,
    } = useAI();

    // useCreatePost zwraca UseMutationResult
    const createPostMutation = useCreatePost();

    // Generowanie tekstu
    const handleGenerateText = useCallback(async (prompt: string) => {
        try {
            const result = await generateTextAsync({
                prompt,
                platform: selectedPlatforms[0],
                brand_id: selectedBrand?.id,
                use_brand_voice: !!selectedBrand,
            });

            setContent(result.content);
            return result.content;
        } catch {
            throw new Error('Nie udało się wygenerować tekstu');
        }
    }, [generateTextAsync, selectedPlatforms, selectedBrand]);

    // Generowanie obrazu
    const handleGenerateImage = useCallback(async (prompt: string) => {
        try {
            const result = await generateImageAsync({
                prompt,
                brand_id: selectedBrand?.id,
                size: selectedPlatforms.includes('instagram') ? '1080x1080' : '1200x630',
            });

            if (result.images && result.images.length > 0) {
                setImageUrl(result.images[0].url);
                return result.images[0].url;
            }
        } catch {
            throw new Error('Nie udało się wygenerować obrazu');
        }
    }, [generateImageAsync, selectedBrand, selectedPlatforms]);

    // Zapisz jako szkic
    const handleSaveDraft = useCallback(async () => {
        if (!content.trim()) return;

        await createPostMutation.mutateAsync({
            content,
            platforms: selectedPlatforms,
            media_urls: imageUrl ? [imageUrl] : [],
            hashtags,
            status: 'draft',
            brand_id: selectedBrand?.id,
            ai_generated: true,
        });
    }, [content, selectedPlatforms, imageUrl, hashtags, selectedBrand, createPostMutation]);

    // Zaplanuj post
    const handleSchedule = useCallback(async (scheduledAt: string) => {
        if (!content.trim()) return;

        await createPostMutation.mutateAsync({
            content,
            platforms: selectedPlatforms,
            media_urls: imageUrl ? [imageUrl] : [],
            hashtags,
            status: 'scheduled',
            scheduled_at: scheduledAt,
            brand_id: selectedBrand?.id,
            ai_generated: true,
        });
    }, [content, selectedPlatforms, imageUrl, hashtags, selectedBrand, createPostMutation]);

    // Aktualizacja contentu z chatu AI
    const handleContentFromChat = useCallback((newContent: string) => {
        setContent(newContent);
    }, []);

    // Aktualizacja obrazu z chatu AI
    const handleImageFromChat = useCallback((newImageUrl: string) => {
        setImageUrl(newImageUrl);
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
            {/* Header z wyborem platform */}
            <div className="flex-shrink-0 border-b border-border/40 bg-background/50 backdrop-blur-sm">
                <div className="p-4">
                    <PlatformSelector
                        selected={selectedPlatforms}
                        onChange={setSelectedPlatforms}
                    />
                </div>
            </div>

            {/* Główna zawartość */}
            <div className="flex-1 flex overflow-hidden">
                {/* Lewa strona - Edytor */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
                        <div className="max-w-2xl mx-auto space-y-6">
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
                            />

                            {/* Podgląd */}
                            <PostPreview
                                content={content}
                                imageUrl={imageUrl}
                                platforms={selectedPlatforms}
                            />
                        </div>
                    </div>

                    {/* Action bar */}
                    <div className="flex-shrink-0 border-t border-border/40 bg-background/50 backdrop-blur-sm">
                        <ActionBar
                            onSaveDraft={handleSaveDraft}
                            onSchedule={handleSchedule}
                            isSaving={createPostMutation.isPending}
                            hasContent={!!content.trim()}
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
                />
            </div>
        </div>
    );
}