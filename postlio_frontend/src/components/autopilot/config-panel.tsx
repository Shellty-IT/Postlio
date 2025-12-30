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
    MessageSquare,
    Play,
    Pause,
    AlertCircle,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { ContentCategoriesEditor } from './content-categories-editor';
import { TopicsManager } from './topics-manager';
import { AISettingsForm } from './ai-settings-form';
import { TimeSlotsPicker } from './time-slots-picker';
import {
    AutopilotConfig,
    AutopilotStatus,
    AUTOPILOT_STATUS_CONFIG,
    SelectedCategory,
} from '@/types/autopilot';

interface ConfigPanelProps {
    configs: AutopilotConfig[];
    selectedConfigId: string | null;
    onSelectConfig: (id: string | null) => void;
    onUpdateConfig: (id: string, updates: Partial<AutopilotConfig>) => void;
    onDeleteConfig: (id: string) => void;
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
    const [editedConfig, setEditedConfig] = useState<AutopilotConfig | null>(null);

    const currentConfig = configs.find(c => c.id === selectedConfigId);

    // Sync edited config when selection changes
    useEffect(() => {
        if (currentConfig) {
            setEditedConfig({ ...currentConfig });
            setHasUnsavedChanges(false);
        } else {
            setEditedConfig(null);
        }
    }, [selectedConfigId, currentConfig]);

    // Inicjalizuj edycję gdy zmieni się selekcja
    const handleSelectConfig = (id: string) => {
        onSelectConfig(id);
    };

    // Aktualizuj edytowaną konfigurację
    const updateEditedConfig = <K extends keyof AutopilotConfig>(
        key: K,
        value: AutopilotConfig[K]
    ) => {
        if (!editedConfig) return;
        setEditedConfig({ ...editedConfig, [key]: value });
        setHasUnsavedChanges(true);
    };

    // Zapisz zmiany
    const handleSave = () => {
        if (!editedConfig) return;
        onUpdateConfig(editedConfig.id, editedConfig);
        setHasUnsavedChanges(false);
    };

    // Pobierz kategorie jako SelectedCategory[] z topics
    const getSelectedCategories = (): SelectedCategory[] => {
        if (!editedConfig) return [];
        // Mapuj z topics na kategorie (uproszczona logika)
        const categoryMap = new Map<string, number>();

        editedConfig.topics.forEach(t => {
            const current = categoryMap.get(t.category) || 0;
            categoryMap.set(t.category, current + 1);
        });

        const total = editedConfig.topics.length || 1;
        return Array.from(categoryMap.entries()).map(([categoryId, count]) => ({
            categoryId,
            percentage: Math.round((count / total) * 100),
        }));
    };

    // Aktualizuj kategorie (placeholder - w przyszłości można rozbudować)
    const handleCategoriesChange = () => {
        if (!editedConfig) return;
        setHasUnsavedChanges(true);
    };

    // Status badge
    const StatusBadge = ({ status }: { status: AutopilotStatus }) => {
        const config = AUTOPILOT_STATUS_CONFIG[status];
        return (
            <Badge
                variant="outline"
                className="gap-1"
                style={{
                    borderColor: config.color,
                    color: config.color,
                    backgroundColor: `${config.color}10`,
                }}
            >
                {status === 'active' && <Play className="w-3 h-3" />}
                {status === 'paused' && <Pause className="w-3 h-3" />}
                {status === 'error' && <AlertCircle className="w-3 h-3" />}
                {status === 'inactive' && <Clock className="w-3 h-3" />}
                {config.label}
            </Badge>
        );
    };

    return (
        <div className={cn('flex h-full gap-6', className)}>
            {/* Lista konfiguracji - lewa strona */}
            <div className="w-72 flex-shrink-0 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">
                        Konfiguracje ({configs.length})
                    </h3>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onCreateNew}
                        className="gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Nowa
                    </Button>
                </div>

