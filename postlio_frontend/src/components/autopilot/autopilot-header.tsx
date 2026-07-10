// src/components/autopilot/autopilot-header.tsx
'use client';

import {
    Play,
    Pause,
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

    const StatusIndicator = ({ config }: { config: BackendAutopilotConfig }) => {
        const isActive = config.is_active;
        const isPaused = config.is_paused;

        let colorClass = 'bg-muted-foreground text-muted-foreground';
        let label = 'Nieaktywny';

        if (isActive && !isPaused) {
            colorClass = 'bg-success text-success';
            label = 'Aktywny';
        } else if (isActive && isPaused) {
            colorClass = 'bg-warning text-warning';
            label = 'Wstrzymany';
        }

        return (
            <div className="flex items-center gap-1.5 xs:gap-2">
                <div
                    className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        colorClass.split(' ')[0],
                        isActive && !isPaused && "animate-pulse"
                    )}
                />
                <span className={cn("text-xs xs:text-sm hidden xs:inline", colorClass.split(' ')[1])}>
                    {label}
                </span>
            </div>
        );
    };

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
        <div className="glass-card p-3 xs:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center gap-2 xs:gap-4 flex-wrap">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 min-w-0 xs:min-w-[180px] sm:min-w-[220px] justify-between h-10 xs:h-11 bg-white/[0.03] border-white/10">
                            {selectedConfig ? (
                                <>
                                    <span className="truncate max-w-[80px] xs:max-w-[120px]">
                                        Marka #{selectedConfig.brand_id}
                                    </span>
                                    <StatusIndicator config={selectedConfig} />
                                </>
                            ) : (
                                <span className="text-muted-foreground text-sm">Wybierz...</span>
                            )}
                            <ChevronDown className="w-4 h-4 ml-1 xs:ml-2 opacity-50 flex-shrink-0" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[280px] xs:w-[300px]">
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
                                        {config.platforms.join(', ')} • {config.total_published} opubl.
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

                {selectedConfig?.next_generation_at && isRunning && (
                    <div className="text-xs xs:text-sm text-muted-foreground hidden sm:block">
                        Następny: {formatNextRun(selectedConfig.next_generation_at)}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 xs:gap-3 overflow-x-auto pb-1 sm:pb-0">
                {selectedConfig?.health_score !== undefined && (
                    <div className="flex items-center gap-1.5 xs:gap-2 px-2 xs:px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 flex-shrink-0">
                        <div
                            className={cn(
                                "w-2 h-2 rounded-full",
                                selectedConfig.health_score >= 80
                                    ? "bg-success"
                                    : selectedConfig.health_score >= 50
                                        ? "bg-warning"
                                        : "bg-destructive"
                            )}
                        />
                        <span className="text-xs xs:text-sm font-medium">
                            {selectedConfig.health_score}%
                        </span>
                    </div>
                )}

                <Button
                    variant="outline"
                    onClick={onGenerateNow}
                    disabled={!selectedConfig || isGenerating}
                    className={cn(
                        "gap-1.5 xs:gap-2 h-10 xs:h-11 px-3 xs:px-4 flex-shrink-0 bg-white/[0.03] border-white/10",
                        isGenerating && "cursor-wait"
                    )}
                >
                    {isGenerating ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span className="hidden xs:inline">Generuję...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            <span className="hidden xs:inline">Generuj</span>
                        </>
                    )}
                </Button>

                <Button
                    onClick={onToggleAutopilot}
                    disabled={!selectedConfig}
                    className={cn(
                        "gap-1.5 xs:gap-2 h-10 xs:h-11 px-3 xs:px-4 min-w-0 xs:min-w-[110px] sm:min-w-[140px] flex-shrink-0",
                        isRunning
                            ? "bg-warning text-warning-foreground hover:bg-warning/90"
                            : "btn-gradient"
                    )}
                >
                    {isRunning ? (
                        <>
                            <Pause className="w-4 h-4" />
                            <span className="hidden xs:inline">Wstrzymaj</span>
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4" />
                            <span className="hidden xs:inline">Uruchom</span>
                        </>
                    )}
                </Button>

                <Button variant="ghost" size="icon" className="h-10 w-10 xs:h-11 xs:w-11 flex-shrink-0">
                    <Settings className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}