// src/components/creator/ai-provider-selector.tsx
/**
 * Elegancki selektor providerów AI
 *
 * Pozwala na wybór providera dla tekstu i obrazów osobno.
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles,
    Image as ImageIcon,
    Check,
    Zap,
    Brain,
    Palette,
    Star,
    ChevronDown,
    Info,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAIProviders } from '@/hooks';
import type { TextProvider, ImageProvider } from '@/lib/api/ai';

// ============================================================
// TYPY
// ============================================================

interface ProviderOption {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    color: string;
    features: string[];
}

interface AIProviderSelectorProps {
    type: 'text' | 'image';
    value?: string;
    onChange: (provider: string, model?: string) => void;
    selectedModel?: string;
    compact?: boolean;
    className?: string;
}

// ============================================================
// KONFIGURACJA PROVIDERÓW
// ============================================================

const TEXT_PROVIDERS: ProviderOption[] = [
    {
        id: 'gemini',
        name: 'Gemini 2.5 Flash',
        description: 'Szybki i kreatywny, świetny do różnorodnych treści',
        icon: Sparkles,
        color: 'from-blue-500 to-cyan-500',
        features: ['Szybki', 'Kreatywny', 'Polski język'],
    },
    {
        id: 'groq',
        name: 'Groq (Llama 3.3)',
        description: 'Błyskawiczny, idealny do prostych postów',
        icon: Zap,
        color: 'from-orange-500 to-yellow-500',
        features: ['Ultra szybki', 'Precyzyjny', 'Darmowy'],
    },
];

const IMAGE_PROVIDERS: ProviderOption[] = [
    {
        id: 'pollinations',
        name: 'Pollinations',
        description: 'Darmowy, szybki. Auto-tłumaczenie z polskiego!',
        icon: Palette,
        color: 'from-green-500 to-emerald-500',
        features: ['Darmowy', 'Szybki', 'Bez limitu'],
    },
    {
        id: 'huggingface',
        name: 'HuggingFace FLUX',
        description: 'Wysoka jakość, realistyczne obrazy',
        icon: Brain,
        color: 'from-yellow-500 to-orange-500',
        features: ['Wysoka jakość', 'Realistyczny', 'Auto-tłumaczenie'],
    },
    // TODO: Gemini Image - wymaga włączenia billing w Google Cloud
    // Odkomentuj gdy podepniesz kartę
];

// ============================================================
// KOMPONENT KARTY PROVIDERA
// ============================================================

interface ProviderCardProps {
    provider: ProviderOption;
    isSelected: boolean;
    isDefault: boolean;
    isAvailable: boolean;
    onSelect: () => void;
}

function ProviderCard({
                          provider,
                          isSelected,
                          isDefault,
                          isAvailable,
                          onSelect,
                      }: ProviderCardProps) {
    const Icon = provider.icon;

    return (
        <motion.button
            whileHover={{ scale: isAvailable ? 1.01 : 1 }}
            whileTap={{ scale: isAvailable ? 0.99 : 1 }}
            onClick={onSelect}
            disabled={!isAvailable}
            className={cn(
                "relative w-full p-3 rounded-xl border-2 text-left transition-all duration-200",
                isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border/50 hover:border-border bg-card/50",
                !isAvailable && "opacity-50 cursor-not-allowed"
            )}
        >
            {/* Selected indicator */}
            {isSelected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                    <Check className="w-3 h-3 text-primary-foreground" />
                </motion.div>
            )}

            {/* Default badge */}
            {isDefault && (
                <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-amber-500">
                    <Star className="w-3 h-3 fill-amber-500" />
                    <span>Domyślny</span>
                </div>
            )}

            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn(
                    "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                    provider.color
                )}>
                    <Icon className="w-5 h-5 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{provider.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {provider.description}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-1 mt-2">
                        {provider.features.map((feature) => (
                            <span
                                key={feature}
                                className="px-1.5 py-0.5 text-[10px] rounded-md bg-muted text-muted-foreground"
                            >
                                {feature}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Unavailable overlay */}
            {!isAvailable && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl">
                    <span className="text-xs text-muted-foreground">Niedostępny</span>
                </div>
            )}
        </motion.button>
    );
}

// ============================================================
// GŁÓWNY KOMPONENT
// ============================================================

