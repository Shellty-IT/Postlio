// src/components/autopilot/config-panel.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings,
    Plus,
    Trash2,
    Save,
    Calendar,
    Sparkles,
    Layers,
    Play,
    Pause,
    CheckCircle2,
    Clock,
    ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Platform } from '@/types';
import type {
    BackendAutopilotConfig,
    BackendAutopilotConfigUpdate,
    PostLength,
    DayOfWeekName,
    ThematicCategoryId,
} from '@/types/autopilot';
import {
    THEMATIC_CATEGORIES,
    POST_LENGTH_PRESETS,
    CREATIVITY_LEVEL_LABELS,
    DAYS_OF_WEEK,
} from '@/types/autopilot';

interface ConfigPanelProps {
    configs: BackendAutopilotConfig[];
    selectedConfigId: number | null;
    onSelectConfig: (id: number) => void;
    onUpdateConfig: (id: number, updates: BackendAutopilotConfigUpdate) => void;
    onDeleteConfig: (id: number) => void;
    onCreateNew: () => void;
    className?: string;
}

export function ConfigPanel({
                                configs,
                                selectedConfigId,
                                onSelectConfig,
                                onUpdateConfig,
                                onDeleteConfig,
                                onCreateNew,
                                className,
                            }: ConfigPanelProps) {
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [editedConfig, setEditedConfig] = useState<BackendAutopilotConfig | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const currentConfig = configs.find(c => c.id === selectedConfigId);

    useEffect(() => {
        if (currentConfig) {
            setEditedConfig({ ...currentConfig });
            setHasUnsavedChanges(false);
            if (isMobile) {
                setShowDetails(true);
            }
        } else {
            setEditedConfig(null);
        }
    }, [selectedConfigId, currentConfig, isMobile]);

    const updateEditedConfig = <K extends keyof BackendAutopilotConfig>(
        key: K,
        value: BackendAutopilotConfig[K]
    ) => {
        if (!editedConfig) return;
        setEditedConfig({ ...editedConfig, [key]: value });
        setHasUnsavedChanges(true);
    };

    const handleSave = () => {
        if (!editedConfig) return;

        const updates: BackendAutopilotConfigUpdate = {
            posts_per_week: editedConfig.posts_per_week,
            schedule_days: editedConfig.schedule_days,
            schedule_time: editedConfig.schedule_time,
            platforms: editedConfig.platforms,
            categories: editedConfig.categories,
            creativity_level: editedConfig.creativity_level,
            post_length: editedConfig.post_length as PostLength,
            include_images: editedConfig.include_images,
            include_hashtags: editedConfig.include_hashtags,
            include_emoji: editedConfig.include_emoji,
            text_provider: editedConfig.text_provider,
            image_provider: editedConfig.image_provider,
        };

        onUpdateConfig(editedConfig.id, updates);
        setHasUnsavedChanges(false);
    };

    const StatusBadge = ({ config }: { config: BackendAutopilotConfig }) => {
        const isActive = config.is_active;
        const isPaused = config.is_paused;

        let color = '#6B7280';
        let label = 'Nieaktywny';
        let Icon = Clock;

        if (isActive && !isPaused) {
            color = '#10B981';
            label = 'Aktywny';
            Icon = Play;
        } else if (isActive && isPaused) {
            color = '#F59E0B';
            label = 'Wstrzymany';
            Icon = Pause;
        }

        return (
            <Badge
                variant="outline"
                className="gap-1 text-[10px] xs:text-xs"
                style={{
                    borderColor: color,
                    color: color,
                    backgroundColor: `${color}10`,
                }}
            >
                <Icon className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                <span className="hidden xs:inline">{label}</span>
            </Badge>
        );
    };

    const toggleDay = (dayName: DayOfWeekName) => {
        if (!editedConfig) return;
        const currentDays = editedConfig.schedule_days || [];
        const newDays = currentDays.includes(dayName)
            ? currentDays.filter(d => d !== dayName)
            : [...currentDays, dayName];
        updateEditedConfig('schedule_days', newDays);
    };

    const toggleCategory = (categoryId: ThematicCategoryId) => {
        if (!editedConfig) return;
        const currentCategories = editedConfig.categories || [];
        const newCategories = currentCategories.includes(categoryId)
            ? currentCategories.filter(c => c !== categoryId)
            : [...currentCategories, categoryId];
        updateEditedConfig('categories', newCategories as ThematicCategoryId[]);
    };

    const togglePlatform = (platform: Platform) => {
        if (!editedConfig) return;
        const current = editedConfig.platforms || [];
        const updated = current.includes(platform)
            ? current.filter(p => p !== platform)
            : [...current, platform];
        updateEditedConfig('platforms', updated);
    };

    const configListContent = (
        <div className="space-y-3 xs:space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs xs:text-sm font-medium text-muted-foreground">
                    Konfiguracje ({configs.length})
                </h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onCreateNew}
                    className="gap-1.5 h-8 xs:h-9 text-xs"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Nowa</span>
                </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-320px)] md:h-[calc(100vh-280px)]">
                <div className="space-y-2 pr-2 xs:pr-4">
                    <AnimatePresence mode="popLayout">
                        {configs.map((config, index) => (
                            <motion.button
                                key={config.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => onSelectConfig(config.id)}
                                className={cn(
                                    "w-full p-3 xs:p-4 rounded-xl text-left transition-colors",
                                    "border",
                                    selectedConfigId === config.id
                                        ? "border-primary/40 bg-primary/[0.08]"
                                        : "border-white/[0.07] bg-white/[0.022] hover:border-primary/30"
                                )}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-xs xs:text-sm truncate">
                                            Marka #{config.brand_id}
                                        </h4>
                                        <p className="text-[10px] xs:text-xs text-muted-foreground truncate">
                                            {config.posts_per_week} postów/tydzień
                                        </p>
                                    </div>
                                    <StatusBadge config={config} />
                                </div>

                                <div className="flex items-center gap-1.5 mb-2">
                                    {config.platforms.map((platform) => (
                                        <div
                                            key={platform}
                                            className={cn(
                                                "w-4 h-4 xs:w-5 xs:h-5 rounded-full flex items-center justify-center text-white text-[8px] xs:text-[10px] font-bold",
                                                platform === 'facebook' && "bg-[#1877F2]",
                                                platform === 'instagram' && "bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]",
                                                platform === 'linkedin' && "bg-[#0A66C2]"
                                            )}
                                        >
                                            {platform[0].toUpperCase()}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2 xs:gap-3 text-[10px] xs:text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                                        {config.total_published}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {config.schedule_days?.length || 0} dni
                                    </span>
                                </div>
                            </motion.button>
                        ))}
                    </AnimatePresence>

                    {configs.length === 0 && (
                        <div className="text-center py-6 xs:py-8 text-muted-foreground">
                            <Settings className="w-6 h-6 xs:w-8 xs:h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs xs:text-sm">Brak konfiguracji</p>
                            <Button
                                variant="link"
                                size="sm"
                                onClick={onCreateNew}
                                className="mt-2 text-xs"
                            >
                                Utwórz pierwszą
                            </Button>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );

    const configDetailsContent = editedConfig ? (
        <div className="h-full flex flex-col">
            {isMobile && (
                <Button
                    variant="ghost"
                    onClick={() => setShowDetails(false)}
                    className="self-start mb-4 gap-2"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Powrót
                </Button>
            )}

            <div className="flex items-center justify-between mb-4 xs:mb-6 flex-wrap gap-2">
                <div className="flex items-center gap-2 xs:gap-4 min-w-0">
                    <div className="min-w-0">
                        <h2 className="text-base xs:text-lg font-semibold truncate">
                            Konfiguracja #{editedConfig.id}
                        </h2>
                        <p className="text-xs xs:text-sm text-muted-foreground">
                            Marka #{editedConfig.brand_id}
                        </p>
                    </div>
                    <StatusBadge config={editedConfig} />
                </div>

                <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                        <Badge variant="outline" className="text-amber-500 border-amber-500 text-[10px] xs:text-xs">
                            Niezapisane
                        </Badge>
                    )}

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="text-destructive h-9 w-9 xs:h-10 xs:w-10">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[calc(100vw-2rem)] xs:max-w-lg">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Usuń konfigurację?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Ta akcja jest nieodwracalna.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col xs:flex-row gap-2">
                                <AlertDialogCancel className="w-full xs:w-auto">Anuluj</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => onDeleteConfig(editedConfig.id)}
                                    className="w-full xs:w-auto bg-destructive hover:bg-destructive/90"
                                >
                                    Usuń
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Button
                        onClick={handleSave}
                        disabled={!hasUnsavedChanges}
                        className="gap-2 h-9 xs:h-10"
                    >
                        <Save className="w-4 h-4" />
                        <span className="hidden xs:inline">Zapisz</span>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="schedule" className="flex-1">
                <TabsList className="mb-4 xs:mb-6 w-full xs:w-auto grid grid-cols-3 xs:inline-flex bg-white/[0.03] border border-white/[0.07] p-1 rounded-xl">
                    <TabsTrigger value="schedule" className="gap-1 xs:gap-2 text-xs xs:text-sm rounded-lg data-[state=active]:pill-active data-[state=active]:shadow-none">
                        <Calendar className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                        <span className="hidden xs:inline">Harmonogram</span>
                    </TabsTrigger>
                    <TabsTrigger value="categories" className="gap-1 xs:gap-2 text-xs xs:text-sm rounded-lg data-[state=active]:pill-active data-[state=active]:shadow-none">
                        <Layers className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                        <span className="hidden xs:inline">Kategorie</span>
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="gap-1 xs:gap-2 text-xs xs:text-sm rounded-lg data-[state=active]:pill-active data-[state=active]:shadow-none">
                        <Sparkles className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                        <span className="hidden xs:inline">AI</span>
                    </TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[calc(100vh-420px)] xs:h-[calc(100vh-400px)] md:h-[calc(100vh-380px)]">
                    <TabsContent value="schedule" className="mt-0 pr-2 xs:pr-4 space-y-4 xs:space-y-6">
                        <div className="space-y-2 xs:space-y-3">
                            <Label className="text-xs xs:text-sm">Posty tygodniowo: {editedConfig.posts_per_week}</Label>
                            <Input
                                type="range"
                                min={1}
                                max={14}
                                step={1}
                                value={editedConfig.posts_per_week}
                                onChange={(e) => updateEditedConfig('posts_per_week', Number(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs xs:text-sm">Godzina publikacji</Label>
                            <Input
                                type="time"
                                value={editedConfig.schedule_time}
                                onChange={(e) => updateEditedConfig('schedule_time', e.target.value)}
                                className="h-10 xs:h-11"
                            />
                        </div>

                        <div className="space-y-2 xs:space-y-3">
                            <Label className="text-xs xs:text-sm">Dni publikacji</Label>
                            <div className="flex flex-wrap gap-1.5 xs:gap-2">
                                {DAYS_OF_WEEK.map((day) => (
                                    <Button
                                        key={day.name}
                                        variant={editedConfig.schedule_days?.includes(day.name) ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => toggleDay(day.name)}
                                        className="h-8 xs:h-9 px-2 xs:px-3 text-xs"
                                    >
                                        {day.short}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2 xs:space-y-3">
                            <Label className="text-xs xs:text-sm">Platformy</Label>
                            <div className="flex gap-2 xs:gap-3">
                                {(['facebook', 'instagram', 'linkedin'] as Platform[]).map((platform) => (
                                    <Button
                                        key={platform}
                                        variant={editedConfig.platforms?.includes(platform) ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => togglePlatform(platform)}
                                        className="capitalize h-8 xs:h-9 text-xs"
                                    >
                                        {platform}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="categories" className="mt-0 pr-2 xs:pr-4">
                        <div className="space-y-3 xs:space-y-4">
                            <p className="text-xs xs:text-sm text-muted-foreground">
                                Wybierz kategorie tematyczne
                            </p>
                            <div className="grid grid-cols-2 xs:grid-cols-3 gap-1.5 xs:gap-2">
                                {THEMATIC_CATEGORIES.slice(0, 18).map((category) => (
                                    <Button
                                        key={category.id}
                                        variant={editedConfig.categories?.includes(category.id as ThematicCategoryId) ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => toggleCategory(category.id as ThematicCategoryId)}
                                        className="gap-1.5 justify-start h-9 xs:h-10 text-xs"
                                    >
                                        <span>{category.icon}</span>
                                        <span className="truncate">{category.name}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="ai" className="mt-0 pr-2 xs:pr-4 space-y-4 xs:space-y-6">
                        <div className="space-y-2 xs:space-y-3">
                            <Label className="text-xs xs:text-sm">
                                Kreatywność: {editedConfig.creativity_level}%
                            </Label>
                            <Input
                                type="range"
                                min={0}
                                max={100}
                                step={10}
                                value={editedConfig.creativity_level}
                                onChange={(e) => updateEditedConfig('creativity_level', Number(e.target.value))}
                                className="w-full"
                            />
                            <p className="text-[10px] xs:text-xs text-muted-foreground">
                                {CREATIVITY_LEVEL_LABELS.find(l => l.value <= editedConfig.creativity_level)?.description || 'Zbalansowany'}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs xs:text-sm">Długość postów</Label>
                            <Select
                                value={editedConfig.post_length}
                                onValueChange={(value: PostLength) => updateEditedConfig('post_length', value)}
                            >
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
                            <Label className="text-xs xs:text-sm">Dostawca tekstu</Label>
                            <Select
                                value={editedConfig.text_provider}
                                onValueChange={(value: string) => updateEditedConfig('text_provider', value)}
                            >
                                <SelectTrigger className="h-10 xs:h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gemini">Gemini 2.5 ✨</SelectItem>
                                    <SelectItem value="groq">Groq ⚡</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs xs:text-sm">Dostawca obrazów</Label>
                            <Select
                                value={editedConfig.image_provider}
                                onValueChange={(value: string) => updateEditedConfig('image_provider', value)}
                            >
                                <SelectTrigger className="h-10 xs:h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pollinations">Pollinations 🌸</SelectItem>
                                    <SelectItem value="huggingface">HuggingFace 🤗</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3 xs:space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs xs:text-sm">Generuj obrazy</Label>
                                <Switch
                                    checked={editedConfig.include_images}
                                    onCheckedChange={(checked: boolean) => updateEditedConfig('include_images', checked)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="text-xs xs:text-sm">Hashtagi</Label>
                                <Switch
                                    checked={editedConfig.include_hashtags}
                                    onCheckedChange={(checked: boolean) => updateEditedConfig('include_hashtags', checked)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="text-xs xs:text-sm">Emoji</Label>
                                <Switch
                                    checked={editedConfig.include_emoji}
                                    onCheckedChange={(checked: boolean) => updateEditedConfig('include_emoji', checked)}
                                />
                            </div>
                        </div>
                    </TabsContent>
                </ScrollArea>
            </Tabs>
        </div>
    ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
                <Settings className="w-10 h-10 xs:w-12 xs:h-12 mx-auto mb-3 xs:mb-4 opacity-30" />
                <h3 className="text-base xs:text-lg font-medium mb-2">Wybierz konfigurację</h3>
                <p className="text-xs xs:text-sm mb-4">
                    Wybierz z listy lub utwórz nową
                </p>
                <Button
                    variant="outline"
                    onClick={onCreateNew}
                    className="gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Nowa konfiguracja
                </Button>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <div className={cn('h-full', className)}>
                {!showDetails ? (
                    configListContent
                ) : (
                    <Sheet open={showDetails} onOpenChange={setShowDetails}>
                        <SheetContent side="right" className="w-full xs:w-[85vw] max-w-md p-4">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Szczegóły konfiguracji</SheetTitle>
                            </SheetHeader>
                            {configDetailsContent}
                        </SheetContent>
                    </Sheet>
                )}
                {!showDetails && configListContent}
            </div>
        );
    }

    return (
        <div className={cn('flex h-full gap-4 sm:gap-6', className)}>
            <div className="w-56 sm:w-64 lg:w-72 flex-shrink-0">
                {configListContent}
            </div>
            <div className="flex-1 min-w-0">
                {configDetailsContent}
            </div>
        </div>
    );
}