                <ScrollArea className="h-[calc(100vh-280px)]">
                    <div className="space-y-2 pr-4">
                        <AnimatePresence mode="popLayout">
                            {configs.map((config, index) => (
                                <motion.button
                                    key={config.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => handleSelectConfig(config.id)}
                                    className={cn(
                                        "w-full p-4 rounded-xl text-left transition-all",
                                        "border-2",
                                        selectedConfigId === config.id
                                            ? "border-primary bg-primary/5"
                                            : "border-border bg-card hover:border-primary/30"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm truncate">
                                                {config.name}
                                            </h4>
                                            <p className="text-xs text-muted-foreground truncate">
                                                Brand ID: {config.brandId}
                                            </p>
                                        </div>
                                        <StatusBadge status={config.status} />
                                    </div>

                                    {/* Platformy */}
                                    <div className="flex items-center gap-1.5 mb-2">
                                        {config.platforms.map(platform => (
                                            <div
                                                key={platform}
                                                className={cn(
                                                    "w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold",
                                                    platform === 'facebook' && "bg-[#1877F2]",
                                                    platform === 'instagram' && "bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]",
                                                    platform === 'linkedin' && "bg-[#0A66C2]"
                                                )}
                                            >
                                                {platform[0].toUpperCase()}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                        {config.totalPublished}
                    </span>
                                        <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                                            {config.schedule.timeSlots.length}x/{config.schedule.selectedDays.length} dni
                    </span>
                                    </div>
                                </motion.button>
                            ))}
                        </AnimatePresence>

                        {configs.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Brak konfiguracji</p>
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={onCreateNew}
                                    className="mt-2"
                                >
                                    Utwórz pierwszą
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Panel szczegółów - prawa strona */}
            <div className="flex-1 min-w-0">
                {editedConfig ? (
                    <div className="h-full flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div>
                                    <Input
                                        value={editedConfig.name}
                                        onChange={(e) => updateEditedConfig('name', e.target.value)}
                                        className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0"
                                        placeholder="Nazwa konfiguracji"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Brand ID: {editedConfig.brandId}
                                    </p>
                                </div>
                                <StatusBadge status={editedConfig.status} />
                            </div>

                            <div className="flex items-center gap-2">
                                {hasUnsavedChanges && (
                                    <Badge variant="outline" className="text-amber-500 border-amber-500">
                                        Niezapisane zmiany
                                    </Badge>
                                )}

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="icon" className="text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Usuń konfigurację?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Ta akcja jest nieodwracalna. Konfiguracja &quot;{editedConfig.name}&quot;
                                                zostanie trwale usunięta wraz z wszystkimi powiązanymi postami w kolejce.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => onDeleteConfig(editedConfig.id)}
                                                className="bg-destructive hover:bg-destructive/90"
                                            >
                                                Usuń
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                                <Button
                                    onClick={handleSave}
                                    disabled={!hasUnsavedChanges}
                                    className="gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Zapisz
                                </Button>
                            </div>
                        </div>

                        {/* Tabs z sekcjami */}
                        <Tabs defaultValue="schedule" className="flex-1">
                            <TabsList className="mb-6">
                                <TabsTrigger value="schedule" className="gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Harmonogram
                                </TabsTrigger>
                                <TabsTrigger value="categories" className="gap-2">
                                    <Layers className="w-4 h-4" />
                                    Kategorie
                                </TabsTrigger>
                                <TabsTrigger value="topics" className="gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Tematy
                                </TabsTrigger>
                                <TabsTrigger value="ai" className="gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Ustawienia AI
                                </TabsTrigger>
                            </TabsList>

                            <ScrollArea className="h-[calc(100vh-380px)]">
                                <TabsContent value="schedule" className="mt-0 pr-4">
                                    <div className="space-y-6">
                                        {/* Require approval switch */}
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
                                                    checked={editedConfig.requiresApproval}
                                                    onCheckedChange={(v) => updateEditedConfig('requiresApproval', v)}
                                                />
                                            </div>
                                        </div>

                                        <TimeSlotsPicker
                                            schedule={editedConfig.schedule}
                                            onChange={(schedule) => updateEditedConfig('schedule', schedule)}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="categories" className="mt-0 pr-4">
                                    <ContentCategoriesEditor
                                        selectedCategories={getSelectedCategories()}
                                        onChange={handleCategoriesChange}
                                    />
                                </TabsContent>

                                <TabsContent value="topics" className="mt-0 pr-4">
                                    <TopicsManager
                                        topics={editedConfig.topics}
                                        onChange={(topics) => updateEditedConfig('topics', topics)}
                                        categoryHints={getSelectedCategories().map(c => c.categoryId)}
                                    />
                                </TabsContent>

                                <TabsContent value="ai" className="mt-0 pr-4">
                                    <AISettingsForm
                                        settings={editedConfig.generationSettings}
                                        onChange={(settings) => updateEditedConfig('generationSettings', settings)}
                                    />
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <Settings className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <h3 className="text-lg font-medium mb-2">Wybierz konfigurację</h3>
                            <p className="text-sm">
                                Wybierz konfigurację z listy po lewej stronie lub utwórz nową
                            </p>
                            <Button
                                variant="outline"
                                onClick={onCreateNew}
                                className="mt-4 gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Utwórz nową konfigurację
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}