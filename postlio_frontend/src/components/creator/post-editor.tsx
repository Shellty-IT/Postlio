// src/components/creator/post-editor.tsx
/**
 * Edytor posta z obsługą AI
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    Sparkles,
    Hash,
    Smile,
    X,
    Loader2,
    Wand2,
    RefreshCw,
    Upload,
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
import type { Platform } from '@/types';

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
    onGenerateText?: (prompt: string) => Promise<string>;
    onGenerateImage?: (prompt: string) => Promise<string | undefined>;
}

// ============================================================
// LIMITY PLATFORM
// ============================================================

const PLATFORM_LIMITS: Record<Platform, number> = {
    facebook: 63206,
    instagram: 2200,
    linkedin: 3000,
};

// ============================================================
// KOMPONENT
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
                           }: PostEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [newHashtag, setNewHashtag] = useState('');
    const [isGenerateTextOpen, setIsGenerateTextOpen] = useState(false);
    const [isGenerateImageOpen, setIsGenerateImageOpen] = useState(false);
    const [textPrompt, setTextPrompt] = useState('');
    const [imagePrompt, setImagePrompt] = useState('');
    const [isGeneratingLocal, setIsGeneratingLocal] = useState(false);

    // Limit znaków (najmniejszy z wybranych platform)
    const charLimit = Math.min(...platforms.map((p) => PLATFORM_LIMITS[p]));
    const charCount = content.length;
    const isOverLimit = charCount > charLimit;

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

    // Generuj tekst
    const handleGenerateText = useCallback(async () => {
        if (!textPrompt.trim() || !onGenerateText) return;

        setIsGeneratingLocal(true);
        try {
            await onGenerateText(textPrompt);
            setIsGenerateTextOpen(false);
            setTextPrompt('');
        } catch {
            // Error handled by parent
        } finally {
            setIsGeneratingLocal(false);
        }
    }, [textPrompt, onGenerateText]);

    // Generuj obraz
    const handleGenerateImage = useCallback(async () => {
        if (!imagePrompt.trim() || !onGenerateImage) return;

        setIsGeneratingLocal(true);
        try {
            await onGenerateImage(imagePrompt);
            setIsGenerateImageOpen(false);
            setImagePrompt('');
        } catch {
            // Error handled by parent
        } finally {
            setIsGeneratingLocal(false);
        }
    }, [imagePrompt, onGenerateImage]);

    // Upload obrazu
    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            onImageChange(url);
        }
    }, [onImageChange]);

    return (
        <div className="space-y-4">
            {/* Główny edytor */}
            <div className="relative">
                <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Co chcesz opublikować? Napisz sam lub użyj AI..."
                    className={`min-h-[200px] resize-none text-base leading-relaxed ${
                        isOverLimit ? 'border-red-500 focus-visible:ring-red-500' : ''
                    }`}
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

                {/* Licznik znaków */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span className={`text-xs ${isOverLimit ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
            {charCount.toLocaleString()} / {charLimit.toLocaleString()}
          </span>
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
                            <Image
                                src={imageUrl}
                                alt="Post image"
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-2">
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

            {/* Dialog: Generuj tekst */}
            <Dialog open={isGenerateTextOpen} onOpenChange={setIsGenerateTextOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-violet-500" />
                            Generuj tekst z AI
                        </DialogTitle>
                        <DialogDescription>
                            Opisz, jaki post chcesz stworzyć. AI wygeneruje treść dopasowaną do wybranych platform.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="text-prompt">Opis posta</Label>
                            <Textarea
                                id="text-prompt"
                                value={textPrompt}
                                onChange={(e) => setTextPrompt(e.target.value)}
                                placeholder="np. Post o nowej kolekcji wiosennej, zachęcający do zakupów z kodem rabatowym WIOSNA20"
                                className="min-h-[100px]"
                            />
                        </div>

                        {/* Quick prompts */}
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Szybkie podpowiedzi</Label>
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
                                        onClick={() => setTextPrompt(suggestion)}
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

            {/* Dialog: Generuj obraz */}
            <Dialog open={isGenerateImageOpen} onOpenChange={setIsGenerateImageOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wand2 className="w-5 h-5 text-violet-500" />
                            Generuj obraz z AI
                        </DialogTitle>
                        <DialogDescription>
                            Opisz obraz, który chcesz wygenerować. Im dokładniejszy opis, tym lepszy rezultat.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="image-prompt">Opis obrazu</Label>
                            <Textarea
                                id="image-prompt"
                                value={imagePrompt}
                                onChange={(e) => setImagePrompt(e.target.value)}
                                placeholder="np. Minimalistyczne zdjęcie kawy latte art na drewnianym stole, ciepłe światło poranne, styl Instagram"
                                className="min-h-[100px]"
                            />
                        </div>

                        {/* Style presets */}
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Style</Label>
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
                                        onClick={() => setImagePrompt((prev) => `${prev} ${style.toLowerCase()} styl`)}
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
        </div>
    );
}

export default PostEditor;