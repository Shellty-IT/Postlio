// src/components/calendar/schedule-modal.tsx
/**
 * Modal planowania posta w kalendarzu
 *
 * ✅ NAPRAWIONE: Obsługa platforms[] zamiast platform
 */

'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Calendar,
    Sparkles,
    Image as ImageIcon,
    Wand2,
    Send,
    Save,
    Loader2,
    Trash2,
    Clock,
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
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Platform } from '@/types';
import { useCalendarStore } from '@/store/calendar-store';
import { getPrimaryPlatformFromScheduledPost } from '@/types/calendar';
import {
    useCreatePost,
    useUpdatePost,
    useDeletePost,
    useBrands,
    useGenerateText,
    useUpdateQueueItem,
    useDeleteQueueItem,
} from '@/hooks';

// Schema walidacji
const schedulePostSchema = z.object({
    content: z.string().min(1, 'Treść jest wymagana').max(2200, 'Maksymalnie 2200 znaków'),
    platform: z.enum(['facebook', 'instagram', 'linkedin'], {
        required_error: 'Wybierz platformę',
    }),
    scheduledDate: z.string().min(1, 'Data jest wymagana'),
    scheduledHour: z.number().min(0).max(23),
    scheduledMinute: z.number().min(0).max(59),
    brandId: z.string().optional(),
});

type SchedulePostFormData = z.infer<typeof schedulePostSchema>;

const platformConfig: Record<Platform, { label: string; color: string; icon: string }> = {
    facebook: { label: 'Facebook', color: '#1877F2', icon: 'F' },
    instagram: { label: 'Instagram', color: '#E4405F', icon: 'I' },
    linkedin: { label: 'LinkedIn', color: '#0A66C2', icon: 'L' },
};

// Quick time presets
const TIME_PRESETS = [
    { label: '9:00', hour: 9, minute: 0 },
    { label: '12:00', hour: 12, minute: 0 },
    { label: '15:00', hour: 15, minute: 0 },
    { label: '18:00', hour: 18, minute: 0 },
    { label: '20:00', hour: 20, minute: 0 },
];

