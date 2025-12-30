// src/components/autopilot/autopilot-header.tsx
'use client';

import {
    Play,
    Pause,
    Zap,
    ChevronDown,
    Plus,
    RefreshCw,
    Settings
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
import type { AutopilotConfig, AutopilotStatus } from '@/types/autopilot';
import { AUTOPILOT_STATUS_CONFIG } from '@/types/autopilot';

interface AutopilotHeaderProps {
    selectedConfig?: AutopilotConfig;
    configs: AutopilotConfig[];
    isRunning: boolean;
    isGenerating?: boolean;
    onSelectConfig: (config: AutopilotConfig) => void;
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

    const StatusIndicator = ({ status }: { status: AutopilotStatus }) => {
        const config = AUTOPILOT_STATUS_CONFIG[status];
        return (
            <div className="flex items-center gap-2">
                <div
                    className={cn(
                        "w-2 h-2 rounded-full",
                        status === 'active' && "animate-pulse"
                    )}
                    style={{ backgroundColor: config.color }}
                />
                <span className="text-sm" style={{ color: config.color }}>
          {config.label}
        </span>
            </div>
        );
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
                        <Button variant="outline" className="gap-2 min-w-[200px] justify-between">
                            {selectedConfig ? (
                                <>
                                    <span className="truncate">{selectedConfig.name}</span>
                                    <StatusIndicator status={selectedConfig.status} />
                                </>
                            ) : (
                                <span className="text-muted-foreground">Wybierz konfigurację</span>
                            )}
                            <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[280px]">
                        <DropdownMenuLabel>Konfiguracje</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {configs.map((config) => (
                            <DropdownMenuItem
                                key={config.id}
                                onClick={() => onSelectConfig(config)}
                                className="flex items-center justify-between py-3"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{config.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {config.platforms.join(', ')} • {config.totalPublished} opublikowanych
                                    </p>
                                </div>
                                <StatusIndicator status={config.status} />
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
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-3">
                {/* Generate Now Button */}
                <Button
                    variant="outline"
                    onClick={onGenerateNow}
                    disabled={!selectedConfig || isGenerating}
                    className="gap-2"
                >
                    {isGenerating ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Generuję...
                        </>
                    ) : (
                        <>
                            <Zap className="w-4 h-4" />
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