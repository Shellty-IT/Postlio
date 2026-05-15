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
    light: <Sun className="w-4 h-4 xs:w-5 xs:h-5" />,
    dark: <Moon className="w-4 h-4 xs:w-5 xs:h-5" />,
    system: <Monitor className="w-4 h-4 xs:w-5 xs:h-5" />,
};

export function AppearanceSection() {
    const { settings, updateAppearance, setTheme } = useSettingsStore();
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
                    Dostosuj wygląd aplikacji do swoich preferencji
                </p>
            </div>

            <div className="space-y-3 xs:space-y-4">
                <Label className="text-sm xs:text-base">Motyw</Label>

                <div className="grid grid-cols-3 gap-2 xs:gap-3 sm:gap-4">
                    {THEME_OPTIONS.map((option) => {
                        const isSelected = appearance.theme === option.value;

                        return (
                            <button
                                key={option.value}
                                onClick={() => setTheme(option.value)}
                                className={cn(
                                    "relative p-3 xs:p-4 sm:p-6 rounded-xl border-2 text-center transition-all",
                                    "hover:border-primary/50 min-h-[80px] xs:min-h-[100px]",
                                    isSelected
                                        ? "border-primary bg-primary/5"
                                        : "border-border bg-card"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 xs:w-12 xs:h-12 rounded-full mx-auto mb-2 xs:mb-3 flex items-center justify-center",
                                    option.value === 'light' && "bg-amber-100 text-amber-600",
                                    option.value === 'dark' && "bg-slate-800 text-slate-200",
                                    option.value === 'system' && "bg-gradient-to-br from-amber-100 to-slate-800 text-white"
                                )}>
                                    {THEME_ICONS[option.value]}
                                </div>
                                <span className="font-medium text-xs xs:text-sm">{option.label}</span>

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
                                        : "border-border bg-card"
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

            <div className="p-4 xs:p-6 rounded-xl border border-border bg-card space-y-3 xs:space-y-4">
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
                <h3 className="text-[10px] xs:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Dodatkowe opcje
                </h3>

                <div className="space-y-2 xs:space-y-3">
                    <div className="flex items-center justify-between p-3 xs:p-4 rounded-xl border border-border bg-card gap-3">
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

                    <div className="flex items-center justify-between p-3 xs:p-4 rounded-xl border border-border bg-card gap-3">
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

                    <div className="flex items-center justify-between p-3 xs:p-4 rounded-xl border border-border bg-card gap-3">
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