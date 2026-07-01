// src/components/settings/settings-header.tsx
'use client';

import { Save, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/store/settings-store';

export function SettingsHeader() {
    const { hasUnsavedChanges, isSaving, saveSettings, resetToDefaults } = useSettingsStore();

    return (
        <div className="flex items-center justify-end gap-2 xs:gap-3">
            {hasUnsavedChanges && (
                <Badge variant="outline" className="text-amber-500 border-amber-500 text-[10px] xs:text-xs px-1.5 xs:px-2">
                    <span className="hidden xs:inline">Niezapisane zmiany</span>
                    <span className="xs:hidden">Zmiany</span>
                </Badge>
            )}

            <button
                onClick={resetToDefaults}
                className={cn(
                    'inline-flex items-center gap-1.5 xs:gap-2 rounded-[11px] border border-white/10 bg-white/[0.03] px-2.5 xs:px-4 h-9 xs:h-10',
                    'text-[13.5px] font-medium text-foreground/80 transition-colors hover:bg-white/[0.06]'
                )}
            >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden xs:inline">Resetuj</span>
            </button>

            <button
                onClick={saveSettings}
                disabled={!hasUnsavedChanges || isSaving}
                className={cn(
                    'btn-gradient h-9 xs:h-10 px-2.5 xs:px-5 text-[13.5px]',
                    'disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0 disabled:hover:brightness-100'
                )}
            >
                <Save className="w-4 h-4" />
                <span className="hidden xs:inline">{isSaving ? 'Zapisuję...' : 'Zapisz zmiany'}</span>
                <span className="xs:hidden">{isSaving ? '...' : 'Zapisz'}</span>
            </button>
        </div>
    );
}
