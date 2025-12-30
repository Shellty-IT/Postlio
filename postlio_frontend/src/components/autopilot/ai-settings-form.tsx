// src/components/autopilot/ai-settings-form.tsx
'use client';

import { motion } from 'framer-motion';
import {
    Sparkles,
    ImageIcon,
    Hash,
    Smile,
    Gauge,
    FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    GenerationSettings,
    AIProvider,
    ImageProvider,
    AI_PROVIDER_LABELS,
    IMAGE_PROVIDER_LABELS,
    CREATIVITY_LEVEL_LABELS,
    POST_LENGTH_PRESETS,
} from '@/types/autopilot';

interface AISettingsFormProps {
    settings: GenerationSettings;
    onChange: (settings: GenerationSettings) => void;
    className?: string;
}

export function AISettingsForm({
                                   settings,
                                   onChange,
                                   className,
                               }: AISettingsFormProps) {
    const updateSetting = <K extends keyof GenerationSettings>(
        key: K,
        value: GenerationSettings[K]
    ) => {
        onChange({ ...settings, [key]: value });
    };

    // Znajdź najbliższy preset kreatywności
    const getCreativityPreset = () => {
        const sorted = CREATIVITY_LEVEL_LABELS.slice().sort(
            (a, b) => Math.abs(a.value - settings.creativityLevel) - Math.abs(b.value - settings.creativityLevel)
        );
        return sorted[0];
    };

    // Znajdź preset długości
    const getCurrentLengthPreset = () => {
        return POST_LENGTH_PRESETS.find(
            p => p.minLength === settings.minLength && p.maxLength === settings.maxLength
        ) || POST_LENGTH_PRESETS[1]; // Domyślnie medium
    };

    return (
        <div className={cn('space-y-6', className)}>
            {/* Text Provider */}
            <div className="space-y-3">
                <Label className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Provider Tekstu
                </Label>

                <div className="grid grid-cols-3 gap-3">
                    {(Object.keys(AI_PROVIDER_LABELS) as AIProvider[]).map((provider) => {
                        const info = AI_PROVIDER_LABELS[provider];
                        const isSelected = settings.textProvider === provider;

                        return (
                            <button
                                key={provider}
                                onClick={() => updateSetting('textProvider', provider)}
                                className={cn(
                                    "relative p-4 rounded-xl border-2 text-left transition-all",
                                    "hover:border-primary/50",
                                    isSelected
                                        ? "border-primary bg-primary/5"
                                        : "border-border bg-card"
                                )}
                            >
                                {isSelected && (
                                    <motion.div
                                        layoutId="text-provider-selected"
                                        className="absolute inset-0 rounded-xl border-2 border-primary"
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                )}

                                <div className="relative">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">{info.icon}</span>
                                        <span className="font-medium text-sm">{info.name}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{info.description}</p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <span className="text-xs text-green-500">{info.speed}</span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Image Provider */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-violet-500" />
                        Provider Obrazów
                    </Label>

                    <div className="flex items-center gap-2">
                        <Label htmlFor="generate-images" className="text-xs text-muted-foreground">
                            Generuj obrazy
                        </Label>
                        <Switch
                            id="generate-images"
                            checked={settings.generateImages}
                            onCheckedChange={(v) => updateSetting('generateImages', v)}
                        />
                    </div>
                </div>

                {settings.generateImages && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-2"
                    >
                        {(Object.keys(IMAGE_PROVIDER_LABELS) as ImageProvider[]).map((provider) => {
                            const info = IMAGE_PROVIDER_LABELS[provider];
                            const isSelected = settings.imageProvider === provider;

                            return (
                                <button
                                    key={provider}
                                    onClick={() => updateSetting('imageProvider', provider)}
                                    className={cn(
                                        "p-3 rounded-lg border-2 text-center transition-all",
                                        "hover:border-violet-500/50",
                                        isSelected
                                            ? "border-violet-500 bg-violet-500/10"
                                            : "border-border bg-card"
                                    )}
                                >
                                    <span className="text-xl block mb-1">{info.icon}</span>
                                    <span className="text-xs font-medium block">{info.name}</span>
                                    <span className="text-[10px] text-muted-foreground">{info.quality}</span>
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </div>

            {/* Creativity Level */}
            <div className="space-y-3">
                <Label className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-orange-500" />
                    Poziom Kreatywności: {getCreativityPreset().label}
                </Label>

                <div className="space-y-2">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="20"
                        value={settings.creativityLevel}
                        onChange={(e) => updateSetting('creativityLevel', parseInt(e.target.value))}
                        className="w-full accent-orange-500"
                    />

                    <div className="flex justify-between">
                        {CREATIVITY_LEVEL_LABELS.map((level) => (
                            <button
                                key={level.value}
                                onClick={() => updateSetting('creativityLevel', level.value)}
                                className={cn(
                                    "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                                    settings.creativityLevel === level.value
                                        ? "bg-orange-500/10 text-orange-500"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <span className="text-lg">{level.icon}</span>
                                <span className="text-[10px] font-medium">{level.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                    {getCreativityPreset().description}
                </p>
            </div>

            {/* Post Length */}
            <div className="space-y-3">
                <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    Długość Postów
                </Label>

                <div className="grid grid-cols-3 gap-2">
                    {POST_LENGTH_PRESETS.map((preset) => {
                        const isSelected = getCurrentLengthPreset().id === preset.id;

                        return (
                            <button
                                key={preset.id}
                                onClick={() => {
                                    updateSetting('minLength', preset.minLength);
                                    updateSetting('maxLength', preset.maxLength);
                                }}
                                className={cn(
                                    "p-3 rounded-lg border-2 text-center transition-all",
                                    "hover:border-blue-500/50",
                                    isSelected
                                        ? "border-blue-500 bg-blue-500/10"
                                        : "border-border bg-card"
                                )}
                            >
                                <span className="text-sm font-medium block">{preset.label}</span>
                                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  {preset.description}
                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Hashtags & Emoji */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Auto Hashtags */}
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="auto-hashtags" className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-green-500" />
                            Auto Hashtagi
                        </Label>
                        <Switch
                            id="auto-hashtags"
                            checked={settings.useHashtags}
                            onCheckedChange={(v) => updateSetting('useHashtags', v)}
                        />
                    </div>

                    {settings.useHashtags && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-2"
                        >
                            <Label className="text-xs text-muted-foreground">
                                Ilość hashtagów: {settings.hashtagCount}
                            </Label>
                            <input
                                type="range"
                                min="3"
                                max="15"
                                value={settings.hashtagCount}
                                onChange={(e) => updateSetting('hashtagCount', parseInt(e.target.value))}
                                className="w-full accent-green-500"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>3</span>
                                <span>15</span>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Auto Emoji */}
                <div className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="auto-emoji" className="flex items-center gap-2">
                            <Smile className="w-4 h-4 text-yellow-500" />
                            Auto Emoji
                        </Label>
                        <Switch
                            id="auto-emoji"
                            checked={settings.useEmojis}
                            onCheckedChange={(v) => updateSetting('useEmojis', v)}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        AI automatycznie doda odpowiednie emoji do postów
                    </p>
                </div>
            </div>

            {/* Call to Action */}
            <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="include-cta" className="flex items-center gap-2 mb-1">
                            📣 Call to Action
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Dodaj wezwanie do działania na końcu posta
                        </p>
                    </div>
                    <Switch
                        id="include-cta"
                        checked={settings.includeCallToAction}
                        onCheckedChange={(v) => updateSetting('includeCallToAction', v)}
                    />
                </div>
            </div>
        </div>
    );
}