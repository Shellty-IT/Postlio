// src/components/autopilot/create-config-modal.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ChevronLeft,
    ChevronRight,
    Check,
    Sparkles,
    Calendar,
    Layers,
    Zap,
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
import { ContentCategoriesEditor } from './content-categories-editor';
import { TimeSlotsPicker } from './time-slots-picker';
import { AISettingsForm } from './ai-settings-form';
import {
    AutopilotConfig,
    ScheduleConfig,
    GenerationSettings,
    QUICK_SCHEDULE_PRESETS,
    SelectedCategory,
} from '@/types/autopilot';
import type { Platform } from '@/types';
import type { Brand } from '@/types/brand';

interface CreateConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (config: Omit<AutopilotConfig, 'id' | 'createdAt' | 'updatedAt' | 'totalGenerated' | 'totalPublished'>) => void;
    brands: Brand[];
}

type Step = 'basics' | 'platforms' | 'schedule' | 'categories' | 'ai';

const STEPS: { id: Step; title: string; icon: React.ReactNode }[] = [
    { id: 'basics', title: 'Podstawy', icon: <Building2 className="w-4 h-4" /> },
    { id: 'platforms', title: 'Platformy', icon: <Share2 className="w-4 h-4" /> },
    { id: 'schedule', title: 'Harmonogram', icon: <Calendar className="w-4 h-4" /> },
    { id: 'categories', title: 'Kategorie', icon: <Layers className="w-4 h-4" /> },
    { id: 'ai', title: 'Ustawienia AI', icon: <Sparkles className="w-4 h-4" /> },
];

const DEFAULT_SCHEDULE: ScheduleConfig = {
    frequency: 'weekly',
    postsPerPeriod: 3,
    selectedDays: [1, 3, 5],
    timeSlots: [{ id: '1', time: '10:00', label: 'Poranek' }],
    timezone: 'Europe/Warsaw',
};

const DEFAULT_GENERATION_SETTINGS: GenerationSettings = {
    textProvider: 'gemini',
    imageProvider: 'pollinations',
    generateImages: true,
    maxRetries: 3,
    creativityLevel: 60,
    useHashtags: true,
    hashtagCount: 5,
    useEmojis: true,
    minLength: 150,
    maxLength: 300,
    includeCallToAction: true,
};

