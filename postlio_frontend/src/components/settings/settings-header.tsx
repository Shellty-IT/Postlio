// src/components/settings/settings-header.tsx
'use client';

import { Settings, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/store/settings-store';

export function SettingsHeader() {
    const { hasUnsavedChanges, isSaving, saveSettings, resetToDefaults } = useSettingsStore();

    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Settings className="w-6 h-6 text-primary" />
                    Ustawienia
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Zarządzaj swoim kontem i preferencjami
                </p>
            </div>

            <div className="flex items-center gap-3">
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
        </div>
    );
}