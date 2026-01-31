// src/components/settings/settings-header.tsx
'use client';

import { Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/store/settings-store';

export function SettingsHeader() {
    const { hasUnsavedChanges, isSaving, saveSettings, resetToDefaults } = useSettingsStore();

    return (
        <div className="flex items-center justify-end gap-3">
            {hasUnsavedChanges && (
                <Badge variant="outline" className="text-amber-500 border-amber-500">
                    Niezapisane zmiany
                </Badge>
            )}

            <Button
                variant="outline"
                size="sm"
                onClick={resetToDefaults}
                className="gap-2"
            >
                <RotateCcw className="w-4 h-4" />
                Resetuj
            </Button>

            <Button
                size="sm"
                onClick={saveSettings}
                disabled={!hasUnsavedChanges || isSaving}
                className="gap-2"
            >
                <Save className="w-4 h-4" />
                {isSaving ? 'Zapisuję...' : 'Zapisz zmiany'}
            </Button>
        </div>
    );
}