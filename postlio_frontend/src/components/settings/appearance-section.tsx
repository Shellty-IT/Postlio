// src/components/settings/appearance-section.tsx
'use client';

import { motion } from 'framer-motion';
import {
    Palette,
    Moon,
    Minimize2,
    Eye,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '@/store/settings-store';
import { ACCENT_COLORS } from '@/types/settings';

export function AppearanceSection() {
    const { settings, updateAppearance } = useSettingsStore();
    const { appearance } = settings;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 sm:space-y-8"
        >
            <div>
                <h2 className="text-lg xs:text-xl font-semibold text-foreground flex items-center gap-2">
                    <Palette className="w-4 h-4 xs:w-5 xs:h-5 text-primary" />
                    Wygląd
                </h2>
                <p className="text-xs xs:text-sm text-muted-foreground mt-1">
                    Motyw, kolory i personalizacja.
                </p>
            </div>

            <div className="glass-card flex items-center justify-between gap-3 px-4 py-3.5 xs:px-5 xs:py-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                        <Moon className="h-4 w-4 text-white" />
                    </span>
                    <div>
                        <p className="text-sm font-medium text-foreground">Ciemny motyw</p>
                        <p className="text-xs text-muted-foreground">Postlio działa wyłącznie w trybie ciemnym.</p>
                    </div>
                </div>
                <span className="rounded-md bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary">Stały</span>
            </div>

            <div className="space-y-3 xs:space-y-4">
                <Label className="text-sm xs:text-base">Kolor akcentu</Label>
                <p className="text-xs xs:text-sm text-muted-foreground -mt-2">
                    Główny kolor używany w przyciskach
                </p>

                <div className="flex flex-wrap gap-2 xs:gap-3">
                    {ACCENT_COLORS.map((color) => {
                        const isSelected = appearance.accentColor === color.value;

                        return (
                            <button
                                key={color.value}
                                onClick={() => updateAppearance({ accentColor: color.value })}
                                className={cn(
                                    "flex items-center gap-2 xs:gap-3 px-3 xs:px-4 py-2 xs:py-3 rounded-xl border-2 transition-all",
                                    "hover:scale-105 min-h-[44px]",
                                    isSelected
                                        ? "border-current shadow-lg"
                                        : "border-white/10 bg-white/[0.02]"
                                )}
                                style={{
                                    borderColor: isSelected ? color.color : undefined,
                                    backgroundColor: isSelected ? `${color.color}10` : undefined,
                                }}
                            >
                                <div
                                    className="w-5 h-5 xs:w-6 xs:h-6 rounded-full shadow-inner flex-shrink-0"
                                    style={{ backgroundColor: color.color }}
                                />
                                <span className="font-medium text-xs xs:text-sm">{color.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="glass-card p-4 xs:p-6 space-y-3 xs:space-y-4">
                <h3 className="font-medium flex items-center gap-2 text-sm xs:text-base">
                    <Eye className="w-4 h-4" />
                    Podgląd
                </h3>

                <div className="flex flex-wrap gap-2 xs:gap-3">
                    <button
                        className="px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg text-white font-medium text-xs xs:text-sm"
                        style={{ backgroundColor: ACCENT_COLORS.find(c => c.value === appearance.accentColor)?.color }}
                    >
                        Przycisk główny
                    </button>
                    <button
                        className="px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg border-2 font-medium text-xs xs:text-sm"
                        style={{
                            borderColor: ACCENT_COLORS.find(c => c.value === appearance.accentColor)?.color,
                            color: ACCENT_COLORS.find(c => c.value === appearance.accentColor)?.color,
                        }}
                    >
                        Outline
                    </button>
                    <span
                        className="px-2 xs:px-3 py-1 rounded-full text-[10px] xs:text-xs font-medium"
                        style={{
                            backgroundColor: `${ACCENT_COLORS.find(c => c.value === appearance.accentColor)?.color}20`,
                            color: ACCENT_COLORS.find(c => c.value === appearance.accentColor)?.color,
                        }}
                    >
                        Badge
                    </span>
                </div>
            </div>

            <div className="space-y-3 xs:space-y-4">
                <h3 className="mono-label">
                    Dodatkowe opcje
                </h3>

                <div className="space-y-2 xs:space-y-3">
                    <div className="glass-card flex items-center justify-between p-3 xs:p-4 gap-3">
                        <div className="flex items-center gap-2 xs:gap-3 min-w-0">
                            <Zap className="w-4 h-4 xs:w-5 xs:h-5 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                                <Label className="text-xs xs:text-sm">Ogranicz animacje</Label>
                                <p className="text-[10px] xs:text-xs text-muted-foreground hidden xs:block">
                                    Wyłącz lub ogranicz animacje
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={appearance.reducedMotion}
                            onCheckedChange={(v) => updateAppearance({ reducedMotion: v })}
                        />
                    </div>

                    <div className="glass-card flex items-center justify-between p-3 xs:p-4 gap-3">
                        <div className="flex items-center gap-2 xs:gap-3 min-w-0">
                            <Minimize2 className="w-4 h-4 xs:w-5 xs:h-5 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                                <Label className="text-xs xs:text-sm">Tryb kompaktowy</Label>
                                <p className="text-[10px] xs:text-xs text-muted-foreground hidden xs:block">
                                    Zmniejsz odstępy i rozmiary
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={appearance.compactMode}
                            onCheckedChange={(v) => updateAppearance({ compactMode: v })}
                        />
                    </div>

                    <div className="glass-card flex items-center justify-between p-3 xs:p-4 gap-3">
                        <div className="flex items-center gap-2 xs:gap-3 min-w-0">
                            <Eye className="w-4 h-4 xs:w-5 xs:h-5 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                                <Label className="text-xs xs:text-sm">Pokazuj awatary</Label>
                                <p className="text-[10px] xs:text-xs text-muted-foreground hidden xs:block">
                                    Wyświetlaj zdjęcia profilowe
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={appearance.showAvatars}
                            onCheckedChange={(v) => updateAppearance({ showAvatars: v })}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}