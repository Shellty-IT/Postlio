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
import type { Platform } from '@/types';
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

const STEPS: { id: Step; title: string; shortTitle: string; icon: React.ReactNode }[] = [
    { id: 'brand', title: 'Marka', shortTitle: 'Marka', icon: <Building2 className="w-3.5 h-3.5 xs:w-4 xs:h-4" /> },
    { id: 'platforms', title: 'Platformy', shortTitle: 'Platf.', icon: <Share2 className="w-3.5 h-3.5 xs:w-4 xs:h-4" /> },
    { id: 'schedule', title: 'Harmonogram', shortTitle: 'Czas', icon: <Calendar className="w-3.5 h-3.5 xs:w-4 xs:h-4" /> },
    { id: 'ai', title: 'AI', shortTitle: 'AI', icon: <Sparkles className="w-3.5 h-3.5 xs:w-4 xs:h-4" /> },
];

export function CreateConfigModal({
                                      isOpen,
                                      onClose,
                                      onSubmit,
                                      brands,
                                  }: CreateConfigModalProps) {
    const [currentStep, setCurrentStep] = useState<Step>('brand');
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const togglePlatform = (platform: Platform) => {
        setPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };

    const toggleDay = (day: DayOfWeekName) => {
        setScheduleDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day]
        );
    };

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
                <DialogHeader className="p-4 xs:p-6 pb-0">
                    <DialogTitle className="text-base xs:text-lg sm:text-xl">
                        Nowa konfiguracja Autopilota
                    </DialogTitle>

                    <div className="flex items-center gap-1 xs:gap-2 mt-4 xs:mt-6 overflow-x-auto pb-2">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-shrink-0">
                                <button
                                    onClick={() => index <= currentStepIndex && setCurrentStep(step.id)}
                                    disabled={index > currentStepIndex}
                                    className={cn(
                                        "flex items-center gap-1 xs:gap-2 px-2 xs:px-3 py-1 xs:py-1.5 rounded-full text-xs xs:text-sm transition-all",
                                        currentStep === step.id
                                            ? "bg-primary text-primary-foreground"
                                            : index < currentStepIndex
                                                ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                                                : "bg-muted text-muted-foreground cursor-not-allowed"
                                    )}
                                >
                                    {index < currentStepIndex ? (
                                        <Check className="w-3 h-3 xs:w-3.5 xs:h-3.5" />
                                    ) : (
                                        step.icon
                                    )}
                                    <span className="hidden xs:inline">{step.title}</span>
                                    <span className="xs:hidden">{step.shortTitle}</span>
                                </button>
                                {index < STEPS.length - 1 && (
                                    <ChevronRight className="w-3 h-3 xs:w-4 xs:h-4 text-muted-foreground mx-0.5 xs:mx-1 flex-shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                </DialogHeader>

                <div className="p-4 xs:p-6 overflow-y-auto max-h-[45vh] xs:max-h-[50vh]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {currentStep === 'brand' && (
                                <div className="space-y-3 xs:space-y-4">
                                    <Label className="text-xs xs:text-sm">Wybierz markę *</Label>
                                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 xs:gap-3">
                                        {brands.map((brand) => (
                                            <button
                                                key={brand.id}
                                                onClick={() => setSelectedBrandId(Number(brand.id))}
                                                className={cn(
                                                    "p-3 xs:p-4 rounded-xl border-2 text-left transition-all",
                                                    "hover:border-primary/50",
                                                    selectedBrandId === Number(brand.id)
                                                        ? "border-primary bg-primary/5"
                                                        : "border-border bg-card"
                                                )}
                                            >
                                                <div className="flex items-center gap-2 xs:gap-3">
                                                    <div
                                                        className="w-8 h-8 xs:w-10 xs:h-10 rounded-lg flex items-center justify-center text-sm xs:text-lg flex-shrink-0"
                                                        style={{
                                                            backgroundColor: `${brand.primaryColor}20`,
                                                            color: brand.primaryColor
                                                        }}
                                                    >
                                                        {brand.name[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-medium text-xs xs:text-sm truncate">{brand.name}</h4>
                                                        <p className="text-[10px] xs:text-xs text-muted-foreground truncate">
                                                            {brand.industry || 'Brak branży'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {brands.length === 0 && (
                                        <div className="text-center py-6 xs:py-8 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                                            <Building2 className="w-6 h-6 xs:w-8 xs:h-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-xs xs:text-sm">Najpierw utwórz markę</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {currentStep === 'platforms' && (
                                <div className="space-y-3 xs:space-y-4">
                                    <p className="text-xs xs:text-sm text-muted-foreground">
                                        Wybierz platformy do publikacji
                                    </p>

                                    <div className="grid grid-cols-3 gap-2 xs:gap-4">
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
                                                        "relative p-3 xs:p-4 sm:p-6 rounded-xl border-2 text-center transition-all",
                                                        "hover:scale-105",
                                                        isSelected
                                                            ? "border-primary bg-primary/5"
                                                            : "border-border bg-card hover:border-primary/50"
                                                    )}
                                                >
                                                    <div
                                                        className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 rounded-xl xs:rounded-2xl mx-auto mb-2 xs:mb-3 flex items-center justify-center text-white text-base xs:text-lg sm:text-xl font-bold"
                                                        style={{ backgroundColor: platform.color }}
                                                    >
                                                        {platform.id[0].toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-xs xs:text-sm">{platform.name}</span>

                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="absolute top-1 right-1 xs:top-2 xs:right-2 w-5 h-5 xs:w-6 xs:h-6 rounded-full bg-primary flex items-center justify-center"
                                                        >
                                                            <Check className="w-3 h-3 xs:w-4 xs:h-4 text-primary-foreground" />
                                                        </motion.div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {currentStep === 'schedule' && (
                                <div className="space-y-4 xs:space-y-6">
                                    <div className="space-y-2 xs:space-y-3">
                                        <Label className="text-xs xs:text-sm">Posty tygodniowo: {postsPerWeek}</Label>
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

                                    <div className="space-y-2 xs:space-y-3">
                                        <Label className="text-xs xs:text-sm">Dni publikacji</Label>
                                        <div className="flex flex-wrap gap-1.5 xs:gap-2">
                                            {DAYS_OF_WEEK.map((day) => (
                                                <Button
                                                    key={day.name}
                                                    variant={scheduleDays.includes(day.name) ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => toggleDay(day.name)}
                                                    className="h-8 xs:h-9 px-2 xs:px-3 text-xs"
                                                >
                                                    {day.short}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs xs:text-sm">Godzina publikacji</Label>
                                        <Input
                                            type="time"
                                            value={scheduleTime}
                                            onChange={(e) => setScheduleTime(e.target.value)}
                                            className="h-10 xs:h-11"
                                        />
                                    </div>
                                </div>
                            )}

                            {currentStep === 'ai' && (
                                <div className="space-y-4 xs:space-y-6">
                                    <div className="space-y-2 xs:space-y-3">
                                        <Label className="text-xs xs:text-sm">Kreatywność: {creativityLevel}%</Label>
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

                                    <div className="space-y-2">
                                        <Label className="text-xs xs:text-sm">Długość postów</Label>
                                        <Select value={postLength} onValueChange={(v: PostLength) => setPostLength(v)}>
                                            <SelectTrigger className="h-10 xs:h-11">
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

                                    <div className="space-y-2">
                                        <Label className="text-xs xs:text-sm">Model AI (tekst)</Label>
                                        <Select value={textProvider} onValueChange={setTextProvider}>
                                            <SelectTrigger className="h-10 xs:h-11">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="gemini">Gemini 2.5 ✨</SelectItem>
                                                <SelectItem value="groq">Groq ⚡</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs xs:text-sm">Generuj obrazy</Label>
                                        <Switch
                                            checked={includeImages}
                                            onCheckedChange={setIncludeImages}
                                        />
                                    </div>

                                    {includeImages && (
                                        <div className="space-y-2">
                                            <Label className="text-xs xs:text-sm">Model AI (obrazy)</Label>
                                            <Select value={imageProvider} onValueChange={setImageProvider}>
                                                <SelectTrigger className="h-10 xs:h-11">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pollinations">Pollinations 🌸</SelectItem>
                                                    <SelectItem value="huggingface">HuggingFace 🤗</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="p-4 xs:p-6 pt-3 xs:pt-4 flex items-center justify-between border-t border-border">
                    <Button
                        variant="ghost"
                        onClick={goBack}
                        disabled={isFirstStep}
                        className="gap-1 xs:gap-2 h-9 xs:h-10"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden xs:inline">Wstecz</span>
                    </Button>

                    <div className="text-xs xs:text-sm text-muted-foreground">
                        {currentStepIndex + 1} / {STEPS.length}
                    </div>

                    <Button
                        onClick={goNext}
                        disabled={!isStepValid() || isSubmitting}
                        className="gap-1 xs:gap-2 h-9 xs:h-10"
                    >
                        {isLastStep ? (
                            <>
                                <Sparkles className="w-4 h-4" />
                                {isSubmitting ? 'Tworzę...' : 'Utwórz'}
                            </>
                        ) : (
                            <>
                                <span className="hidden xs:inline">Dalej</span>
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}