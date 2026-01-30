// src/components/creator/post-editor.tsx
/**
 * Edytor posta z obsługą AI, wyborem providerów i edycją obrazu
 *
 * NAPRAWIONE:
 * - SOFT_LIMIT zmieniony z 700 na 500
 * - Dodane liczniki znaków w dialogach (max 500)
 * - Sync providerów z propsów przez useEffect
 * - Podpowiedzi DODAJĄ tekst po spacji zamiast nadpisywać
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    Hash,
    Smile,
    X,
    Loader2,
    Wand2,
    RefreshCw,
    Upload,
    Crop,
    AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AIProviderSelector } from './ai-provider-selector';
import { ImageCropModal } from './image-crop-modal';
import { cn } from '@/lib/utils';
import type { Platform } from '@/types';
import type { TextProvider, ImageProvider } from '@/lib/api/ai';

// ============================================================
// TYPY
// ============================================================

interface PostEditorProps {
    content: string;
    onChange: (content: string) => void;
    imageUrl?: string;
    onImageChange: (url: string | undefined) => void;
    hashtags: string[];
    onHashtagsChange: (hashtags: string[]) => void;
    platforms: Platform[];
    isGenerating?: boolean;
    onGenerateText?: (prompt: string, provider?: TextProvider) => Promise<string>;
    onGenerateImage?: (prompt: string, provider?: ImageProvider, model?: string) => Promise<string | undefined>;
    defaultTextProvider?: TextProvider;
    defaultImageProvider?: ImageProvider;
    defaultImageModel?: string;
}

// ============================================================
// LIMITY
// ============================================================

const PLATFORM_LIMITS: Record<Platform, number> = {
    facebook: 63206,
    instagram: 2200,
    linkedin: 3000,
};

// ✅ NAPRAWIONE: Limit dla promptów AI i "soft" limit dla posta - teraz 500
const PROMPT_LIMIT = 500;
const SOFT_LIMIT = 500;

// ============================================================
// KOMPONENT LICZNIKA ZNAKÓW (reużywalny)
// ============================================================

interface CharCounterProps {
    current: number;
    max: number;
    className?: string;
}

function CharCounter({ current, max, className }: CharCounterProps) {
    const percentage = (current / max) * 100;
    const isNearLimit = percentage >= 80 && percentage < 100;
    const isOverLimit = current > max;

    return (
        <div className={cn('flex items-center gap-2 text-xs', className)}>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                    className={cn(
                        'h-full transition-colors duration-300',
                        isOverLimit ? 'bg-red-500' :
                            isNearLimit ? 'bg-amber-500' : 'bg-primary'
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 0.2 }}
                />
            </div>
            <span className={cn(
                'font-medium tabular-nums',
                isOverLimit ? 'text-red-500' :
                    isNearLimit ? 'text-amber-500' : 'text-muted-foreground'
            )}>
                {current}/{max}
            </span>
        </div>
    );
}

// ============================================================
// KOMPONENT GŁÓWNY
// ============================================================

export function PostEditor({
                               content,
                               onChange,
                               imageUrl,
                               onImageChange,
                               hashtags,
                               onHashtagsChange,
                               platforms,
                               isGenerating = false,
                               onGenerateText,
                               onGenerateImage,
                               defaultTextProvider = 'gemini',
                               defaultImageProvider = 'pollinations',
                               defaultImageModel,
                           }: PostEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [newHashtag, setNewHashtag] = useState('');
    const [isGenerateTextOpen, setIsGenerateTextOpen] = useState(false);
    const [isGenerateImageOpen, setIsGenerateImageOpen] = useState(false);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [textPrompt, setTextPrompt] = useState('');
    const [imagePrompt, setImagePrompt] = useState('');
    const [isGeneratingLocal, setIsGeneratingLocal] = useState(false);

    // Provider state
    const [selectedTextProvider, setSelectedTextProvider] = useState<TextProvider>(defaultTextProvider);
    const [selectedImageProvider, setSelectedImageProvider] = useState<ImageProvider>(defaultImageProvider);
    const [selectedImageModel, setSelectedImageModel] = useState<string | undefined>(defaultImageModel);

    // ✅ NAPRAWIONE: Synchronizacja providerów z propsów
    useEffect(() => {
        setSelectedTextProvider(defaultTextProvider);
    }, [defaultTextProvider]);

    useEffect(() => {
        setSelectedImageProvider(defaultImageProvider);
    }, [defaultImageProvider]);

    useEffect(() => {
        setSelectedImageModel(defaultImageModel);
    }, [defaultImageModel]);

    // Limit znaków (najmniejszy z wybranych platform)
    const charLimit = Math.min(...platforms.map((p) => PLATFORM_LIMITS[p]));
    const charCount = content.length;
    const isOverLimit = charCount > charLimit;
    const isNearSoftLimit = charCount >= SOFT_LIMIT * 0.8 && charCount <= SOFT_LIMIT;
    const isOverSoftLimit = charCount > SOFT_LIMIT && charCount <= charLimit;

    // Określ kolor licznika
    const getCounterColor = () => {
        if (isOverLimit) return 'text-red-500';
        if (isOverSoftLimit) return 'text-amber-500';
        if (isNearSoftLimit) return 'text-yellow-500';
        return 'text-muted-foreground';
    };

    // Procent wypełnienia (dla soft limitu)
    const softLimitPercentage = Math.min((charCount / SOFT_LIMIT) * 100, 100);

    // Dodaj hashtag
    const handleAddHashtag = useCallback(() => {
        const tag = newHashtag.trim().replace(/^#/, '');
        if (tag && !hashtags.includes(tag)) {
            onHashtagsChange([...hashtags, tag]);
        }
        setNewHashtag('');
    }, [newHashtag, hashtags, onHashtagsChange]);

    // Usuń hashtag
    const handleRemoveHashtag = useCallback((tag: string) => {
        onHashtagsChange(hashtags.filter((h) => h !== tag));
    }, [hashtags, onHashtagsChange]);

    // ✅ NAPRAWIONE: Handler dla podpowiedzi tekstu - DODAJE po spacji
    const handleTextSuggestionClick = useCallback((suggestion: string) => {
        setTextPrompt(prev => {
            if (!prev.trim()) return suggestion;
            return `${prev.trim()} ${suggestion}`;
        });
    }, []);

    // ✅ NAPRAWIONE: Handler dla stylów obrazu - DODAJE po spacji/przecinku
    const handleImageStyleClick = useCallback((style: string) => {
        setImagePrompt(prev => {
            if (!prev.trim()) return style.toLowerCase();
            return `${prev.trim()}, ${style.toLowerCase()} styl`;
        });
    }, []);

    // Generuj tekst
    const handleGenerateText = useCallback(async () => {
        if (!textPrompt.trim() || !onGenerateText) return;

        setIsGeneratingLocal(true);
        try {
            await onGenerateText(textPrompt, selectedTextProvider);
            setIsGenerateTextOpen(false);
            setTextPrompt('');
        } catch {
            // Error handled by parent
        } finally {
            setIsGeneratingLocal(false);
        }
    }, [textPrompt, onGenerateText, selectedTextProvider]);

    // Generuj obraz
    const handleGenerateImage = useCallback(async () => {
        if (!imagePrompt.trim() || !onGenerateImage) return;

        setIsGeneratingLocal(true);
        try {
            await onGenerateImage(imagePrompt, selectedImageProvider, selectedImageModel);
            setIsGenerateImageOpen(false);
            setImagePrompt('');
        } catch {
            // Error handled by parent
        } finally {
            setIsGeneratingLocal(false);
        }
    }, [imagePrompt, onGenerateImage, selectedImageProvider, selectedImageModel]);

    // Upload obrazu
    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            onImageChange(url);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [onImageChange]);

    // Handler zmiany providera obrazu
    const handleImageProviderChange = (provider: string, model?: string) => {
        setSelectedImageProvider(provider as ImageProvider);
        setSelectedImageModel(model);
    };

    // Handler cropped image
    const handleCropComplete = useCallback((croppedUrl: string) => {
        onImageChange(croppedUrl);
    }, [onImageChange]);

    // ✅ NAPRAWIONE: Handler dla textarea z limitem w dialogach
    const handleTextPromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= PROMPT_LIMIT) {
            setTextPrompt(value);
        }
    }, []);

    const handleImagePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= PROMPT_LIMIT) {
            setImagePrompt(value);
        }
    }, []);

    return (
        <div className="space-y-4">
            {/* Główny edytor */}
            <div className="relative">
                <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Co chcesz opublikować? Napisz sam lub użyj AI..."
                    className={cn(
                        'min-h-[200px] resize-none text-base leading-relaxed pb-10',
                        isOverLimit && 'border-red-500 focus-visible:ring-red-500'
                    )}
                    disabled={isGenerating}
                />

                {/* AI Generating overlay */}
                <AnimatePresence>
                    {isGenerating && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-md"
                        >
                            <div className="flex items-center gap-3 text-primary">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="font-medium">AI generuje treść...</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Character counter with visual indicator */}
                <div className="absolute bottom-3 right-3 flex items-center gap-3">
                    {/* Soft limit progress bar */}
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                                className={cn(
                                    'h-full transition-colors duration-300',
                                    isOverLimit ? 'bg-red-500' :
                                        isOverSoftLimit ? 'bg-amber-500' :
                                            isNearSoftLimit ? 'bg-yellow-500' :
                                                'bg-primary'
                                )}
                                initial={{ width: 0 }}
                                animate={{ width: `${softLimitPercentage}%` }}
                                transition={{ duration: 0.2 }}
                            />
                        </div>
                    </div>

                    {/* Character count */}
                    <div className={cn('flex items-center gap-1.5 text-xs font-medium', getCounterColor())}>
                        {isOverSoftLimit && !isOverLimit && (
                            <Tooltip>
                                <TooltipTrigger>
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Długi post może mieć mniejsze zaangażowanie</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        <span className={cn(isOverLimit && 'animate-pulse')}>
                            {charCount.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-muted-foreground">
                            {SOFT_LIMIT}
                        </span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
                <TooltipProvider>
                    {/* Generuj tekst AI */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsGenerateTextOpen(true)}
                                disabled={isGenerating}
                                className="gap-2"
                            >
                                <Sparkles className="w-4 h-4 text-violet-500" />
                                Generuj tekst
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Wygeneruj tekst z AI</TooltipContent>
                    </Tooltip>

                    {/* Generuj obraz AI */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsGenerateImageOpen(true)}
                                disabled={isGenerating}
                                className="gap-2"
                            >
                                <Wand2 className="w-4 h-4 text-violet-500" />
                                Generuj obraz
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Wygeneruj obraz z AI</TooltipContent>
                    </Tooltip>

                    {/* Upload obrazu */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isGenerating}
                            >
                                <Upload className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Dodaj obraz</TooltipContent>
                    </Tooltip>

                    {/* Emoji */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" disabled={isGenerating}>
                                <Smile className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Dodaj emoji</TooltipContent>
                    </Tooltip>

                    {/* Hashtag input */}
                    <div className="flex items-center gap-1 ml-auto">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        <Input
                            value={newHashtag}
                            onChange={(e) => setNewHashtag(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddHashtag();
                                }
                            }}
                            placeholder="Dodaj hashtag"
                            className="w-32 h-8 text-sm"
                            disabled={isGenerating}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleAddHashtag}
                            disabled={!newHashtag.trim() || isGenerating}
                        >
                            Dodaj
                        </Button>
                    </div>
                </TooltipProvider>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                />
            </div>

            {/* Hashtagi */}
            {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {hashtags.map((tag) => (
                        <Badge
                            key={tag}
                            variant="secondary"
                            className="gap-1 cursor-pointer hover:bg-destructive/10"
                            onClick={() => handleRemoveHashtag(tag)}
                        >
                            #{tag}
                            <X className="w-3 h-3" />
                        </Badge>
                    ))}
                </div>
            )}

            {/* Podgląd obrazu */}
            <AnimatePresence>
                {imageUrl && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative rounded-lg overflow-hidden border border-border"
                    >
                        <div className="relative w-full h-80">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageUrl}
                                alt="Post image"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-2">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                                onClick={() => setIsCropModalOpen(true)}
                            >
                                <Crop className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                                onClick={() => setIsGenerateImageOpen(true)}
                            >
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                                onClick={() => onImageChange(undefined)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ============================================================ */}
            {/* Dialog: Generuj tekst - Z LICZNIKIEM */}
            {/* ============================================================ */}
            <Dialog open={isGenerateTextOpen} onOpenChange={setIsGenerateTextOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-violet-500" />
                            Generuj tekst z AI
                        </DialogTitle>
                        <DialogDescription>
                            Opisz, jaki post chcesz stworzyć. Wybierz model AI, który najlepiej pasuje do Twoich potrzeb.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Provider selector */}
                        <AIProviderSelector
                            type="text"
                            value={selectedTextProvider}
                            onChange={(p) => setSelectedTextProvider(p as TextProvider)}
                        />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="text-prompt">Opis posta</Label>
                                {/* ✅ NAPRAWIONE: Licznik znaków */}
                                <CharCounter current={textPrompt.length} max={PROMPT_LIMIT} />
                            </div>
                            <Textarea
                                id="text-prompt"
                                value={textPrompt}
                                onChange={handleTextPromptChange}
                                placeholder="np. Post o nowej kolekcji wiosennej, zachęcający do zakupów z kodem rabatowym WIOSNA20"
                                className="min-h-[100px]"
                                maxLength={PROMPT_LIMIT}
                            />
                        </div>

                        {/* Quick prompts - ✅ NAPRAWIONE: Dodają tekst po spacji */}
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                                Szybkie podpowiedzi (kliknij, aby dodać)
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    'Post promocyjny',
                                    'Inspirujący cytat',
                                    'Ogłoszenie nowości',
                                    'Post angażujący',
                                    'Porada ekspercka',
                                ].map((suggestion) => (
                                    <Button
                                        key={suggestion}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => handleTextSuggestionClick(suggestion)}
                                    >
                                        {suggestion}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsGenerateTextOpen(false)}
                        >
                            Anuluj
                        </Button>
                        <Button
                            onClick={handleGenerateText}
                            disabled={!textPrompt.trim() || isGeneratingLocal}
                            className="gap-2 bg-gradient-to-r from-primary to-violet-500"
                        >
                            {isGeneratingLocal ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generowanie...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Generuj
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ============================================================ */}
            {/* Dialog: Generuj obraz - Z LICZNIKIEM */}
            {/* ============================================================ */}
            <Dialog open={isGenerateImageOpen} onOpenChange={setIsGenerateImageOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wand2 className="w-5 h-5 text-violet-500" />
                            Generuj obraz z AI
                        </DialogTitle>
                        <DialogDescription>
                            Opisz obraz, który chcesz wygenerować. Gemini rozumie polski, inne providery auto-tłumaczą.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Provider selector */}
                        <AIProviderSelector
                            type="image"
                            value={selectedImageProvider}
                            selectedModel={selectedImageModel}
                            onChange={handleImageProviderChange}
                        />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="image-prompt">Opis obrazu</Label>
                                {/* ✅ NAPRAWIONE: Licznik znaków */}
                                <CharCounter current={imagePrompt.length} max={PROMPT_LIMIT} />
                            </div>
                            <Textarea
                                id="image-prompt"
                                value={imagePrompt}
                                onChange={handleImagePromptChange}
                                placeholder="np. Minimalistyczne zdjęcie kawy latte art na drewnianym stole, ciepłe światło poranne"
                                className="min-h-[100px]"
                                maxLength={PROMPT_LIMIT}
                            />
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                ℹ️ Prompt zostanie automatycznie przetłumaczony na angielski
                            </p>
                        </div>

                        {/* Style presets - ✅ NAPRAWIONE: Dodają tekst po przecinku */}
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                                Style (kliknij, aby dodać)
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    'Minimalistyczny',
                                    'Profesjonalny',
                                    'Kolorowy',
                                    'Vintage',
                                    'Nowoczesny',
                                    'Naturalny',
                                ].map((style) => (
                                    <Button
                                        key={style}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs"
                                        onClick={() => handleImageStyleClick(style)}
                                    >
                                        {style}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsGenerateImageOpen(false)}
                        >
                            Anuluj
                        </Button>
                        <Button
                            onClick={handleGenerateImage}
                            disabled={!imagePrompt.trim() || isGeneratingLocal}
                            className="gap-2 bg-gradient-to-r from-primary to-violet-500"
                        >
                            {isGeneratingLocal ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generowanie...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4" />
                                    Generuj
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Image Crop Modal */}
            {imageUrl && (
                <ImageCropModal
                    open={isCropModalOpen}
                    onOpenChange={setIsCropModalOpen}
                    imageSrc={imageUrl}
                    onCropComplete={handleCropComplete}
                    initialPlatform={platforms[0] || 'facebook'}
                />
            )}
        </div>
    );
}

export default PostEditor;