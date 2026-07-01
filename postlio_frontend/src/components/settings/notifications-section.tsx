// src/components/settings/notifications-section.tsx
'use client';

import { motion } from 'framer-motion';
import {
    Bell,
    Mail,
    Smartphone,
    Monitor,
    Volume2,
    Check,
    AlertCircle,
    Clock
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useSettingsStore } from '@/store/settings-store';

export function NotificationsSection() {
    const { settings, updateNotifications } = useSettingsStore();
    const { notifications } = settings;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 sm:space-y-8"
        >
            <div>
                <h2 className="text-lg xs:text-xl font-semibold text-foreground flex items-center gap-2">
                    <Bell className="w-4 h-4 xs:w-5 xs:h-5 text-primary" />
                    Powiadomienia
                </h2>
                <p className="text-xs xs:text-sm text-muted-foreground mt-1">
                    Zarządzaj alertami i powiadomieniami.
                </p>
            </div>

            <div className="glass-card p-4 xs:p-6 space-y-4 xs:space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 xs:gap-3 min-w-0">
                        <div className="p-1.5 xs:p-2 rounded-lg bg-primary/10 flex-shrink-0">
                            <Mail className="w-4 h-4 xs:w-5 xs:h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-medium text-sm xs:text-base">Powiadomienia email</h3>
                            <p className="text-[10px] xs:text-sm text-muted-foreground hidden xs:block">
                                Otrzymuj powiadomienia na skrzynkę
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={notifications.emailEnabled}
                        onCheckedChange={(v) => updateNotifications({ emailEnabled: v })}
                    />
                </div>

                {notifications.emailEnabled && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3 xs:space-y-4 pl-6 xs:pl-10 sm:pl-12 border-l-2 border-border"
                    >
                        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                            <div className="min-w-0">
                                <Label className="text-xs xs:text-sm">Podsumowanie email</Label>
                                <p className="text-[10px] xs:text-xs text-muted-foreground">
                                    Częstotliwość zbiorczych powiadomień
                                </p>
                            </div>
                            <Select
                                value={notifications.emailDigest}
                                onValueChange={(v: 'daily' | 'weekly' | 'never') =>
                                    updateNotifications({ emailDigest: v })
                                }
                            >
                                <SelectTrigger className="w-full xs:w-32 h-9 xs:h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Codziennie</SelectItem>
                                    <SelectItem value="weekly">Co tydzień</SelectItem>
                                    <SelectItem value="never">Nigdy</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <Check className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-green-500 flex-shrink-0" />
                                <Label className="text-xs xs:text-sm">Po opublikowaniu</Label>
                            </div>
                            <Switch
                                checked={notifications.emailOnPublish}
                                onCheckedChange={(v) => updateNotifications({ emailOnPublish: v })}
                            />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <AlertCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-destructive flex-shrink-0" />
                                <Label className="text-xs xs:text-sm">Przy błędach</Label>
                            </div>
                            <Switch
                                checked={notifications.emailOnError}
                                onCheckedChange={(v) => updateNotifications({ emailOnError: v })}
                            />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <Clock className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-amber-500 flex-shrink-0" />
                                <Label className="text-xs xs:text-sm">Czeka na zatwierdzenie</Label>
                            </div>
                            <Switch
                                checked={notifications.emailOnApprovalNeeded}
                                onCheckedChange={(v) => updateNotifications({ emailOnApprovalNeeded: v })}
                            />
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="glass-card p-4 xs:p-6 space-y-4 xs:space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 xs:gap-3 min-w-0">
                        <div className="p-1.5 xs:p-2 rounded-lg bg-violet-500/10 flex-shrink-0">
                            <Smartphone className="w-4 h-4 xs:w-5 xs:h-5 text-violet-500" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-medium text-sm xs:text-base">Powiadomienia push</h3>
                            <p className="text-[10px] xs:text-sm text-muted-foreground hidden xs:block">
                                Przeglądarka i urządzenia mobilne
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={notifications.pushEnabled}
                        onCheckedChange={(v) => updateNotifications({ pushEnabled: v })}
                    />
                </div>

                {notifications.pushEnabled && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3 xs:space-y-4 pl-6 xs:pl-10 sm:pl-12 border-l-2 border-border"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <Check className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-green-500 flex-shrink-0" />
                                <Label className="text-xs xs:text-sm">Po opublikowaniu</Label>
                            </div>
                            <Switch
                                checked={notifications.pushOnPublish}
                                onCheckedChange={(v) => updateNotifications({ pushOnPublish: v })}
                            />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <AlertCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-destructive flex-shrink-0" />
                                <Label className="text-xs xs:text-sm">Przy błędach</Label>
                            </div>
                            <Switch
                                checked={notifications.pushOnError}
                                onCheckedChange={(v) => updateNotifications({ pushOnError: v })}
                            />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <Clock className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-amber-500 flex-shrink-0" />
                                <Label className="text-xs xs:text-sm">Czeka na zatwierdzenie</Label>
                            </div>
                            <Switch
                                checked={notifications.pushOnApprovalNeeded}
                                onCheckedChange={(v) => updateNotifications({ pushOnApprovalNeeded: v })}
                            />
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="glass-card p-4 xs:p-6 space-y-4 xs:space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 xs:gap-3 min-w-0">
                        <div className="p-1.5 xs:p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                            <Monitor className="w-4 h-4 xs:w-5 xs:h-5 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-medium text-sm xs:text-base">W aplikacji</h3>
                            <p className="text-[10px] xs:text-sm text-muted-foreground hidden xs:block">
                                Powiadomienia podczas korzystania
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={notifications.inAppEnabled}
                        onCheckedChange={(v) => updateNotifications({ inAppEnabled: v })}
                    />
                </div>

                {notifications.inAppEnabled && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pl-6 xs:pl-10 sm:pl-12 border-l-2 border-border"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <Volume2 className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-muted-foreground flex-shrink-0" />
                                <Label className="text-xs xs:text-sm">Dźwięki powiadomień</Label>
                            </div>
                            <Switch
                                checked={notifications.soundEnabled}
                                onCheckedChange={(v) => updateNotifications({ soundEnabled: v })}
                            />
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}