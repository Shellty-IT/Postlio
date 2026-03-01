// src/components/creator/ai-provider-selector.tsx

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles,
    Image as ImageIcon,
    Check,
    Zap,
    Brain,
    Star,
    ChevronDown,
    Info,
    Rocket,
    Film,
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

interface ProviderOption {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    color: string;
    features: string[];
    backendProvider?: string;
    backendModel?: string;
}

interface AIProviderSelectorProps {
    type: 'text' | 'image' | 'video';
    value?: string;
    onChange: (provider: string, model?: string) => void;
    selectedModel?: string;
    compact?: boolean;
    className?: string;
}

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
        id: 'flux',
        name: 'Flux',
        description: 'Wysoka jakość i szczegółowe obrazy.',
        icon: Star,
        color: 'from-violet-500 to-purple-500',
        features: ['Wysoka jakość', 'Fotorealizm', '~15s'],
        backendProvider: 'pollinations',
        backendModel: 'flux',
    },
    {
        id: 'gptimage',
        name: 'GPT Image 1 Mini',
        description: 'Szybki model od OpenAI. Dobra jakość i kreatywność.',
        icon: Zap,
        color: 'from-emerald-500 to-teal-500',
        features: ['OpenAI', 'Kreatywny', '~10s'],
        backendProvider: 'pollinations',
        backendModel: 'gptimage',
    },
    {
        id: 'huggingface',
        name: 'Stable Diffusion XL',
        description: 'Średnia jakość i realistyczne obrazy.',
        icon: Brain,
        color: 'from-green-500 to-emerald-500',
        features: ['Wysoka jakość', 'Realistyczny', '~30s'],
        backendProvider: 'huggingface',
        backendModel: undefined,
    },
];

const VIDEO_PROVIDERS: ProviderOption[] = [
    {
        id: 'seedance',
        name: 'Seedance Lite',
        description: 'Generowanie filmów z opisu tekstowego. Płynny ruch i dobra jakość.',
        icon: Film,
        color: 'from-pink-500 to-rose-500',
        features: ['Z promptu', 'Płynny ruch', '~30s - 2 min'],
        backendProvider: 'pollinations',
        backendModel: 'seedance',
    },
];

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
            {isSelected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                    <Check className="w-3 h-3 text-primary-foreground" />
                </motion.div>
            )}

            {isDefault && (
                <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-amber-500">
                    <Rocket className="w-3 h-3" />
                    <span>Polecany</span>
                </div>
            )}

            <div className="flex items-start gap-3">
                <div className={cn(
                    "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                    provider.color
                )}>
                    <Icon className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{provider.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {provider.description}
                    </p>

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

            {!isAvailable && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl">
                    <span className="text-xs text-muted-foreground">Niedostępny</span>
                </div>
            )}
        </motion.button>
    );
}

export function AIProviderSelector({
                                       type,
                                       value,
                                       onChange,
                                       selectedModel,
                                       compact = false,
                                       className,
                                   }: AIProviderSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { data: providersData, isLoading } = useAIProviders();

    const providers = type === 'text'
        ? TEXT_PROVIDERS
        : type === 'image'
            ? IMAGE_PROVIDERS
            : VIDEO_PROVIDERS;

    const getSelectedId = () => {
        if (type === 'text') {
            return value || 'gemini';
        }
        if (type === 'video') {
            return 'seedance';
        }
        if (value === 'pollinations' && selectedModel === 'gptimage') {
            return 'gptimage';
        }
        if (value === 'pollinations' && selectedModel === 'flux') {
            return 'flux';
        }
        if (value === 'huggingface') {
            return 'huggingface';
        }
        return 'flux';
    };

    const selectedId = getSelectedId();
    const selectedProvider = providers.find(p => p.id === selectedId) || providers[0];

    const handleSelect = (provider: ProviderOption) => {
        if (type === 'text') {
            onChange(provider.id);
        } else {
            onChange(
                provider.backendProvider || provider.id,
                provider.backendModel
            );
        }
        setIsOpen(false);
    };

    const isProviderAvailable = (provider: ProviderOption): boolean => {
        if (!providersData) return true;

        let apiProviders;
        if (type === 'text') {
            apiProviders = providersData.text_providers;
        } else if (type === 'image') {
            apiProviders = providersData.image_providers;
        } else {
            apiProviders = providersData.video_providers;
        }

        const backendName = provider.backendProvider || provider.id;
        const backendProvider = apiProviders?.find(
            p => p.name.toLowerCase().includes(backendName.toLowerCase())
        );

        return backendProvider?.available ?? true;
    };

    const getDefaultId = () => {
        if (type === 'text') return 'gemini';
        if (type === 'image') return 'flux';
        return 'seedance';
    };

    const getTypeLabel = () => {
        if (type === 'text') return 'tekstu';
        if (type === 'image') return 'obrazu';
        return 'wideo';
    };

    const getTypeIcon = () => {
        if (type === 'text') return Sparkles;
        if (type === 'image') return ImageIcon;
        return Film;
    };

    const Icon = selectedProvider.icon;
    const TypeIcon = getTypeIcon();

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
                    {selectedProvider.name}
                  </span>
                                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                </Button>
                            </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Zmień model {getTypeLabel()}</p>
                        </TooltipContent>
                    </Tooltip>

                    <PopoverContent className="w-80 p-2" align="start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                                <TypeIcon className="w-3.5 h-3.5" />
                                <span>Model AI {getTypeLabel()}</span>
                            </div>

                            <div className="space-y-1.5">
                                {providers.map((provider) => (
                                    <ProviderCard
                                        key={provider.id}
                                        provider={provider}
                                        isSelected={selectedId === provider.id}
                                        isDefault={provider.id === getDefaultId()}
                                        isAvailable={isProviderAvailable(provider)}
                                        onSelect={() => handleSelect(provider)}
                                    />
                                ))}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </TooltipProvider>
        );
    }

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <TypeIcon className="w-4 h-4 text-violet-500" />
                    <span>Model AI dla {getTypeLabel()}</span>
                </div>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                            <p>
                                {type === 'text'
                                    ? 'Wybierz model AI do generowania tekstu.'
                                    : type === 'image'
                                        ? 'Prompty są automatycznie tłumaczone na angielski dla wyższej jakości.'
                                        : 'Generowanie wideo trwa ok. 30s - 2 min. Prompt jest automatycznie ulepszany.'}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div className="grid gap-2">
                {providers.map((provider) => (
                    <ProviderCard
                        key={provider.id}
                        provider={provider}
                        isSelected={selectedId === provider.id}
                        isDefault={provider.id === getDefaultId()}
                        isAvailable={isProviderAvailable(provider)}
                        onSelect={() => handleSelect(provider)}
                    />
                ))}
            </div>

            {isLoading && (
                <p className="text-xs text-muted-foreground text-center">
                    Sprawdzanie dostępności...
                </p>
            )}
        </div>
    );
}

interface InlineProviderSelectorProps {
    textProvider?: TextProvider;
    imageProvider?: ImageProvider;
    imageModel?: string;
    onTextProviderChange: (provider: TextProvider) => void;
    onImageProviderChange: (provider: ImageProvider, model?: string) => void;
    className?: string;
}

export function InlineProviderSelector({
                                           textProvider,
                                           imageProvider,
                                           imageModel,
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
                selectedModel={imageModel}
                onChange={(p, m) => onImageProviderChange(p as ImageProvider, m)}
                compact
            />
        </div>
    );
}

export default AIProviderSelector;