export function CreateConfigModal({
                                      isOpen,
                                      onClose,
                                      onSubmit,
                                      brands,
                                  }: CreateConfigModalProps) {
    const [currentStep, setCurrentStep] = useState<Step>('basics');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [selectedBrandId, setSelectedBrandId] = useState('');
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [schedule, setSchedule] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
    const [selectedCategories, setSelectedCategories] = useState<SelectedCategory[]>([]);
    const [generationSettings, setGenerationSettings] = useState<GenerationSettings>(DEFAULT_GENERATION_SETTINGS);
    const [requiresApproval, setRequiresApproval] = useState(true);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

    const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === STEPS.length - 1;

    // Walidacja kroku
    const isStepValid = (): boolean => {
        switch (currentStep) {
            case 'basics':
                return name.trim().length >= 3 && selectedBrandId !== '';
            case 'platforms':
                return platforms.length > 0;
            case 'schedule':
                return schedule.selectedDays.length > 0 && schedule.timeSlots.length > 0;
            case 'categories':
                return true; // Opcjonalne
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

    // Wybierz preset harmonogramu
    const applyPreset = (presetId: string) => {
        const preset = QUICK_SCHEDULE_PRESETS.find(p => p.id === presetId);
        if (preset && preset.schedule) {
            setSchedule({
                ...DEFAULT_SCHEDULE,
                frequency: preset.schedule.frequency || DEFAULT_SCHEDULE.frequency,
                postsPerPeriod: preset.schedule.postsPerPeriod || DEFAULT_SCHEDULE.postsPerPeriod,
                timeSlots: preset.schedule.timeSlots || DEFAULT_SCHEDULE.timeSlots,
                selectedDays: preset.schedule.selectedDays || DEFAULT_SCHEDULE.selectedDays,
            });
            setSelectedPreset(presetId);
        }
    };

    // Przełącz platformę
    const togglePlatform = (platform: Platform) => {
        setPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };

    // Submit
    const handleSubmit = async () => {
        setIsSubmitting(true);

        const config: Omit<AutopilotConfig, 'id' | 'createdAt' | 'updatedAt' | 'totalGenerated' | 'totalPublished'> = {
            name,
            brandId: selectedBrandId,
            status: 'inactive',
            platforms,
            schedule,
            contentMix: [],
            topics: [],
            generationSettings,
            requiresApproval,
            notifyOnGeneration: true,
            notifyOnPublish: true,
            notifyOnError: true,
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
        setCurrentStep('basics');
        setName('');
        setSelectedBrandId('');
        setPlatforms([]);
        setSchedule(DEFAULT_SCHEDULE);
        setSelectedCategories([]);
        setGenerationSettings(DEFAULT_GENERATION_SETTINGS);
        setRequiresApproval(true);
        setSelectedPreset(null);
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
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClose}
                            className="rounded-full"
                        >
                            <X className="w-4 h-4" />
                        </Button>
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
                            {/* Step 1: Basics */}
                            {currentStep === 'basics' && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nazwa konfiguracji *</Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="np. Social Media Q1 2024"
                                            className="text-lg"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Minimum 3 znaki
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Wybierz markę *</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {brands.map((brand) => (
                                                <button
                                                    key={brand.id}
                                                    onClick={() => setSelectedBrandId(brand.id)}
                                                    className={cn(
                                                        "p-4 rounded-xl border-2 text-left transition-all",
                                                        "hover:border-primary/50",
                                                        selectedBrandId === brand.id
                                                            ? "border-primary bg-primary/5"
                                                            : "border-border bg-card"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                                                            style={{ backgroundColor: `${brand.primaryColor}20`, color: brand.primaryColor }}
                                                        >
                                                            {brand.name[0]}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-sm">{brand.name}</h4>
                                                            <p className="text-xs text-muted-foreground">{brand.industry}</p>
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

                                    <div className="p-4 rounded-xl border border-border bg-card">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label className="text-sm font-medium">
                                                    Wymagaj zatwierdzenia
                                                </Label>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Posty będą czekać na Twoje zatwierdzenie przed publikacją
                                                </p>
                                            </div>
                                            <Switch
                                                checked={requiresApproval}
                                                onCheckedChange={setRequiresApproval}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Platforms */}
                            {currentStep === 'platforms' && (
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Wybierz platformy, na których będą publikowane posty
                                    </p>

                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { id: 'facebook' as Platform, name: 'Facebook', color: '#1877F2', icon: 'f' },
                                            { id: 'instagram' as Platform, name: 'Instagram', color: '#E4405F', icon: 'IG' },
                                            { id: 'linkedin' as Platform, name: 'LinkedIn', color: '#0A66C2', icon: 'in' },
                                        ].map((platform) => {
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
                                                        className={cn(
                                                            "w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white text-xl font-bold",
                                                            platform.id === 'instagram' && "bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]"
                                                        )}
                                                        style={{
                                                            backgroundColor: platform.id !== 'instagram' ? platform.color : undefined
                                                        }}
                                                    >
                                                        {platform.icon}
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

                                    {platforms.length > 0 && (
                                        <p className="text-sm text-center text-muted-foreground">
                                            Wybrano: {platforms.length} {platforms.length === 1 ? 'platformę' : 'platformy'}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Schedule */}
                            {currentStep === 'schedule' && (
                                <div className="space-y-6">
                                    {/* Presety */}
                                    <div className="space-y-3">
                                        <Label>Szybki wybór</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {QUICK_SCHEDULE_PRESETS.map((preset) => (
                                                <button
                                                    key={preset.id}
                                                    onClick={() => applyPreset(preset.id)}
                                                    className={cn(
                                                        "p-4 rounded-xl border-2 text-left transition-all",
                                                        "hover:border-primary/50",
                                                        selectedPreset === preset.id
                                                            ? "border-primary bg-primary/5"
                                                            : "border-border bg-card"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Zap className="w-4 h-4 text-primary" />
                                                        <span className="font-medium text-sm">{preset.name}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {preset.description}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        lub dostosuj
                      </span>
                                        </div>
                                    </div>

                                    <TimeSlotsPicker
                                        schedule={schedule}
                                        onChange={(s) => {
                                            setSchedule(s);
                                            setSelectedPreset(null);
                                        }}
                                    />
                                </div>
                            )}

                            {/* Step 4: Categories */}
                            {currentStep === 'categories' && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium mb-1">Kategorie tematyczne</h3>
                                        <p className="text-xs text-muted-foreground">
                                            Wybierz o czym mają być generowane posty. To opcjonalne - możesz pominąć.
                                        </p>
                                    </div>

                                    <ContentCategoriesEditor
                                        selectedCategories={selectedCategories}
                                        onChange={setSelectedCategories}
                                        maxCategories={6}
                                    />
                                </div>
                            )}

                            {/* Step 5: AI Settings */}
                            {currentStep === 'ai' && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium mb-1">Ustawienia generowania AI</h3>
                                        <p className="text-xs text-muted-foreground">
                                            Dostosuj jak AI ma tworzyć Twoje posty
                                        </p>
                                    </div>

                                    <AISettingsForm
                                        settings={generationSettings}
                                        onChange={setGenerationSettings}
                                    />
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