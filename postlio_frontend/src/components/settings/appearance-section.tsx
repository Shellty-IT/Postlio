// src/components/settings/appearance-section.tsx
'use client';

import { motion } from 'framer-motion';
import {
    Palette,
    Sun,
    Moon,
    Monitor,
    Minimize2,
    Eye,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '@/store/settings-store';
import {
    THEME_OPTIONS,
    ACCENT_COLORS,
    type ThemeMode,
} from '@/types/settings';

const THEME_ICONS: Record<ThemeMode, React.ReactNode> = {
    light: <Sun className="w-5 h-5" />,
    dark: <Moon className="w-5 h-5" />,
    system: <Monitor className="w-5 h-5" />,
};

export function AppearanceSection() {
    const { settings, updateAppearance, setTheme } = useSettingsStore();
    const { appearance } = settings;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    Wygląd
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Dostosuj wygląd aplikacji do swoich preferencji
                </p>
            </div>

            {/* Theme Selection */}
            <div className="space-y-4">
                <Label className="text-base">Motyw</Label>

                <div className="grid grid-cols-3 gap-4">
                    {THEME_OPTIONS.map((option) => {
                        const isSelected = appearance.theme === option.value;

                        return (
                            <button
                                key={option.value}
                                onClick={() => setTheme(option.value)}
                                className={cn(
                                    "relative p-6 rounded-xl border-2 text-center transition-all",
                                    "hover:border-primary/50",
                                    isSelected
                                        ? "border-primary bg-primary/5"
                                        : "border-border bg-card"
                                )}
                            >
                                <div className={cn(
                                    "w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center",
                                    option.value === 'light' && "bg-amber-100 text-amber-600",
                                    option.value === 'dark' && "bg-slate-800 text-slate-200",
                                    option.value === 'system' && "bg-gradient-to-br from-amber-100 to-slate-800 text-white"
                                )}>
                                    {THEME_ICONS[option.value]}
                                </div>
                                <span className="font-medium">{option.label}</span>

                                {isSelected && (
                                    <motion.div
                                        layoutId="theme-selected"
                                        className="absolute inset-0 rounded-xl border-2 border-primary"
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-4">
                <Label className="text-base">Kolor akcentu</Label>
                <p className="text-sm text-muted-foreground -mt-2">
                    Główny kolor używany w przyciskach i podświetleniach
                </p>

                <div className="flex flex-wrap gap-3">
                    {ACCENT_COLORS.map((color) => {
                        const isSelected = appearance.accentColor === color.value;

                        return (
                            <button
                                key={color.value}
                                onClick={() => updateAppearance({ accentColor: color.value })}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all",
                                    "hover:scale-105",
                                    isSelected
                                        ? "border-current shadow-lg"
                                        : "border-border bg-card"
                                )}
                                style={{
                                    borderColor: isSelected ? color.color : undefined,
                                    backgroundColor: isSelected ? `${color.color}10` : undefined,
                                }}
                            >
                                <div
                                    className="w-6 h-6 rounded-full shadow-inner"
                                    style={{ backgroundColor: color.color }}
                                />
                                <span className="font-medium text-sm">{color.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Preview */}
            <div className="p-6 rounded-xl border border-border bg-card space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Podgląd
                </h3>

                <div className="flex flex-wrap gap-3">
                    <button
                        className="px-4 py-2 rounded-lg text-white font-medium"
                        style={{ backgroundColor: ACCENT_COLORS.find(c => c.value === appearance.accentColor)?.color }}
                    >
                        Przycisk główny
                    </button>
                    <button
                        className="px-4 py-2 rounded-lg border-2 font-medium"
                        style={{
                            borderColor: ACCENT_COLORS.find(c => c.value === appearance.accentColor)?.color,
                            color: ACCENT_COLORS.find(c => c.value === appearance.accentColor)?.color,
                        }}
                    >
                        Przycisk outline
                    </button>
                    <span
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                            backgroundColor: `${ACCENT_COLORS.find(c => c.value === appearance.accentColor)?.color}20`,
                            color: ACCENT_COLORS.find(c => c.value === appearance.accentColor)?.color,
                        }}
                    >
            Badge
          </span>
                </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Dodatkowe opcje
                </h3>

                <div className="space-y-3">
                    {/* Reduced Motion */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <Label className="text-sm">Ogranicz animacje</Label>
                                <p className="text-xs text-muted-foreground">
                                    Wyłącz lub ogranicz animacje interfejsu
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={appearance.reducedMotion}
                            onCheckedChange={(v) => updateAppearance({ reducedMotion: v })}
                        />
                    </div>

                    {/* Compact Mode */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                        <div className="flex items-center gap-3">
                            <Minimize2 className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <Label className="text-sm">Tryb kompaktowy</Label>
                                <p className="text-xs text-muted-foreground">
                                    Zmniejsz odstępy i rozmiar elementów
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={appearance.compactMode}
                            onCheckedChange={(v) => updateAppearance({ compactMode: v })}
                        />
                    </div>

                    {/* Show Avatars */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                        <div className="flex items-center gap-3">
                            <Eye className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <Label className="text-sm">Pokazuj awatary</Label>
                                <p className="text-xs text-muted-foreground">
                                    Wyświetlaj zdjęcia profilowe na listach
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