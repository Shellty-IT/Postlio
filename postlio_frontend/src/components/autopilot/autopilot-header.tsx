// src/components/autopilot/autopilot-header.tsx
'use client';

import {
    Play,
    Pause,
    Zap,
    ChevronDown,
    Plus,
    RefreshCw,
    Settings,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BackendAutopilotConfig } from '@/types/autopilot';

interface AutopilotHeaderProps {
    selectedConfig?: BackendAutopilotConfig;
    configs: BackendAutopilotConfig[];
    isRunning: boolean;
    isGenerating?: boolean;
    onSelectConfig: (config: BackendAutopilotConfig) => void;
    onToggleAutopilot: () => void;
    onGenerateNow: () => void;
    onCreateNew: () => void;
}

export function AutopilotHeader({
                                    selectedConfig,
                                    configs,
                                    isRunning,
                                    isGenerating = false,
                                    onSelectConfig,
                                    onToggleAutopilot,
                                    onGenerateNow,
                                    onCreateNew,
                                }: AutopilotHeaderProps) {

    // Status indicator
    const StatusIndicator = ({ config }: { config: BackendAutopilotConfig }) => {
        const isActive = config.is_active;
        const isPaused = config.is_paused;

        let color = '#6B7280'; // inactive
        let label = 'Nieaktywny';

        if (isActive && !isPaused) {
            color = '#10B981';
            label = 'Aktywny';
        } else if (isActive && isPaused) {
            color = '#F59E0B';
            label = 'Wstrzymany';
        }

        return (
            <div className="flex items-center gap-2">
                <div
                    className={cn(
                        "w-2 h-2 rounded-full",
                        isActive && !isPaused && "animate-pulse"
                    )}
                    style={{ backgroundColor: color }}
                />
                <span className="text-sm" style={{ color }}>
                    {label}
                </span>
            </div>
        );
    };

    // Format next run time
    const formatNextRun = (dateStr: string | null | undefined) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (diff < 0) return 'Wkrótce';
        if (hours > 24) return date.toLocaleDateString('pl-PL', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
        if (hours > 0) return `Za ${hours}h ${minutes}min`;
        return `Za ${minutes}min`;
    };

    return (
        <div className="flex items-center justify-between">
            {/* Left - Title & Config Selector */}
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Zap className="w-6 h-6 text-violet-500" />
                        Autopilot
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Automatyczne generowanie i publikacja postów
                    </p>
                </div>

                {/* Config Selector */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 min-w-[220px] justify-between">
                            {selectedConfig ? (
                                <>
                                    <span className="truncate max-w-[120px]">
                                        Marka #{selectedConfig.brand_id}
                                    </span>
                                    <StatusIndicator config={selectedConfig} />
                                </>
                            ) : (
                                <span className="text-muted-foreground">Wybierz konfigurację</span>
                            )}
                            <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[300px]">
                        <DropdownMenuLabel>Konfiguracje Autopilota</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {configs.map((config) => (
                            <DropdownMenuItem
                                key={config.id}
                                onClick={() => onSelectConfig(config)}
                                className="flex items-center justify-between py-3"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                        Marka #{config.brand_id}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {config.platforms.join(', ')} • {config.total_published} opublikowanych
                                    </p>
                                </div>
                                <StatusIndicator config={config} />
                            </DropdownMenuItem>
                        ))}
                        {configs.length === 0 && (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                                Brak konfiguracji
                            </div>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onCreateNew} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Nowa konfiguracja
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Next run info */}
                {selectedConfig?.next_generation_at && isRunning && (
                    <div className="text-sm text-muted-foreground">
                        Następny post: {formatNextRun(selectedConfig.next_generation_at)}
                    </div>
                )}
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-3">
                {/* Health Score */}
                {selectedConfig?.health_score !== undefined && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{
                                backgroundColor: selectedConfig.health_score >= 80
                                    ? '#10B981'
                                    : selectedConfig.health_score >= 50
                                        ? '#F59E0B'
                                        : '#EF4444'
                            }}
                        />
                        <span className="text-sm font-medium">
                            {selectedConfig.health_score}%
                        </span>
                    </div>
                )}

                {/* Generate Now Button - ZAKTUALIZOWANE: działa także gdy autopilot nieaktywny */}
                <Button
                    variant="outline"
                    onClick={onGenerateNow}
                    disabled={!selectedConfig || isGenerating}
                    className={cn(
                        "gap-2",
                        isGenerating && "cursor-wait"
                    )}
                >
                    {isGenerating ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Generuję...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            Generuj teraz
                        </>
                    )}
                </Button>

                {/* Toggle Autopilot Button */}
                <Button
                    onClick={onToggleAutopilot}
                    disabled={!selectedConfig}
                    className={cn(
                        "gap-2 min-w-[140px]",
                        isRunning
                            ? "bg-amber-500 hover:bg-amber-600"
                            : "bg-green-500 hover:bg-green-600"
                    )}
                >
                    {isRunning ? (
                        <>
                            <Pause className="w-4 h-4" />
                            Wstrzymaj
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4" />
                            Uruchom
                        </>
                    )}
                </Button>

                {/* Settings */}
                <Button variant="ghost" size="icon">
                    <Settings className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}