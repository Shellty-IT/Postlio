// src/components/settings/settings-header.tsx
'use client';

import { Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

            <Button
                variant="outline"
                onClick={resetToDefaults}
                className="gap-1.5 xs:gap-2 h-9 xs:h-10 px-2.5 xs:px-4"
            >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden xs:inline">Resetuj</span>
            </Button>

            <Button
                onClick={saveSettings}
                disabled={!hasUnsavedChanges || isSaving}
                className="gap-1.5 xs:gap-2 h-9 xs:h-10 px-2.5 xs:px-4"
            >
                <Save className="w-4 h-4" />
                <span className="hidden xs:inline">{isSaving ? 'Zapisuję...' : 'Zapisz zmiany'}</span>
                <span className="xs:hidden">{isSaving ? '...' : 'Zapisz'}</span>
            </Button>
        </div>
    );
}