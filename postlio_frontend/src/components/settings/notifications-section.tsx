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
            className="space-y-8"
        >
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Powiadomienia
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Zarządzaj jak i kiedy otrzymujesz powiadomienia
                </p>
            </div>

            {/* Email Notifications */}
            <div className="p-6 rounded-xl border border-border bg-card space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-medium">Powiadomienia email</h3>
                            <p className="text-sm text-muted-foreground">
                                Otrzymuj powiadomienia na swoją skrzynkę
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
                        className="space-y-4 pl-12 border-l-2 border-border"
                    >
                        {/* Email Digest */}
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm">Podsumowanie email</Label>
                                <p className="text-xs text-muted-foreground">
                                    Jak często otrzymywać zbiorcze podsumowanie
                                </p>
                            </div>
                            <Select
                                value={notifications.emailDigest}
                                onValueChange={(v: 'daily' | 'weekly' | 'never') =>
                                    updateNotifications({ emailDigest: v })
                                }
                            >
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Codziennie</SelectItem>
                                    <SelectItem value="weekly">Co tydzień</SelectItem>
                                    <SelectItem value="never">Nigdy</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Email on Publish */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                <Label className="text-sm">Po opublikowaniu posta</Label>
                            </div>
                            <Switch
                                checked={notifications.emailOnPublish}
                                onCheckedChange={(v) => updateNotifications({ emailOnPublish: v })}
                            />
                        </div>

                        {/* Email on Error */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-destructive" />
                                <Label className="text-sm">Przy błędach</Label>
                            </div>
                            <Switch
                                checked={notifications.emailOnError}
                                onCheckedChange={(v) => updateNotifications({ emailOnError: v })}
                            />
                        </div>

                        {/* Email on Approval Needed */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-500" />
                                <Label className="text-sm">Gdy post czeka na zatwierdzenie</Label>
                            </div>
                            <Switch
                                checked={notifications.emailOnApprovalNeeded}
                                onCheckedChange={(v) => updateNotifications({ emailOnApprovalNeeded: v })}
                            />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Push Notifications */}
            <div className="p-6 rounded-xl border border-border bg-card space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-violet-500/10">
                            <Smartphone className="w-5 h-5 text-violet-500" />
                        </div>
                        <div>
                            <h3 className="font-medium">Powiadomienia push</h3>
                            <p className="text-sm text-muted-foreground">
                                Powiadomienia w przeglądarce i na urządzeniach mobilnych
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
                        className="space-y-4 pl-12 border-l-2 border-border"
                    >
                        {/* Push on Publish */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                <Label className="text-sm">Po opublikowaniu posta</Label>
                            </div>
                            <Switch
                                checked={notifications.pushOnPublish}
                                onCheckedChange={(v) => updateNotifications({ pushOnPublish: v })}
                            />
                        </div>

                        {/* Push on Error */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-destructive" />
                                <Label className="text-sm">Przy błędach</Label>
                            </div>
                            <Switch
                                checked={notifications.pushOnError}
                                onCheckedChange={(v) => updateNotifications({ pushOnError: v })}
                            />
                        </div>

                        {/* Push on Approval Needed */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-500" />
                                <Label className="text-sm">Gdy post czeka na zatwierdzenie</Label>
                            </div>
                            <Switch
                                checked={notifications.pushOnApprovalNeeded}
                                onCheckedChange={(v) => updateNotifications({ pushOnApprovalNeeded: v })}
                            />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* In-App Notifications */}
            <div className="p-6 rounded-xl border border-border bg-card space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Monitor className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="font-medium">Powiadomienia w aplikacji</h3>
                            <p className="text-sm text-muted-foreground">
                                Powiadomienia wyświetlane podczas korzystania z aplikacji
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
                        className="pl-12 border-l-2 border-border"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Volume2 className="w-4 h-4 text-muted-foreground" />
                                <Label className="text-sm">Dźwięki powiadomień</Label>
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