// src/components/settings/ai-preferences-section.tsx
'use client';

import { motion } from 'framer-motion';
import {
    Sparkles,
    ImageIcon,
    Hash,
    Smile,
    Gauge,
    FileText,
    Wand2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '@/store/settings-store';
import {
    AI_PROVIDER_LABELS,
    IMAGE_PROVIDER_LABELS,
    CREATIVITY_LEVEL_LABELS,
    POST_LENGTH_PRESETS,
} from '@/types/autopilot';
import type { AIProvider, ImageProvider } from '@/types/autopilot';

export function AIPreferencesSection() {
    const { settings, updateAIPreferences } = useSettingsStore();
    const { ai } = settings;

    const getCreativityPreset = () => {
        const sorted = CREATIVITY_LEVEL_LABELS.slice().sort(
            (a, b) => Math.abs(a.value - ai.defaultCreativityLevel) - Math.abs(b.value - ai.defaultCreativityLevel)
        );
        return sorted[0];
    };

    const getCurrentLengthPreset = () => {
        return POST_LENGTH_PRESETS.find(
            p => p.id === ai.defaultPostLength
        ) || POST_LENGTH_PRESETS[1];
    };

    const imageProviderKeys = (Object.keys(IMAGE_PROVIDER_LABELS) as ImageProvider[])
        .filter(p => p !== 'none');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 sm:space-y-8"
        >
            <div className="flex items-center gap-2.5">
                <span className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-br from-primary to-accent">
                    <Wand2 className="h-3.5 w-3.5 text-white" />
                </span>
                <div>
                    <h2 className="text-lg xs:text-xl font-semibold text-foreground">
                        Preferencje AI
                    </h2>
                    <p className="text-xs xs:text-sm text-muted-foreground mt-0.5">
                        Domyślne ustawienia generowania treści.
                    </p>
                </div>
            </div>

            <div className="space-y-3 xs:space-y-4">
                <Label className="flex items-center gap-2 text-sm xs:text-base">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Domyślny model tekstu
                </Label>
                <p className="text-xs xs:text-sm text-muted-foreground -mt-2">
                    Wybierz model AI do generowania tekstu
                </p>

                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-2 xs:gap-3">
                    {(Object.keys(AI_PROVIDER_LABELS) as AIProvider[]).map((provider) => {
                        const info = AI_PROVIDER_LABELS[provider];
                        const isSelected = ai.defaultTextProvider === provider;

                        return (
                            <button
                                key={provider}
                                onClick={() => updateAIPreferences({ defaultTextProvider: provider })}
                                className={cn(
                                    "relative p-3 xs:p-4 rounded-xl border-2 text-left transition-all min-h-[80px]",
                                    "hover:border-primary/50",
                                    isSelected
                                        ? "border-primary bg-primary/5"
                                        : "border-white/10 bg-white/[0.02]"
                                )}
                            >
                                <div className="flex items-center gap-2 mb-1 xs:mb-2">
                                    <span className="text-lg xs:text-xl">{info.icon}</span>
                                    <span className="font-medium text-sm xs:text-base">{info.name}</span>
                                </div>
                                <p className="text-[10px] xs:text-xs text-muted-foreground line-clamp-2">{info.description}</p>
                                <div className="flex items-center gap-1 mt-1.5 xs:mt-2">
                                    <span className="text-[10px] xs:text-xs text-green-500">{info.speed}</span>
                                </div>

                                {isSelected && (
                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-3 xs:space-y-4">
                <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                    <div>
                        <Label className="flex items-center gap-2 text-sm xs:text-base">
                            <ImageIcon className="w-4 h-4 text-violet-500" />
                            Domyślny model obrazów
                        </Label>
                        <p className="text-xs xs:text-sm text-muted-foreground mt-1">
                            Wybierz generator grafik AI
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Label htmlFor="auto-images" className="text-xs xs:text-sm text-muted-foreground">
                            Auto-generuj
                        </Label>
                        <Switch
                            id="auto-images"
                            checked={ai.autoGenerateImages}
                            onCheckedChange={(v) => updateAIPreferences({ autoGenerateImages: v })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-2 xs:gap-3">
                    {imageProviderKeys.map((provider) => {
                        const info = IMAGE_PROVIDER_LABELS[provider];
                        const isSelected = ai.defaultImageProvider === provider;

                        return (
                            <button
                                key={provider}
                                onClick={() => updateAIPreferences({ defaultImageProvider: provider })}
                                className={cn(
                                    "relative p-3 xs:p-4 rounded-xl border-2 text-left transition-all min-h-[80px]",
                                    "hover:border-violet-500/50",
                                    isSelected
                                        ? "border-violet-500 bg-violet-500/10"
                                        : "border-white/10 bg-white/[0.02]"
                                )}
                            >
                                <div className="flex items-center gap-2 mb-1 xs:mb-2">
                                    <span className="text-lg xs:text-xl">{info.icon}</span>
                                    <span className="font-medium text-sm xs:text-base">{info.name}</span>
                                </div>
                                <p className="text-[10px] xs:text-xs text-muted-foreground line-clamp-2">
                                    {info.description}
                                </p>
                                <div className="flex items-center justify-between mt-1.5 xs:mt-2">
                                    <span className="text-[10px] xs:text-xs text-violet-500">{info.quality}</span>
                                    {info.speed && (
                                        <span className="text-[10px] xs:text-xs text-muted-foreground">{info.speed}</span>
                                    )}
                                </div>

                                {isSelected && (
                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-500" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <p className="text-[10px] xs:text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    ✨ Flux i Nanobanana obsługują polskie prompty
                </p>
            </div>

            <div className="glass-card space-y-3 xs:space-y-4 p-4 xs:p-6">
                <Label className="flex items-center gap-2 text-sm xs:text-base">
                    <Gauge className="w-4 h-4 text-orange-500" />
                    Kreatywność: {getCreativityPreset().label}
                </Label>

                <div className="space-y-3">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="20"
                        value={ai.defaultCreativityLevel}
                        onChange={(e) => updateAIPreferences({ defaultCreativityLevel: parseInt(e.target.value) })}
                        className="w-full accent-orange-500"
                    />

                    <div className="flex justify-between overflow-x-auto gap-1">
                        {CREATIVITY_LEVEL_LABELS.map((level) => (
                            <button
                                key={level.value}
                                onClick={() => updateAIPreferences({ defaultCreativityLevel: level.value })}
                                className={cn(
                                    "flex flex-col items-center gap-0.5 xs:gap-1 p-1.5 xs:p-2 rounded-lg transition-all min-w-[40px] xs:min-w-[48px]",
                                    ai.defaultCreativityLevel === level.value
                                        ? "bg-orange-500/10 text-orange-500"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <span className="text-base xs:text-lg">{level.icon}</span>
                                <span className="text-[8px] xs:text-[10px] font-medium whitespace-nowrap">{level.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <p className="text-[10px] xs:text-xs text-muted-foreground text-center">
                    {getCreativityPreset().description}
                </p>
            </div>

            <div className="space-y-3 xs:space-y-4">
                <Label className="flex items-center gap-2 text-sm xs:text-base">
                    <FileText className="w-4 h-4 text-blue-500" />
                    Domyślna długość postów
                </Label>

                <div className="grid grid-cols-3 gap-2 xs:gap-3">
                    {POST_LENGTH_PRESETS.map((preset) => {
                        const isSelected = getCurrentLengthPreset().id === preset.id;

                        return (
                            <button
                                key={preset.id}
                                onClick={() => updateAIPreferences({ defaultPostLength: preset.id as 'short' | 'medium' | 'long' })}
                                className={cn(
                                    "p-3 xs:p-4 rounded-xl border-2 text-center transition-all",
                                    "hover:border-blue-500/50",
                                    isSelected
                                        ? "border-blue-500 bg-blue-500/10"
                                        : "border-white/10 bg-white/[0.02]"
                                )}
                            >
                                <span className="font-medium block text-sm xs:text-base">{preset.label}</span>
                                <span className="text-[10px] xs:text-xs text-muted-foreground mt-1 block">
                                    {preset.description}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4">
                <div className="glass-card p-4 xs:p-5 space-y-3 xs:space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="auto-hashtags" className="flex items-center gap-2 text-xs xs:text-sm">
                            <Hash className="w-4 h-4 text-green-500" />
                            Automatyczne hashtagi
                        </Label>
                        <Switch
                            id="auto-hashtags"
                            checked={ai.autoHashtags}
                            onCheckedChange={(v) => updateAIPreferences({ autoHashtags: v })}
                        />
                    </div>

                    {ai.autoHashtags && (
                        <div className="space-y-2">
                            <Label className="text-[10px] xs:text-xs text-muted-foreground">
                                Ilość: {ai.defaultHashtagCount}
                            </Label>
                            <input
                                type="range"
                                min="3"
                                max="15"
                                value={ai.defaultHashtagCount}
                                onChange={(e) => updateAIPreferences({ defaultHashtagCount: parseInt(e.target.value) })}
                                className="w-full accent-green-500"
                            />
                            <div className="flex justify-between text-[10px] xs:text-xs text-muted-foreground">
                                <span>3</span>
                                <span>15</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="glass-card p-4 xs:p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="auto-emoji" className="flex items-center gap-2 text-xs xs:text-sm">
                                <Smile className="w-4 h-4 text-yellow-500" />
                                Automatyczne emoji
                            </Label>
                            <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">
                                AI doda odpowiednie emoji
                            </p>
                        </div>
                        <Switch
                            id="auto-emoji"
                            checked={ai.autoEmoji}
                            onCheckedChange={(v) => updateAIPreferences({ autoEmoji: v })}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}