export function AIProviderSelector({
                                       type,
                                       value,
                                       onChange,
                                       compact = false,
                                       className,
                                   }: AIProviderSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { data: providersData, isLoading } = useAIProviders();

    const providers = type === 'text' ? TEXT_PROVIDERS : IMAGE_PROVIDERS;
    const apiProviders = type === 'text'
        ? providersData?.text_providers
        : providersData?.image_providers;

    // Znajdź wybranego providera lub domyślnego
    const defaultProvider = apiProviders?.find(p => p.is_default)?.name?.toLowerCase() || providers[0].id;
    const selectedId = value || defaultProvider;
    const selectedProvider = providers.find(p => p.id === selectedId) || providers[0];

    const handleSelect = (providerId: string) => {
        onChange(providerId);
        setIsOpen(false);
    };

    // Sprawdź dostępność providera
    const isProviderAvailable = (providerId: string): boolean => {
        if (!apiProviders) return true;
        const provider = apiProviders.find(
            p => p.name.toLowerCase().includes(providerId)
        );
        return provider?.available ?? true;
    };

    const isProviderDefault = (providerId: string): boolean => {
        if (!apiProviders) return providerId === providers[0].id;
        const provider = apiProviders.find(
            p => p.name.toLowerCase().includes(providerId)
        );
        return provider?.is_default ?? false;
    };

    const Icon = selectedProvider.icon;

    // Wersja kompaktowa - tylko przycisk
    if (compact) {
        return (
            <TooltipProvider>
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn("gap-2 h-8", className)}
                                    disabled={isLoading}
                                >
                                    <div className={cn(
                                        "w-4 h-4 rounded bg-gradient-to-br flex items-center justify-center",
                                        selectedProvider.color
                                    )}>
                                        <Icon className="w-2.5 h-2.5 text-white" />
                                    </div>
                                    <span className="text-xs max-w-[100px] truncate">
                                        {selectedProvider.name.split(' ')[0]}
                                    </span>
                                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                </Button>
                            </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Zmień providera {type === 'text' ? 'tekstu' : 'obrazów'}</p>
                        </TooltipContent>
                    </Tooltip>

                    <PopoverContent className="w-80 p-2" align="start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                                {type === 'text' ? (
                                    <Sparkles className="w-3.5 h-3.5" />
                                ) : (
                                    <ImageIcon className="w-3.5 h-3.5" />
                                )}
                                <span>
                                    {type === 'text' ? 'Provider tekstu' : 'Provider obrazów'}
                                </span>
                            </div>

                            <div className="space-y-1.5">
                                {providers.map((provider) => (
                                    <ProviderCard
                                        key={provider.id}
                                        provider={provider}
                                        isSelected={selectedId === provider.id}
                                        isDefault={isProviderDefault(provider.id)}
                                        isAvailable={isProviderAvailable(provider.id)}
                                        onSelect={() => handleSelect(provider.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </TooltipProvider>
        );
    }

    // Wersja pełna - karty
    return (
        <div className={cn("space-y-3", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                    {type === 'text' ? (
                        <>
                            <Sparkles className="w-4 h-4 text-violet-500" />
                            <span>Provider AI dla tekstu</span>
                        </>
                    ) : (
                        <>
                            <ImageIcon className="w-4 h-4 text-violet-500" />
                            <span>Provider AI dla obrazów</span>
                        </>
                    )}
                </div>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                            <p>
                                {type === 'text'
                                    ? 'Wybierz model AI do generowania tekstu. Każdy ma inne mocne strony.'
                                    : 'Wybierz generator obrazów. Oba auto-tłumaczą polskie prompty.'}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Provider cards */}
            <div className="grid gap-2">
                {providers.map((provider) => (
                    <ProviderCard
                        key={provider.id}
                        provider={provider}
                        isSelected={selectedId === provider.id}
                        isDefault={isProviderDefault(provider.id)}
                        isAvailable={isProviderAvailable(provider.id)}
                        onSelect={() => handleSelect(provider.id)}
                    />
                ))}
            </div>

            {/* Loading state */}
            {isLoading && (
                <p className="text-xs text-muted-foreground text-center">
                    Sprawdzanie dostępności...
                </p>
            )}
        </div>
    );
}

// ============================================================
// WERSJA INLINE - do użycia w jednej linii
// ============================================================

interface InlineProviderSelectorProps {
    textProvider?: TextProvider;
    imageProvider?: ImageProvider;
    onTextProviderChange: (provider: TextProvider) => void;
    onImageProviderChange: (provider: ImageProvider) => void;
    className?: string;
}

export function InlineProviderSelector({
                                           textProvider,
                                           imageProvider,
                                           onTextProviderChange,
                                           onImageProviderChange,
                                           className,
                                       }: InlineProviderSelectorProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <span className="text-xs text-muted-foreground">AI:</span>
            <AIProviderSelector
                type="text"
                value={textProvider}
                onChange={(p) => onTextProviderChange(p as TextProvider)}
                compact
            />
            <AIProviderSelector
                type="image"
                value={imageProvider}
                onChange={(p) => onImageProviderChange(p as ImageProvider)}
                compact
            />
        </div>
    );
}

export default AIProviderSelector;