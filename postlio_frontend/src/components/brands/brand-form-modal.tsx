// src/components/brands/brand-form-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    X,
    PenTool,
    Palette,
    MessageSquare,
    Hash,
    Save,
    Loader2,
    ChevronRight,
    ChevronLeft,
    Wand2,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
    DEFAULT_VOICE_DNA,
    PERSONALITY_TRAITS,
    COMMUNICATION_STYLES,
    INDUSTRIES,
} from '@/types/brand';
import type {
    PersonalityTrait,
    CommunicationStyle,
    BrandVoiceDNA,
} from '@/types/brand';
import { useBrandsStore } from '@/store/brands-store';
import { useCreateBrand, useUpdateBrand, useAnalyzeBrandVoice } from '@/hooks/useBrands';
import { WritingStyleRadar } from './writing-style-radar';
import { ToneSlider } from './tone-slider';

const brandSchema = z.object({
    name: z.string().min(2, 'Nazwa musi mieć co najmniej 2 znaki'),
    description: z.string().optional(),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Nieprawidłowy kolor'),
    industry: z.string().optional(),
    targetAudience: z.string().optional(),
});

type FormData = z.infer<typeof brandSchema>;

const STEPS = [
    { id: 'basic', title: 'Podstawowe', icon: Palette },
    { id: 'tone', title: 'Ton pisania', icon: MessageSquare },
    { id: 'personality', title: 'Charakter', icon: PenTool },
    { id: 'keywords', title: 'Słowa kluczowe', icon: Hash },
];

