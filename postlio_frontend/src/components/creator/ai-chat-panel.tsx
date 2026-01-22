// src/components/creator/ai-chat-panel.tsx
/**
 * Panel czatu z AI - z obsługą providerów
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    MessageSquare,
    Send,
    Sparkles,
    ChevronRight,
    Loader2,
    Copy,
    Check,
    Image as ImageIcon,
    Wand2,
    Lightbulb,
    Settings2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AIProviderSelector } from './ai-provider-selector';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useAIChat, useGenerateText, useGenerateImage } from '@/hooks';
import type { Platform } from '@/types';
import type {
    ChatMessage as APIChatMessage,
    TextGenerationResponse,
    ImageGenerationResponse,
    Platform as AIPlatform,
    TextProvider,
    ImageProvider,
} from '@/lib/api/ai';

// ============================================================
// TYPY
// ============================================================

interface AIChatPanelProps {
    isOpen: boolean;
    onToggle: () => void;
    currentContent: string;
    selectedPlatforms: Platform[];
    selectedBrandId: string | undefined;
    selectedBrandName: string | undefined;
    onContentGenerated: (content: string) => void;
    onImageGenerated: (imageUrl: string) => void;
    isGeneratingText?: boolean;
    isGeneratingImage?: boolean;
    textProvider?: TextProvider;
    imageProvider?: ImageProvider;
}

interface ChatMessageDisplay {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    isLoading?: boolean;
    generatedContent?: string;
    generatedImage?: string;
    provider?: string;
}

// ============================================================
// SUGGESTIONS
// ============================================================

const QUICK_ACTIONS = [
    { icon: Sparkles, label: 'Napisz post', prompt: 'Napisz angażujący post o ' },
    { icon: Wand2, label: 'Ulepsz tekst', prompt: 'Ulepsz ten tekst: ' },
    { icon: ImageIcon, label: 'Opisz obraz', prompt: 'Wygeneruj obraz przedstawiający ' },
    { icon: Lightbulb, label: 'Daj pomysły', prompt: 'Daj mi 5 pomysłów na posty o ' },
];

// ============================================================
// KOMPONENT
// ============================================================

export function AIChatPanel({
                                isOpen,
                                onToggle,
                                selectedPlatforms,
                                selectedBrandName,
                                onContentGenerated,
                                onImageGenerated,
                                isGeneratingText = false,
                                isGeneratingImage = false,
                                textProvider: externalTextProvider = 'gemini',
                                imageProvider: externalImageProvider = 'pollinations',
                            }: AIChatPanelProps) {
    const [messages, setMessages] = useState<ChatMessageDisplay[]>([]);
    const [input, setInput] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Local provider state (can be different from parent)
    const [localTextProvider, setLocalTextProvider] = useState<TextProvider>(externalTextProvider);
    const [localImageProvider, setLocalImageProvider] = useState<ImageProvider>(externalImageProvider);

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Sync with external providers
    useEffect(() => {
        setLocalTextProvider(externalTextProvider);
    }, [externalTextProvider]);

    useEffect(() => {
        setLocalImageProvider(externalImageProvider);
    }, [externalImageProvider]);

    // Convert Platform to AIPlatform
    const getAIPlatform = useCallback((): AIPlatform => {
        const platform = selectedPlatforms[0];
        if (platform === 'facebook' || platform === 'instagram' || platform === 'linkedin') {
            return platform;
        }
        return 'facebook';
    }, [selectedPlatforms]);

    // Hooks
    const chatMutation = useAIChat({
        onSuccess: (data) => {
            const newMessage: ChatMessageDisplay = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: data.message,
                timestamp: new Date(),
                provider: data.provider,
            };
            setMessages((prev) => [...prev, newMessage]);
        },
    });

    const textMutation = useGenerateText({
        onSuccess: (data: TextGenerationResponse) => {
            if (data.success && data.data) {
                onContentGenerated(data.data.content);
                const newMessage: ChatMessageDisplay = {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: `✨ Wygenerowałem tekst używając **${data.data.provider}** i dodałem go do edytora.`,
                    timestamp: new Date(),
                    generatedContent: data.data.content,
                    provider: data.data.provider,
                };
                setMessages((prev) => [...prev, newMessage]);
            }
        },
    });

    const imageMutation = useGenerateImage({
        onSuccess: (data: ImageGenerationResponse) => {
            if (data.success && data.data) {
                // Obsłuż oba przypadki: image_url (Pollinations) lub image_data (HuggingFace/ClipDrop)
                const generatedImageUrl = data.data.image_url || data.data.image_data;

                if (generatedImageUrl) {
                    onImageGenerated(generatedImageUrl);
                    const newMessage: ChatMessageDisplay = {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: `🎨 Wygenerowałem obraz używając **${data.data.provider}** i dodałem go do posta.`,
                        timestamp: new Date(),
                        generatedImage: generatedImageUrl,
                        provider: data.data.provider,
                    };
                    setMessages((prev) => [...prev, newMessage]);
                }
            }
        },
    });

    const isLoading = chatMutation.isPending || textMutation.isPending || imageMutation.isPending || isGeneratingText || isGeneratingImage;

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Welcome message
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    id: 'welcome',
                    role: 'assistant',
                    content: `Cześć! 👋 Jestem Twoim asystentem AI. Mogę pomóc Ci:\n\n• Napisać angażujący post\n• Wygenerować obraz\n• Ulepszyć istniejący tekst\n• Zasugerować hashtagi\n\nMożesz zmienić model AI klikając ⚙️ w prawym górnym rogu.`,
                    timestamp: new Date(),
                },
            ]);
        }
    }, [messages.length]);

    // Handle send
    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessageDisplay = {
            id: crypto.randomUUID(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
        const currentInput = input.trim();
        setInput('');

        const lowerInput = currentInput.toLowerCase();

        // Detect intent
        if (lowerInput.includes('obraz') || lowerInput.includes('zdjęcie') || lowerInput.includes('grafik')) {
            try {
                await imageMutation.mutateAsync({
                    prompt: currentInput,
                    width: selectedPlatforms.includes('instagram') ? 1080 : 1200,
                    height: selectedPlatforms.includes('instagram') ? 1080 : 630,
                    style: 'professional',
                    provider: localImageProvider,
                });
            } catch {
                // Error handled by hook
            }
        } else if (
            lowerInput.includes('napisz') ||
            lowerInput.includes('stwórz') ||
            lowerInput.includes('wygeneruj') ||
            lowerInput.includes('post')
        ) {
            try {
                await textMutation.mutateAsync({
                    topic: currentInput,
                    platform: getAIPlatform(),
                    tone: 'professional',
                    language: 'pl',
                    include_hashtags: true,
                    include_emoji: true,
                    provider: localTextProvider,
                });
            } catch {
                // Error handled by hook
            }
        } else {
            try {
                const chatMessages: APIChatMessage[] = messages
                    .filter(m => m.role === 'user' || m.role === 'assistant')
                    .map((m) => ({
                        role: m.role as 'user' | 'assistant',
                        content: m.content
                    }));

                chatMessages.push({ role: 'user', content: currentInput });

                await chatMutation.mutateAsync({
                    messages: chatMessages,
                    platform: getAIPlatform(),
                    provider: localTextProvider,
                });
            } catch {
                // Error handled by hook
            }
        }
    }, [input, isLoading, messages, selectedPlatforms, chatMutation, textMutation, imageMutation, getAIPlatform, localTextProvider, localImageProvider]);

    // Quick action
    const handleQuickAction = useCallback((prompt: string) => {
        setInput(prompt);
        inputRef.current?.focus();
    }, []);

    // Copy content
    const handleCopy = useCallback((content: string, id: string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    // Use generated content
    const handleUseContent = useCallback((content: string) => {
        onContentGenerated(content);
    }, [onContentGenerated]);

    return (
        <>
            {/* Toggle button when closed */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onClick={onToggle}
                        className="fixed right-4 bottom-24 md:bottom-4 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-primary to-violet-500 text-white shadow-lg hover:shadow-xl transition-shadow"
                    >
                        <MessageSquare className="w-5 h-5" />
                        <span className="hidden sm:inline font-medium">Asystent AI</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Panel */}
            <motion.div
                initial={false}
                animate={{ width: isOpen ? 400 : 0 }}
                className="relative flex-shrink-0 border-l border-border/40 bg-background overflow-hidden"
            >
                <div className="absolute inset-0 flex flex-col" style={{ width: 400 }}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border/40">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Asystent AI</h3>
                                <p className="text-xs text-muted-foreground">
                                    {selectedBrandName ? `Brand: ${selectedBrandName}` : 'Gotowy do pomocy'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            {/* Settings popover */}
                            <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Settings2 className="w-4 h-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80" align="end">
                                    <div className="space-y-4">
                                        <h4 className="font-medium text-sm">Ustawienia AI</h4>

                                        <AIProviderSelector
                                            type="text"
                                            value={localTextProvider}
                                            onChange={(p) => setLocalTextProvider(p as TextProvider)}
                                        />

                                        <AIProviderSelector
                                            type="image"
                                            value={localImageProvider}
                                            onChange={(p) => setLocalImageProvider(p as ImageProvider)}
                                        />
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea ref={scrollRef} className="flex-1 p-4">
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                            message.role === 'user'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted'
                                        }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                                        {/* Generated content preview */}
                                        {message.generatedContent && (
                                            <div className="mt-3 p-3 rounded-lg bg-background/50 border border-border/50">
                                                <p className="text-xs text-muted-foreground mb-2">Wygenerowany tekst:</p>
                                                <p className="text-sm line-clamp-3">{message.generatedContent}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-7 text-xs"
                                                        onClick={() => handleCopy(message.generatedContent!, message.id)}
                                                    >
                                                        {copiedId === message.id ? (
                                                            <Check className="w-3 h-3 mr-1" />
                                                        ) : (
                                                            <Copy className="w-3 h-3 mr-1" />
                                                        )}
                                                        Kopiuj
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-7 text-xs"
                                                        onClick={() => handleUseContent(message.generatedContent!)}
                                                    >
                                                        Użyj
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Generated image preview */}
                                        {message.generatedImage && (
                                            <div className="mt-3 relative w-full h-40">
                                                <Image
                                                    src={message.generatedImage}
                                                    alt="Generated"
                                                    fill
                                                    className="rounded-lg object-cover"
                                                    unoptimized
                                                />
                                            </div>
                                        )}

                                        <p className="text-[10px] opacity-60 mt-1">
                                            {message.timestamp.toLocaleTimeString('pl-PL', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Loading indicator */}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-muted rounded-2xl px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                            <span className="text-sm text-muted-foreground">AI myśli...</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Quick actions */}
                    {messages.length <= 1 && (
                        <div className="p-4 border-t border-border/40">
                            <p className="text-xs text-muted-foreground mb-2">Szybkie akcje</p>
                            <div className="grid grid-cols-2 gap-2">
                                {QUICK_ACTIONS.map((action) => (
                                    <Button
                                        key={action.label}
                                        variant="outline"
                                        size="sm"
                                        className="justify-start gap-2 h-auto py-2"
                                        onClick={() => handleQuickAction(action.prompt)}
                                    >
                                        <action.icon className="w-4 h-4 text-violet-500" />
                                        <span className="text-xs">{action.label}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-4 border-t border-border/40">
                        <div className="flex gap-2">
                            <Textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Napisz wiadomość..."
                                className="min-h-[44px] max-h-32 resize-none"
                                disabled={isLoading}
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="px-3 bg-gradient-to-r from-primary to-violet-500"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
}

export default AIChatPanel;