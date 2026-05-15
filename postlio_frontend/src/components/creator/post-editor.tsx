// src/components/creator/post-editor.tsx

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
    Film,
    Download,
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
import { generateVideo as generateVideoApi } from '@/lib/api/ai';
import { cn } from '@/lib/utils';
import type { Platform } from '@/types';
import type { TextProvider, ImageProvider } from '@/lib/api/ai';

interface PostEditorProps {
    content: string;
    onChange: (content: string) => void;
    imageUrl?: string;
    onImageChange: (url: string | undefined) => void;
    videoUrl?: string;
    onVideoChange: (url: string | undefined) => void;
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

const PLATFORM_LIMITS: Record<Platform, number> = {
    facebook: 63206,
    instagram: 2200,
    linkedin: 3000,
};

const PROMPT_LIMIT = 500;
const SOFT_LIMIT = 500;

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
            <div className="w-12 sm:w-16 h-1.5 bg-muted rounded-full overflow-hidden">
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
                'font-medium tabular-nums text-[10px] sm:text-xs',
                isOverLimit ? 'text-red-500' :
                    isNearLimit ? 'text-amber-500' : 'text-muted-foreground'
            )}>
        {current}/{max}
      </span>
        </div>
    );
}

export function PostEditor({
                               content,
                               onChange,
                               imageUrl,
                               onImageChange,
                               videoUrl,
                               onVideoChange,
                               hashtags,
                               onHashtagsChange,
                               platforms,
                               isGenerating = false,
                               onGenerateText,
                               onGenerateImage,
                               defaultTextProvider = 'gemini',
                               defaultImageProvider = 'pollinations',
                               defaultImageModel = 'flux',
                           }: PostEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [newHashtag, setNewHashtag] = useState('');
    const [isGenerateTextOpen, setIsGenerateTextOpen] = useState(false);
    const [isGenerateImageOpen, setIsGenerateImageOpen] = useState(false);
    const [isGenerateVideoOpen, setIsGenerateVideoOpen] = useState(false);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [textPrompt, setTextPrompt] = useState('');
    const [imagePrompt, setImagePrompt] = useState('');
    const [isGeneratingLocal, setIsGeneratingLocal] = useState(false);

    const [selectedTextProvider, setSelectedTextProvider] = useState<TextProvider>(defaultTextProvider);
    const [selectedImageProvider, setSelectedImageProvider] = useState<ImageProvider>(defaultImageProvider);
    const [selectedImageModel, setSelectedImageModel] = useState<string>(defaultImageModel);

    const [videoPrompt, setVideoPrompt] = useState('');
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [videoError, setVideoError] = useState<string | undefined>();

    useEffect(() => {
        setSelectedTextProvider(defaultTextProvider);
    }, [defaultTextProvider]);

    useEffect(() => {
        setSelectedImageProvider(defaultImageProvider);
    }, [defaultImageProvider]);

    useEffect(() => {
        setSelectedImageModel(defaultImageModel);
    }, [defaultImageModel]);

    const charLimit = Math.min(...platforms.map((p) => PLATFORM_LIMITS[p]));
    const charCount = content.length;
    const isOverLimit = charCount > charLimit;
    const isNearSoftLimit = charCount >= SOFT_LIMIT * 0.8 && charCount <= SOFT_LIMIT;
    const isOverSoftLimit = charCount > SOFT_LIMIT && charCount <= charLimit;

    const getCounterColor = () => {
        if (isOverLimit) return 'text-red-500';
        if (isOverSoftLimit) return 'text-amber-500';
        if (isNearSoftLimit) return 'text-yellow-500';
        return 'text-muted-foreground';
    };

    const softLimitPercentage = Math.min((charCount / SOFT_LIMIT) * 100, 100);

    const handleAddHashtag = useCallback(() => {
        const tag = newHashtag.trim().replace(/^#/, '');
        if (tag && !hashtags.includes(tag)) {
            onHashtagsChange([...hashtags, tag]);
        }
        setNewHashtag('');
    }, [newHashtag, hashtags, onHashtagsChange]);

    const handleRemoveHashtag = useCallback((tag: string) => {
        onHashtagsChange(hashtags.filter((h) => h !== tag));
    }, [hashtags, onHashtagsChange]);

    const handleTextSuggestionClick = useCallback((suggestion: string) => {
        setTextPrompt(prev => {
            if (!prev.trim()) return suggestion;
            return `${prev.trim()} ${suggestion}`;
        });
    }, []);

    const handleImageStyleClick = useCallback((style: string) => {
        setImagePrompt(prev => {
            if (!prev.trim()) return style.toLowerCase();
            return `${prev.trim()}, ${style.toLowerCase()} styl`;
        });
    }, []);

    const handleVideoStyleClick = useCallback((style: string) => {
        setVideoPrompt(prev => {
            if (!prev.trim()) return style.toLowerCase();
            return `${prev.trim()}, ${style.toLowerCase()}`;
        });
    }, []);

    const handleGenerateText = useCallback(async () => {
        if (!textPrompt.trim() || !onGenerateText) return;

        setIsGeneratingLocal(true);
        try {
            await onGenerateText(textPrompt, selectedTextProvider);
            setIsGenerateTextOpen(false);
            setTextPrompt('');
        } catch {
        } finally {
            setIsGeneratingLocal(false);
        }
    }, [textPrompt, onGenerateText, selectedTextProvider]);

    const handleGenerateImage = useCallback(async () => {
        if (!imagePrompt.trim() || !onGenerateImage) return;

        setIsGeneratingLocal(true);
        try {
            const result = await onGenerateImage(imagePrompt, selectedImageProvider, selectedImageModel);
            if (result) {
                onVideoChange(undefined);
            }
            setIsGenerateImageOpen(false);
            setImagePrompt('');
        } catch {
        } finally {
            setIsGeneratingLocal(false);
        }
    }, [imagePrompt, onGenerateImage, selectedImageProvider, selectedImageModel, onVideoChange]);

    const handleGenerateVideo = useCallback(async () => {
        if (!videoPrompt.trim()) return;

        setIsGeneratingVideo(true);
        setVideoError(undefined);

        try {
            const result = await generateVideoApi({
                prompt: videoPrompt,
                model: 'seedance',
            });

            if (result.success && result.data?.video_data) {
                onVideoChange(result.data.video_data);
                onImageChange(undefined);
                setIsGenerateVideoOpen(false);
                setVideoPrompt('');
            } else {
                setVideoError(result.error || 'Nie udało się wygenerować filmu');
            }
        } catch {
            setVideoError('Błąd podczas generowania filmu. Spróbuj ponownie.');
        } finally {
            setIsGeneratingVideo(false);
        }
    }, [videoPrompt, onVideoChange, onImageChange]);

    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            onImageChange(url);
            onVideoChange(undefined);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [onImageChange, onVideoChange]);

    const handleImageProviderChange = (provider: string, model?: string) => {
        setSelectedImageProvider(provider as ImageProvider);
        if (provider === 'pollinations') {
            setSelectedImageModel(model || 'flux');
        } else {
            setSelectedImageModel(model || '');
        }
    };

    const handleCropComplete = useCallback((croppedUrl: string) => {
        onImageChange(croppedUrl);
    }, [onImageChange]);

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

    const handleVideoPromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= PROMPT_LIMIT) {
            setVideoPrompt(value);
        }
    }, []);

    const handleDownloadVideo = useCallback(() => {
        if (!videoUrl) return;
        const link = document.createElement('a');
        link.href = videoUrl;
        link.download = `postlio-video-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [videoUrl]);

    const hasMedia = !!imageUrl || !!videoUrl;

    return (
        <div className="space-y-3 sm:space-y-4">
            <div className="relative">
                <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Co chcesz opublikować? Napisz sam lub użyj AI..."
                    className={cn(
                        'min-h-[150px] sm:min-h-[200px] resize-none text-sm sm:text-base leading-relaxed pb-10',
                        isOverLimit && 'border-red-500 focus-visible:ring-red-500'
                    )}
                    disabled={isGenerating}
                />

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
                                <span className="font-medium text-sm sm:text-base">AI generuje treść...</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 flex items-center gap-2 sm:gap-3">
                    <div className="hidden xs:flex items-center gap-2">
                        <div className="w-16 sm:w-20 h-1.5 bg-muted rounded-full overflow-hidden">
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

                    <div className={cn('flex items-center gap-1 text-[10px] sm:text-xs font-medium', getCounterColor())}>
                        {isOverSoftLimit && !isOverLimit && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Długi post może mieć mniejsze zaangażowanie</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
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

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsGenerateTextOpen(true)}
                                disabled={isGenerating}
                                className="gap-1.5 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                            >
                                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-500" />
                                <span className="hidden xs:inline">Generuj tekst</span>
                                <span className="xs:hidden">Tekst</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Wygeneruj tekst z AI</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsGenerateImageOpen(true)}
                                disabled={isGenerating}
                                className={cn(
                                    "gap-1.5 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3",
                                    videoUrl && "opacity-50"
                                )}
                            >
                                <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-500" />
                                <span className="hidden xs:inline">Generuj obraz</span>
                                <span className="xs:hidden">Obraz</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{videoUrl ? 'Zastąpi aktualny film' : 'Wygeneruj obraz z AI'}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsGenerateVideoOpen(true)}
                                disabled={isGenerating || isGeneratingVideo}
                                className={cn(
                                    "gap-1.5 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3",
                                    imageUrl && !videoUrl && "opacity-50"
                                )}
                            >
                                <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-500" />
                                <span className="hidden xs:inline">Generuj film</span>
                                <span className="xs:hidden">Film</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{imageUrl && !videoUrl ? 'Zastąpi aktualne zdjęcie' : 'Wygeneruj film z AI'}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isGenerating}
                                className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                            >
                                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Dodaj obraz</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={isGenerating}
                                className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                            >
                                <Smile className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Dodaj emoji</TooltipContent>
                    </Tooltip>

                    <div className="flex items-center gap-1 ml-auto">
                        <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground hidden xs:block" />
                        <Input
                            value={newHashtag}
                            onChange={(e) => setNewHashtag(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddHashtag();
                                }
                            }}
                            placeholder="Hashtag"
                            className="w-20 xs:w-28 sm:w-32 h-8 sm:h-9 text-xs sm:text-sm"
                            disabled={isGenerating}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleAddHashtag}
                            disabled={!newHashtag.trim() || isGenerating}
                            className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                        >
                            <span className="hidden xs:inline">Dodaj</span>
                            <span className="xs:hidden">+</span>
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

            {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {hashtags.map((tag) => (
                        <Badge
                            key={tag}
                            variant="secondary"
                            className="gap-1 cursor-pointer hover:bg-destructive/10 text-xs sm:text-sm py-0.5 sm:py-1"
                            onClick={() => handleRemoveHashtag(tag)}
                        >
                            #{tag}
                            <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </Badge>
                    ))}
                </div>
            )}

            <AnimatePresence mode="wait">
                {imageUrl && !videoUrl && (
                    <motion.div
                        key="image"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative rounded-lg overflow-hidden border border-border"
                    >
                        <div className="relative w-full h-48 xs:h-64 sm:h-80">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageUrl}
                                alt="Post image"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1.5 sm:gap-2">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8 bg-background/80 backdrop-blur-sm"
                                onClick={() => setIsCropModalOpen(true)}
                            >
                                <Crop className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8 bg-background/80 backdrop-blur-sm"
                                onClick={() => setIsGenerateImageOpen(true)}
                            >
                                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8 bg-background/80 backdrop-blur-sm"
                                onClick={() => onImageChange(undefined)}
                            >
                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {videoUrl && !imageUrl && (
                    <motion.div
                        key="video"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative rounded-lg overflow-hidden border border-border bg-black"
                    >
                        <video
                            src={videoUrl}
                            controls
                            playsInline
                            className="w-full max-h-48 xs:max-h-64 sm:max-h-80 rounded-lg"
                        />
                        <div className="absolute top-2 right-2 flex gap-1.5 sm:gap-2">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8 bg-background/80 backdrop-blur-sm"
                                onClick={handleDownloadVideo}
                            >
                                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8 bg-background/80 backdrop-blur-sm"
                                onClick={() => setIsGenerateVideoOpen(true)}
                            >
                                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8 bg-background/80 backdrop-blur-sm"
                                onClick={() => onVideoChange(undefined)}
                            >
                                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                        </div>
                        <div className="absolute bottom-2 left-2">
                            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-[10px] sm:text-xs gap-1">
                                <Film className="w-3 h-3" />
                                Wygenerowany film
                            </Badge>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Dialog open={isGenerateTextOpen} onOpenChange={setIsGenerateTextOpen}>
                <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
                            Generuj tekst z AI
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                            Opisz, jaki post chcesz stworzyć.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2 sm:py-4">
                        <AIProviderSelector
                            type="text"
                            value={selectedTextProvider}
                            onChange={(p) => setSelectedTextProvider(p as TextProvider)}
                        />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="text-prompt" className="text-sm">Opis posta</Label>
                                <CharCounter current={textPrompt.length} max={PROMPT_LIMIT} />
                            </div>
                            <Textarea
                                id="text-prompt"
                                value={textPrompt}
                                onChange={handleTextPromptChange}
                                placeholder="np. Post o nowej kolekcji wiosennej..."
                                className="min-h-[80px] sm:min-h-[100px] text-sm"
                                maxLength={PROMPT_LIMIT}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                                Szybkie podpowiedzi
                            </Label>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {[
                                    'Post promocyjny',
                                    'Inspirujący cytat',
                                    'Ogłoszenie nowości',
                                    'Post angażujący',
                                ].map((suggestion) => (
                                    <Button
                                        key={suggestion}
                                        variant="outline"
                                        size="sm"
                                        className="text-[10px] sm:text-xs h-7 sm:h-8"
                                        onClick={() => handleTextSuggestionClick(suggestion)}
                                    >
                                        {suggestion}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsGenerateTextOpen(false)}
                            className="flex-1 sm:flex-none"
                        >
                            Anuluj
                        </Button>
                        <Button
                            onClick={handleGenerateText}
                            disabled={!textPrompt.trim() || isGeneratingLocal}
                            className="flex-1 sm:flex-none gap-2 bg-gradient-to-r from-primary to-violet-500"
                        >
                            {isGeneratingLocal ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="hidden xs:inline">Generowanie...</span>
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

            <Dialog open={isGenerateImageOpen} onOpenChange={setIsGenerateImageOpen}>
                <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Wand2 className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
                            Generuj obraz z AI
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                            {videoUrl
                                ? 'Wygenerowanie obrazu zastąpi aktualny film.'
                                : 'Opisz obraz, który chcesz wygenerować.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2 sm:py-4">
                        <AIProviderSelector
                            type="image"
                            value={selectedImageProvider}
                            selectedModel={selectedImageModel}
                            onChange={handleImageProviderChange}
                        />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="image-prompt" className="text-sm">Opis obrazu</Label>
                                <CharCounter current={imagePrompt.length} max={PROMPT_LIMIT} />
                            </div>
                            <Textarea
                                id="image-prompt"
                                value={imagePrompt}
                                onChange={handleImagePromptChange}
                                placeholder="np. Minimalistyczne zdjęcie kawy..."
                                className="min-h-[80px] sm:min-h-[100px] text-sm"
                                maxLength={PROMPT_LIMIT}
                            />
                            <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400">
                                ✨ Prompt zostanie automatycznie ulepszony
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                                Style
                            </Label>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {[
                                    'Minimalistyczny',
                                    'Profesjonalny',
                                    'Kolorowy',
                                    'Naturalny',
                                ].map((style) => (
                                    <Button
                                        key={style}
                                        variant="outline"
                                        size="sm"
                                        className="text-[10px] sm:text-xs h-7 sm:h-8"
                                        onClick={() => handleImageStyleClick(style)}
                                    >
                                        {style}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsGenerateImageOpen(false)}
                            className="flex-1 sm:flex-none"
                        >
                            Anuluj
                        </Button>
                        <Button
                            onClick={handleGenerateImage}
                            disabled={!imagePrompt.trim() || isGeneratingLocal}
                            className="flex-1 sm:flex-none gap-2 bg-gradient-to-r from-primary to-violet-500"
                        >
                            {isGeneratingLocal ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="hidden xs:inline">Generowanie...</span>
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

            <Dialog open={isGenerateVideoOpen} onOpenChange={(open) => {
                setIsGenerateVideoOpen(open);
                if (!open) setVideoError(undefined);
            }}>
                <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Film className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
                            Generuj film z AI
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                            {imageUrl && !videoUrl
                                ? 'Wygenerowanie filmu zastąpi aktualne zdjęcie.'
                                : 'Opisz film, który chcesz stworzyć.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2 sm:py-4">
                        <AIProviderSelector
                            type="video"
                            value="pollinations"
                            selectedModel="seedance"
                            onChange={() => {}}
                        />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="video-prompt" className="text-sm">Opis filmu</Label>
                                <CharCounter current={videoPrompt.length} max={PROMPT_LIMIT} />
                            </div>
                            <Textarea
                                id="video-prompt"
                                value={videoPrompt}
                                onChange={handleVideoPromptChange}
                                placeholder="np. Płynna animacja wschodu słońca nad morzem z delikatnym ruchem fal..."
                                className="min-h-[80px] sm:min-h-[100px] text-sm"
                                maxLength={PROMPT_LIMIT}
                            />
                            <div className="space-y-0.5">
                                <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400">
                                    ✨ Prompt zostanie automatycznie ulepszony i przetłumaczony
                                </p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground">
                                    ⏱️ Generowanie trwa ok. 30s - 2 min
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                                Style
                            </Label>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {[
                                    'Kinematograficzny',
                                    'Dynamiczny',
                                    'Spokojny',
                                    'Naturalny',
                                ].map((style) => (
                                    <Button
                                        key={style}
                                        variant="outline"
                                        size="sm"
                                        className="text-[10px] sm:text-xs h-7 sm:h-8"
                                        onClick={() => handleVideoStyleClick(style)}
                                    >
                                        {style}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {videoError && (
                            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-lg p-3 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>{videoError}</span>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsGenerateVideoOpen(false)}
                            disabled={isGeneratingVideo}
                            className="flex-1 sm:flex-none"
                        >
                            Anuluj
                        </Button>
                        <Button
                            onClick={handleGenerateVideo}
                            disabled={!videoPrompt.trim() || isGeneratingVideo}
                            className="flex-1 sm:flex-none gap-2 bg-gradient-to-r from-primary to-violet-500"
                        >
                            {isGeneratingVideo ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="hidden xs:inline">Generowanie...</span>
                                    <span className="xs:hidden">Generuję...</span>
                                </>
                            ) : (
                                <>
                                    <Film className="w-4 h-4" />
                                    Generuj film
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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