export function BrandFormModal() {
    const { isFormOpen, closeForm, editingBrandId, getBrandById } = useBrandsStore();
    const [currentStep, setCurrentStep] = useState(0);
    const [voiceDNA, setVoiceDNA] = useState<BrandVoiceDNA>(DEFAULT_VOICE_DNA);
    const [sampleTexts, setSampleTexts] = useState<string[]>(['']);

    const editingBrand = editingBrandId ? getBrandById(editingBrandId) : null;

    // API hooks
    const createBrand = useCreateBrand({
        onSuccess: () => {
            closeForm();
        },
    });

    const updateBrand = useUpdateBrand({
        onSuccess: () => {
            closeForm();
        },
    });

    const analyzeVoice = useAnalyzeBrandVoice({
        onSuccess: (data) => {
            setVoiceDNA(data.voiceDNA);
        },
    });

    const isSubmitting = createBrand.isPending || updateBrand.isPending;

    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(brandSchema),
        defaultValues: {
            name: '',
            description: '',
            primaryColor: '#8B5CF6',
            industry: '',
            targetAudience: '',
        },
    });

    const primaryColor = watch('primaryColor');

    // Load editing brand data
    useEffect(() => {
        if (editingBrand) {
            reset({
                name: editingBrand.name,
                description: editingBrand.description || '',
                primaryColor: editingBrand.primaryColor,
                industry: editingBrand.industry || '',
                targetAudience: editingBrand.targetAudience || '',
            });
            setVoiceDNA(editingBrand.voiceDNA);
        } else {
            reset({
                name: '',
                description: '',
                primaryColor: '#8B5CF6',
                industry: '',
                targetAudience: '',
            });
            setVoiceDNA(DEFAULT_VOICE_DNA);
        }
        setCurrentStep(0);
        setSampleTexts(['']);
    }, [editingBrand, reset, isFormOpen]);

    const togglePersonalityTrait = (trait: PersonalityTrait) => {
        setVoiceDNA((prev) => ({
            ...prev,
            personalityTraits: prev.personalityTraits.includes(trait)
                ? prev.personalityTraits.filter((t) => t !== trait)
                : [...prev.personalityTraits, trait],
        }));
    };

    const addKeyword = (keyword: string) => {
        if (keyword.trim() && !voiceDNA.keywords.includes(keyword.trim())) {
            setVoiceDNA((prev) => ({
                ...prev,
                keywords: [...prev.keywords, keyword.trim()],
            }));
        }
    };

    const removeKeyword = (keyword: string) => {
        setVoiceDNA((prev) => ({
            ...prev,
            keywords: prev.keywords.filter((k) => k !== keyword),
        }));
    };

    const addHashtag = (hashtag: string) => {
        let tag = hashtag.trim();
        if (!tag.startsWith('#')) tag = '#' + tag;
        if (!voiceDNA.hashtags.includes(tag)) {
            setVoiceDNA((prev) => ({
                ...prev,
                hashtags: [...prev.hashtags, tag],
            }));
        }
    };

    const removeHashtag = (hashtag: string) => {
        setVoiceDNA((prev) => ({
            ...prev,
            hashtags: prev.hashtags.filter((h) => h !== hashtag),
        }));
    };

    const handleAnalyzeVoice = () => {
        const validTexts = sampleTexts.filter((t) => t.trim().length > 20);
        if (validTexts.length === 0) {
            return;
        }
        analyzeVoice.mutate({ sample_content: validTexts });
    };

    const onSubmit = async (data: FormData) => {
        const brandData = {
            name: data.name,
            description: data.description,
            primaryColor: data.primaryColor,
            industry: data.industry,
            targetAudience: data.targetAudience,
            voiceDNA,
        };

        if (editingBrand) {
            updateBrand.mutate({
                id: editingBrand.id,
                data: brandData,
            });
        } else {
            createBrand.mutate(brandData);
        }
    };

    const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

    return (
        <Dialog open={isFormOpen} onOpenChange={closeForm}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <PenTool className="h-5 w-5 text-violet-500" />
                        {editingBrand ? 'Edytuj markę' : 'Utwórz nową markę'}
                    </DialogTitle>
                </DialogHeader>

                {/* Steps indicator */}
                <div className="flex items-center justify-between px-2 py-4 border-b">
                    {STEPS.map((step, index) => (
                        <button
                            key={step.id}
                            onClick={() => setCurrentStep(index)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                                currentStep === index
                                    ? "bg-primary/10 text-primary"
                                    : currentStep > index
                                        ? "text-green-500"
                                        : "text-muted-foreground"
                            )}
                        >
                            <step.icon className="h-4 w-4" />
                            <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Basic Info */}
                            {currentStep === 0 && (
                                <motion.div
                                    key="basic"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Nazwa marki *</Label>
                                            <Input {...register('name')} placeholder="Np. Moja Firma" />
                                            {errors.name && (
                                                <p className="text-sm text-destructive">{errors.name.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Kolor główny</Label>
                                            <div className="flex gap-2">
                                                <Input {...register('primaryColor')} type="color" className="w-12 h-10 p-1" />
                                                <Input {...register('primaryColor')} placeholder="#8B5CF6" className="flex-1" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Opis</Label>
                                        <Textarea
                                            {...register('description')}
                                            placeholder="Krótki opis marki..."
                                            rows={3}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Branża</Label>
                                            <Controller
                                                name="industry"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Wybierz branżę..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {INDUSTRIES.map((industry) => (
                                                                <SelectItem key={industry} value={industry}>
                                                                    {industry}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Grupa docelowa</Label>
                                            <Input
                                                {...register('targetAudience')}
                                                placeholder="Np. Młodzi profesjonaliści 25-40"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Tone of Writing */}
                            {currentStep === 1 && (
                                <motion.div
                                    key="tone"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {/* AI Analysis Section */}
                                    <div className="p-4 rounded-lg border border-dashed border-violet-300 bg-violet-50/50 dark:bg-violet-950/20">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Wand2 className="h-5 w-5 text-violet-500" />
                                            <span className="font-medium">Automatyczna analiza AI</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Wklej przykładowe posty lub teksty marki, a AI przeanalizuje styl pisania.
                                        </p>
                                        <div className="space-y-2">
                                            {sampleTexts.map((text, index) => (
                                                <Textarea
                                                    key={index}
                                                    value={text}
                                                    onChange={(e) => {
                                                        const newTexts = [...sampleTexts];
                                                        newTexts[index] = e.target.value;
                                                        setSampleTexts(newTexts);
                                                    }}
                                                    placeholder={`Przykładowy tekst ${index + 1}...`}
                                                    rows={2}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSampleTexts([...sampleTexts, ''])}
                                            >
                                                + Dodaj tekst
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="default"
                                                size="sm"
                                                onClick={handleAnalyzeVoice}
                                                disabled={analyzeVoice.isPending || sampleTexts.every(t => t.trim().length < 20)}
                                            >
                                                {analyzeVoice.isPending ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Wand2 className="h-4 w-4 mr-2" />
                                                )}
                                                Analizuj z AI
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <ToneSlider
                                                label="Formalność"
                                                value={voiceDNA.toneFormality}
                                                onChange={(v) => setVoiceDNA((prev) => ({ ...prev, toneFormality: v }))}
                                                leftLabel="Casualowy"
                                                rightLabel="Formalny"
                                                color={primaryColor}
                                            />
                                            <ToneSlider
                                                label="Energia"
                                                value={voiceDNA.toneEnergy}
                                                onChange={(v) => setVoiceDNA((prev) => ({ ...prev, toneEnergy: v }))}
                                                leftLabel="Spokojny"
                                                rightLabel="Energiczny"
                                                color={primaryColor}
                                            />
                                            <ToneSlider
                                                label="Humor"
                                                value={voiceDNA.toneHumor}
                                                onChange={(v) => setVoiceDNA((prev) => ({ ...prev, toneHumor: v }))}
                                                leftLabel="Poważny"
                                                rightLabel="Humorystyczny"
                                                color={primaryColor}
                                            />
                                            <ToneSlider
                                                label="Emocjonalność"
                                                value={voiceDNA.toneEmotion}
                                                onChange={(v) => setVoiceDNA((prev) => ({ ...prev, toneEmotion: v }))}
                                                leftLabel="Rzeczowy"
                                                rightLabel="Emocjonalny"
                                                color={primaryColor}
                                            />
                                        </div>

                                        <div className="flex items-center justify-center">
                                            <WritingStyleRadar voiceDNA={voiceDNA} primaryColor={primaryColor} size={220} />
                                        </div>
                                    </div>

                                    {/* Communication Style */}
                                    <div className="space-y-3">
                                        <Label>Styl komunikacji</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {(Object.entries(COMMUNICATION_STYLES) as [CommunicationStyle, typeof COMMUNICATION_STYLES.informative][]).map(
                                                ([key, style]) => (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => setVoiceDNA((prev) => ({ ...prev, communicationStyle: key }))}
                                                        className={cn(
                                                            "p-3 rounded-lg border text-left transition-all",
                                                            voiceDNA.communicationStyle === key
                                                                ? "border-primary bg-primary/5"
                                                                : "hover:bg-muted"
                                                        )}
                                                    >
                                                        <div className="font-medium text-sm">{style.label}</div>
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {style.description}
                                                        </div>
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Personality (Character) */}
                            {currentStep === 2 && (
                                <motion.div
                                    key="personality"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4"
                                >
                                    <div>
                                        <Label>Charakter treści</Label>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Wybierz cechy, które najlepiej opisują charakter Twoich treści
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {(Object.entries(PERSONALITY_TRAITS) as [PersonalityTrait, typeof PERSONALITY_TRAITS.innovative][]).map(
                                            ([key, trait]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => togglePersonalityTrait(key)}
                                                    className={cn(
                                                        "flex items-center gap-2 p-3 rounded-lg border transition-all",
                                                        voiceDNA.personalityTraits.includes(key)
                                                            ? "border-primary bg-primary/10"
                                                            : "hover:bg-muted"
                                                    )}
                                                >
                                                    <span className="text-lg">{trait.icon}</span>
                                                    <span className="text-sm font-medium">{trait.label}</span>
                                                </button>
                                            )
                                        )}
                                    </div>

                                    {voiceDNA.personalityTraits.length > 0 && (
                                        <div className="p-4 rounded-lg bg-muted/50">
                                            <div className="text-sm font-medium mb-2">Wybrany charakter:</div>
                                            <div className="flex flex-wrap gap-2">
                                                {voiceDNA.personalityTraits.map((trait) => (
                                                    <Badge key={trait} variant="secondary">
                                                        {PERSONALITY_TRAITS[trait].icon} {PERSONALITY_TRAITS[trait].label}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Step 4: Keywords */}
                            {currentStep === 3 && (
                                <motion.div
                                    key="keywords"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    {/* Keywords */}
                                    <div className="space-y-3">
                                        <Label>Słowa kluczowe</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Dodaj słowo kluczowe..."
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addKeyword(e.currentTarget.value);
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={(e) => {
                                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                    addKeyword(input.value);
                                                    input.value = '';
                                                }}
                                            >
                                                Dodaj
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {voiceDNA.keywords.map((keyword) => (
                                                <Badge
                                                    key={keyword}
                                                    variant="secondary"
                                                    className="cursor-pointer hover:bg-destructive/20"
                                                    onClick={() => removeKeyword(keyword)}
                                                >
                                                    {keyword} <X className="h-3 w-3 ml-1" />
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Hashtags */}
                                    <div className="space-y-3">
                                        <Label>Hashtagi</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Dodaj hashtag..."
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addHashtag(e.currentTarget.value);
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={(e) => {
                                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                    addHashtag(input.value);
                                                    input.value = '';
                                                }}
                                            >
                                                Dodaj
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {voiceDNA.hashtags.map((hashtag) => (
                                                <Badge
                                                    key={hashtag}
                                                    variant="outline"
                                                    className="cursor-pointer hover:bg-destructive/20 text-primary"
                                                    onClick={() => removeHashtag(hashtag)}
                                                >
                                                    {hashtag} <X className="h-3 w-3 ml-1" />
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Emoji usage */}
                                    <div className="space-y-3">
                                        <Label>Używanie emoji</Label>
                                        <div className="flex gap-2 flex-wrap">
                                            {(['none', 'minimal', 'moderate', 'frequent'] as const).map((usage) => (
                                                <button
                                                    key={usage}
                                                    type="button"
                                                    onClick={() => setVoiceDNA((prev) => ({ ...prev, emojiUsage: usage }))}
                                                    className={cn(
                                                        "px-4 py-2 rounded-lg border transition-all",
                                                        voiceDNA.emojiUsage === usage
                                                            ? "border-primary bg-primary/10"
                                                            : "hover:bg-muted"
                                                    )}
                                                >
                                                    {usage === 'none' && '🚫 Brak'}
                                                    {usage === 'minimal' && '😊 Minimalne'}
                                                    {usage === 'moderate' && '😊🎉 Umiarkowane'}
                                                    {usage === 'frequent' && '🎉🚀💪 Częste'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t bg-muted/30">
                        <Button type="button" variant="ghost" onClick={closeForm}>
                            Anuluj
                        </Button>

                        <div className="flex items-center gap-2">
                            {currentStep > 0 && (
                                <Button type="button" variant="outline" onClick={prevStep}>
                                    <ChevronLeft className="h-4 w-4 mr-2" />
                                    Wstecz
                                </Button>
                            )}

                            {currentStep < STEPS.length - 1 ? (
                                <Button type="button" onClick={nextStep}>
                                    Dalej
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            ) : (
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    {editingBrand ? 'Zapisz zmiany' : 'Utwórz markę'}
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}