export function ScheduleModal() {
    const {
        isScheduleModalOpen,
        closeScheduleModal,
        selectedDate,
        selectedPost
    } = useCalendarStore();

    const [isGenerating, setIsGenerating] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    // API Hooks
    const { data: brandsData } = useBrands();
    const brands = brandsData?.brands || [];

    const createPost = useCreatePost({
        onSuccess: () => {
            closeScheduleModal();
        },
    });

    const updatePost = useUpdatePost({
        onSuccess: () => {
            closeScheduleModal();
        },
    });

    const deletePost = useDeletePost({
        onSuccess: () => {
            closeScheduleModal();
        },
    });

    // Posty z Autopilota zyja w osobnej tabeli (AutopilotQueueItem) i maja
    // wlasne endpointy - ich id w Kalendarzu jest prefiksowane ("autopilot-7"),
    // wiec wyslanie go do /posts skonczyloby sie bledem.
    const updateQueueItem = useUpdateQueueItem();
    const deleteQueueItem = useDeleteQueueItem();

    const isAutopilotPost = selectedPost?.origin === 'autopilot';
    const autopilotItemId = isAutopilotPost ? Number(String(selectedPost.id).replace('autopilot-', '')) : null;

    const generateText = useGenerateText({
        onSuccess: (data) => {
            setValue('content', data.data.content || '');
            setIsGenerating(false);
        },
        onError: () => {
            setIsGenerating(false);
        },
    });

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<SchedulePostFormData>({
        resolver: zodResolver(schedulePostSchema),
        defaultValues: {
            content: '',
            platform: 'facebook',
            scheduledDate: format(new Date(), 'yyyy-MM-dd'),
            scheduledHour: 12,
            scheduledMinute: 0,
            brandId: '',
        },
    });

    const content = watch('content');
    const selectedPlatform = watch('platform');
    const scheduledHour = watch('scheduledHour');
    const scheduledMinute = watch('scheduledMinute');
    const isEditing = !!selectedPost;
    const isSubmitting = createPost.isPending || updatePost.isPending;

    // Aktualizuj formularz gdy zmienia się selectedDate lub selectedPost
    useEffect(() => {
        if (selectedDate) {
            setValue('scheduledDate', format(selectedDate, 'yyyy-MM-dd'));
            setValue('scheduledHour', selectedDate.getHours());
            setValue('scheduledMinute', selectedDate.getMinutes());
        }
        if (selectedPost) {
            setValue('content', selectedPost.content);
            // ✅ NAPRAWIONE: Użyj helper function do pobrania platformy
            const primaryPlatform = getPrimaryPlatformFromScheduledPost(selectedPost);
            setValue('platform', primaryPlatform);
            const postDate = new Date(selectedPost.scheduledAt);
            setValue('scheduledDate', format(postDate, 'yyyy-MM-dd'));
            setValue('scheduledHour', postDate.getHours());
            setValue('scheduledMinute', postDate.getMinutes());
            if (selectedPost.brandId) {
                setValue('brandId', String(selectedPost.brandId));
            }
        }
    }, [selectedDate, selectedPost, setValue]);

    // Reset formularza po zamknięciu
    useEffect(() => {
        if (!isScheduleModalOpen) {
            reset();
        }
    }, [isScheduleModalOpen, reset]);

    const handlePlatformSelect = (platform: Platform) => {
        setValue('platform', platform);
    };

    const handleTimePreset = (hour: number, minute: number) => {
        setValue('scheduledHour', hour);
        setValue('scheduledMinute', minute);
    };

    const handleAIGenerate = async () => {
        setIsGenerating(true);
        generateText.mutate({
            topic: 'Angażujący post do social media',
            platform: selectedPlatform,
            tone: 'professional',
        });
    };

    const onSubmit = async (data: SchedulePostFormData) => {
        const scheduledAt = new Date(
            `${data.scheduledDate}T${String(data.scheduledHour).padStart(2, '0')}:${String(data.scheduledMinute).padStart(2, '0')}`
        ).toISOString();

        if (isEditing && isAutopilotPost && autopilotItemId !== null) {
            // Kolejka Autopilota wspiera edycję treści i terminu; platforma
            // i marka pochodzą z konfiguracji Autopilota, więc nie są tu edytowalne.
            await updateQueueItem.mutateAsync({
                itemId: autopilotItemId,
                data: {
                    content: data.content,
                    scheduled_for: scheduledAt,
                },
            });
            closeScheduleModal();
        } else if (isEditing && selectedPost) {
            // ✅ NAPRAWIONE: Używamy platforms[] zamiast platform
            await updatePost.mutateAsync({
                id: String(selectedPost.id),
                data: {
                    content: data.content,
                    platforms: [data.platform],  // ✅ Array zamiast singular
                    scheduled_at: scheduledAt,
                    brand_id: data.brandId ? Number(data.brandId) : undefined,
                },
            });
        } else {
            // ✅ NAPRAWIONE: Używamy platforms[] zamiast platform
            await createPost.mutateAsync({
                content: data.content,
                platforms: [data.platform],  // ✅ Array zamiast singular
                scheduled_at: scheduledAt,
                brand_id: data.brandId ? Number(data.brandId) : undefined,
                ai_generated: false,
            });
        }
    };

    const handleDelete = async () => {
        if (isAutopilotPost && autopilotItemId !== null) {
            await deleteQueueItem.mutateAsync(autopilotItemId);
            closeScheduleModal();
        } else if (selectedPost) {
            await deletePost.mutateAsync(String(selectedPost.id));
        }
        setShowDeleteAlert(false);
    };

    const characterLimit = 2200;
    const characterCount = content?.length || 0;
    const characterPercentage = (characterCount / characterLimit) * 100;

    // Format time display
    const formattedTime = `${String(scheduledHour).padStart(2, '0')}:${String(scheduledMinute).padStart(2, '0')}`;

    return (
        <>
            <Dialog open={isScheduleModalOpen} onOpenChange={closeScheduleModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card-strong border-white/10 bg-[#0d0e15]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            {isEditing ? 'Edytuj post' : 'Zaplanuj nowy post'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {isAutopilotPost && (
                            <div className="flex items-start gap-2.5 rounded-lg border border-accent/25 bg-accent/[0.06] px-3 py-2.5">
                                <Sparkles className="h-4 w-4 flex-shrink-0 text-accent mt-0.5" />
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Ten post pochodzi z <span className="font-medium text-foreground">Autopilota</span>.
                                    Możesz zmienić treść i termin — platforma oraz marka wynikają z konfiguracji Autopilota.
                                </p>
                            </div>
                        )}

                        {/* Platform Selector */}
                        <div className="space-y-2">
                            <Label>Platforma</Label>
                            <div className="flex gap-2">
                                {(Object.entries(platformConfig) as [Platform, typeof platformConfig.facebook][]).map(
                                    ([platform, config]) => (
                                        <button
                                            key={platform}
                                            type="button"
                                            onClick={() => handlePlatformSelect(platform)}
                                            disabled={isAutopilotPost}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all",
                                                selectedPlatform === platform
                                                    ? "border-current shadow-md"
                                                    : "border-transparent bg-white/[0.04] hover:bg-white/[0.07]",
                                                isAutopilotPost && "opacity-50 cursor-not-allowed hover:bg-white/[0.04]"
                                            )}
                                            style={{
                                                color: selectedPlatform === platform ? config.color : undefined,
                                                borderColor: selectedPlatform === platform ? config.color : undefined,
                                            }}
                                        >
                                            <div
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                                style={{ backgroundColor: config.color }}
                                            >
                                                {config.icon}
                                            </div>
                                            <span className="font-medium">{config.label}</span>
                                        </button>
                                    )
                                )}
                            </div>
                            {errors.platform && (
                                <p className="text-sm text-destructive">{errors.platform.message}</p>
                            )}
                        </div>

                        {/* Brand Selector */}
                        {!isAutopilotPost && (
                            <div className="space-y-2">
                                <Label>Marka (opcjonalnie)</Label>
                                <Select onValueChange={(value) => setValue('brandId', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Wybierz markę..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {brands.map((brand) => (
                                            <SelectItem key={brand.id} value={String(brand.id)}>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: brand.primaryColor || '#8B5CF6' }}
                                                    />
                                                    {brand.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Content */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Treść posta</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleAIGenerate}
                                    disabled={isGenerating}
                                    className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                                >
                                    {isGenerating ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Wand2 className="h-4 w-4 mr-2" />
                                    )}
                                    Generuj z AI
                                </Button>
                            </div>

                            <div className="relative">
                                <Textarea
                                    {...register('content')}
                                    placeholder="Napisz treść swojego posta..."
                                    className="min-h-[150px] resize-none pr-16"
                                />

                                {/* Character counter */}
                                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                    <div
                                        className={cn(
                                            "text-xs",
                                            characterPercentage > 90
                                                ? "text-destructive"
                                                : characterPercentage > 75
                                                    ? "text-warning"
                                                    : "text-muted-foreground"
                                        )}
                                    >
                                        {characterCount}/{characterLimit}
                                    </div>
                                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full transition-all",
                                                characterPercentage > 90
                                                    ? "bg-destructive"
                                                    : characterPercentage > 75
                                                        ? "bg-warning"
                                                        : "bg-primary"
                                            )}
                                            style={{ width: `${Math.min(characterPercentage, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            {errors.content && (
                                <p className="text-sm text-destructive">{errors.content.message}</p>
                            )}
                        </div>

                        {/* Image Upload (placeholder) */}
                        <div className="space-y-2">
                            <Label>Obraz</Label>
                            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Przeciągnij obraz lub kliknij, aby wybrać
                                </p>
                                <Button type="button" variant="ghost" size="sm" className="mt-2">
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generuj z AI
                                </Button>
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="space-y-4">
                            <Label className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Data i godzina publikacji
                            </Label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Date picker */}
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Data</Label>
                                    <Input
                                        type="date"
                                        {...register('scheduledDate')}
                                    />
                                    {errors.scheduledDate && (
                                        <p className="text-sm text-destructive">{errors.scheduledDate.message}</p>
                                    )}
                                </div>

                                {/* Visual time display */}
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Godzina</Label>
                                    <div className="flex items-center justify-center h-10 rounded-md border bg-muted/30 text-2xl font-mono font-bold text-primary">
                                        {formattedTime}
                                    </div>
                                </div>
                            </div>

                            {/* Time presets */}
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Szybki wybór</Label>
                                <div className="flex flex-wrap gap-2">
                                    {TIME_PRESETS.map((preset) => (
                                        <Button
                                            key={preset.label}
                                            type="button"
                                            variant={
                                                scheduledHour === preset.hour && scheduledMinute === preset.minute
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="sm"
                                            onClick={() => handleTimePreset(preset.hour, preset.minute)}
                                        >
                                            {preset.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Hour slider */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs text-muted-foreground">Godzina</Label>
                                    <span className="text-sm font-medium">{scheduledHour}:00</span>
                                </div>
                                <Slider
                                    value={[scheduledHour]}
                                    min={0}
                                    max={23}
                                    step={1}
                                    onValueChange={([value]) => setValue('scheduledHour', value)}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>0:00</span>
                                    <span>6:00</span>
                                    <span>12:00</span>
                                    <span>18:00</span>
                                    <span>23:00</span>
                                </div>
                            </div>

                            {/* Minute slider */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs text-muted-foreground">Minuta</Label>
                                    <span className="text-sm font-medium">:{String(scheduledMinute).padStart(2, '0')}</span>
                                </div>
                                <Slider
                                    value={[scheduledMinute]}
                                    min={0}
                                    max={59}
                                    step={5}
                                    onValueChange={([value]) => setValue('scheduledMinute', value)}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>:00</span>
                                    <span>:15</span>
                                    <span>:30</span>
                                    <span>:45</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="ghost" onClick={closeScheduleModal}>
                                    Anuluj
                                </Button>

                                {isEditing && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => setShowDeleteAlert(true)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Usuń
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button type="button" variant="outline">
                                    <Save className="h-4 w-4 mr-2" />
                                    Zapisz szkic
                                </Button>

                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4 mr-2" />
                                    )}
                                    {isEditing ? 'Zapisz zmiany' : 'Zaplanuj'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Usuń zaplanowany post?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ta akcja jest nieodwracalna. Post zostanie usunięty z kalendarza.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deletePost.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Usuń
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}