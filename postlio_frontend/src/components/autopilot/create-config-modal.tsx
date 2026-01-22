// src/components/autopilot/create-config-modal.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Check,
    Sparkles,
    Calendar,
    Building2,
    Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Platform } from '@/types';  // <-- DODAJ TO
import type {
    BackendAutopilotConfigCreate,
    DayOfWeekName,
    PostLength,
    ThematicCategoryId,
} from '@/types/autopilot';
import {
    DAYS_OF_WEEK,
    POST_LENGTH_PRESETS,
} from '@/types/autopilot';
import type { Brand } from '@/types/brand';

interface CreateConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (config: BackendAutopilotConfigCreate) => void;
    brands: Brand[];
}

type Step = 'brand' | 'platforms' | 'schedule' | 'ai';

const STEPS: { id: Step; title: string; icon: React.ReactNode }[] = [
    { id: 'brand', title: 'Marka', icon: <Building2 className="w-4 h-4" /> },
    { id: 'platforms', title: 'Platformy', icon: <Share2 className="w-4 h-4" /> },
    { id: 'schedule', title: 'Harmonogram', icon: <Calendar className="w-4 h-4" /> },
    { id: 'ai', title: 'AI', icon: <Sparkles className="w-4 h-4" /> },
];

export function CreateConfigModal({
                                      isOpen,
                                      onClose,
                                      onSubmit,
                                      brands,
                                  }: CreateConfigModalProps) {
    const [currentStep, setCurrentStep] = useState<Step>('brand');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [scheduleDays, setScheduleDays] = useState<DayOfWeekName[]>(['monday', 'wednesday', 'friday']);
    const [scheduleTime, setScheduleTime] = useState('10:00');
    const [postsPerWeek, setPostsPerWeek] = useState(3);
    const [creativityLevel, setCreativityLevel] = useState(50);
    const [postLength, setPostLength] = useState<PostLength>('medium');
    const [includeImages, setIncludeImages] = useState(true);
    const [textProvider, setTextProvider] = useState('gemini');
    const [imageProvider, setImageProvider] = useState('pollinations');

    const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === STEPS.length - 1;

    // Walidacja kroku
    const isStepValid = (): boolean => {
        switch (currentStep) {
            case 'brand':
                return selectedBrandId !== null;
            case 'platforms':
                return platforms.length > 0;
            case 'schedule':
                return scheduleDays.length > 0;
            case 'ai':
                return true;
            default:
                return false;
        }
    };

    // Nawigacja
    const goNext = () => {
        if (isLastStep) {
            handleSubmit();
        } else {
            setCurrentStep(STEPS[currentStepIndex + 1].id);
        }
    };

    const goBack = () => {
        if (!isFirstStep) {
            setCurrentStep(STEPS[currentStepIndex - 1].id);
        }
    };

    // Toggle platform
    const togglePlatform = (platform: Platform) => {
        setPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };

    // Toggle day
    const toggleDay = (day: DayOfWeekName) => {
        setScheduleDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

    // Submit
    const handleSubmit = async () => {
        if (!selectedBrandId) return;

        setIsSubmitting(true);

        const config: BackendAutopilotConfigCreate = {
            brand_id: selectedBrandId,
            posts_per_week: postsPerWeek,
            schedule_days: scheduleDays,
            schedule_time: scheduleTime,
            platforms: platforms,
            categories: ['lifestyle'] as ThematicCategoryId[],
            creativity_level: creativityLevel,
            post_length: postLength,
            include_images: includeImages,
            include_hashtags: true,
            include_emoji: true,
            text_provider: textProvider,
            image_provider: imageProvider,
        };

        try {
            onSubmit(config);
            handleClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset i zamknij
    const handleClose = () => {
        setCurrentStep('brand');
        setSelectedBrandId(null);
        setPlatforms([]);
        setScheduleDays(['monday', 'wednesday', 'friday']);
        setScheduleTime('10:00');
        setPostsPerWeek(3);
        setCreativityLevel(50);
        setPostLength('medium');
        setIncludeImages(true);
        setTextProvider('gemini');
        setImageProvider('pollinations');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="p-6 pb-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl">
                            Nowa konfiguracja Autopilota
                        </DialogTitle>
                    </div>

                    {/* Step indicators */}
                    <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-shrink-0">
                                <button
                                    onClick={() => index <= currentStepIndex && setCurrentStep(step.id)}
                                    disabled={index > currentStepIndex}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all",
                                        currentStep === step.id
                                            ? "bg-primary text-primary-foreground"
                                            : index < currentStepIndex
                                                ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                                                : "bg-muted text-muted-foreground cursor-not-allowed"
                                    )}
                                >
                                    {index < currentStepIndex ? (
                                        <Check className="w-3.5 h-3.5" />
                                    ) : (
                                        step.icon
                                    )}
                                    <span className="hidden sm:inline">{step.title}</span>
                                </button>
                                {index < STEPS.length - 1 && (
                                    <ChevronRight className="w-4 h-4 text-muted-foreground mx-1 flex-shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                </DialogHeader>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[50vh]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Step 1: Brand Selection */}
                            {currentStep === 'brand' && (
                                <div className="space-y-4">
                                    <Label>Wybierz markę *</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {brands.map((brand) => (
                                            <button
                                                key={brand.id}
                                                onClick={() => setSelectedBrandId(Number(brand.id))}
                                                className={cn(
                                                    "p-4 rounded-xl border-2 text-left transition-all",
                                                    "hover:border-primary/50",
                                                    selectedBrandId === Number(brand.id)
                                                        ? "border-primary bg-primary/5"
                                                        : "border-border bg-card"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                                                        style={{
                                                            backgroundColor: `${brand.primaryColor}20`,
                                                            color: brand.primaryColor
                                                        }}
                                                    >
                                                        {brand.name[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium text-sm">{brand.name}</h4>
                                                        <p className="text-xs text-muted-foreground">
                                                            {brand.industry || 'Brak branży'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {brands.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                                            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Najpierw utwórz markę</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 2: Platforms */}
                            {currentStep === 'platforms' && (
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Wybierz platformy, na których będą publikowane posty
                                    </p>

                                    <div className="grid grid-cols-3 gap-4">
                                        {([
                                            { id: 'facebook' as Platform, name: 'Facebook', color: '#1877F2' },
                                            { id: 'instagram' as Platform, name: 'Instagram', color: '#E4405F' },
                                            { id: 'linkedin' as Platform, name: 'LinkedIn', color: '#0A66C2' },
                                        ]).map((platform) => {
                                            const isSelected = platforms.includes(platform.id);

                                            return (
                                                <button
                                                    key={platform.id}
                                                    onClick={() => togglePlatform(platform.id)}
                                                    className={cn(
                                                        "relative p-6 rounded-xl border-2 text-center transition-all",
                                                        "hover:scale-105",
                                                        isSelected
                                                            ? "border-primary bg-primary/5"
                                                            : "border-border bg-card hover:border-primary/50"
                                                    )}
                                                >
                                                    <div
                                                        className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold"
                                                        style={{ backgroundColor: platform.color }}
                                                    >
                                                        {platform.id[0].toUpperCase()}
                                                    </div>
                                                    <span className="font-medium">{platform.name}</span>

                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                                                        >
                                                            <Check className="w-4 h-4 text-primary-foreground" />
                                                        </motion.div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Schedule */}
                            {currentStep === 'schedule' && (
                                <div className="space-y-6">
                                    {/* Posts per week */}
                                    <div className="space-y-3">
                                        <Label>Posty tygodniowo: {postsPerWeek}</Label>
                                        <Input
                                            type="range"
                                            min={1}
                                            max={14}
                                            step={1}
                                            value={postsPerWeek}
                                            onChange={(e) => setPostsPerWeek(Number(e.target.value))}
                                            className="w-full"
                                        />
                                    </div>

                                    {/* Days */}
                                    <div className="space-y-3">
                                        <Label>Dni publikacji</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {DAYS_OF_WEEK.map((day) => (
                                                <Button
                                                    key={day.name}
                                                    variant={scheduleDays.includes(day.name) ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => toggleDay(day.name)}
                                                >
                                                    {day.short}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Time */}
                                    <div className="space-y-2">
                                        <Label>Godzina publikacji</Label>
                                        <Input
                                            type="time"
                                            value={scheduleTime}
                                            onChange={(e) => setScheduleTime(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 4: AI Settings */}
                            {currentStep === 'ai' && (
                                <div className="space-y-6">
                                    {/* Creativity */}
                                    <div className="space-y-3">
                                        <Label>Poziom kreatywności: {creativityLevel}%</Label>
                                        <Input
                                            type="range"
                                            min={0}
                                            max={100}
                                            step={10}
                                            value={creativityLevel}
                                            onChange={(e) => setCreativityLevel(Number(e.target.value))}
                                            className="w-full"
                                        />
                                    </div>

                                    {/* Post Length */}
                                    <div className="space-y-2">
                                        <Label>Długość postów</Label>
                                        <Select value={postLength} onValueChange={(v: PostLength) => setPostLength(v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {POST_LENGTH_PRESETS.map((preset) => (
                                                    <SelectItem key={preset.id} value={preset.id}>
                                                        {preset.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Text Provider */}
                                    <div className="space-y-2">
                                        <Label>Model AI (tekst)</Label>
                                        <Select value={textProvider} onValueChange={setTextProvider}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="gemini">Gemini 2.5 ✨</SelectItem>
                                                <SelectItem value="groq">Groq (Llama 3.3) ⚡</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Include Images */}
                                    <div className="flex items-center justify-between">
                                        <Label>Generuj obrazy</Label>
                                        <Switch
                                            checked={includeImages}
                                            onCheckedChange={setIncludeImages}
                                        />
                                    </div>

                                    {includeImages && (
                                        <div className="space-y-2">
                                            <Label>Model AI (obrazy)</Label>
                                            <Select value={imageProvider} onValueChange={setImageProvider}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pollinations">Pollinations 🌸</SelectItem>
                                                    <SelectItem value="huggingface">HuggingFace 🤗</SelectItem>
                                                    <SelectItem value="clipdrop">ClipDrop ✂️</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 flex items-center justify-between border-t border-border">
                    <Button
                        variant="ghost"
                        onClick={goBack}
                        disabled={isFirstStep}
                        className="gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Wstecz
                    </Button>

                    <div className="text-sm text-muted-foreground">
                        Krok {currentStepIndex + 1} z {STEPS.length}
                    </div>

                    <Button
                        onClick={goNext}
                        disabled={!isStepValid() || isSubmitting}
                        className="gap-2"
                    >
                        {isLastStep ? (
                            <>
                                <Sparkles className="w-4 h-4" />
                                {isSubmitting ? 'Tworzę...' : 'Utwórz'}
                            </>
                        ) : (
                            <>
                                Dalej
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}