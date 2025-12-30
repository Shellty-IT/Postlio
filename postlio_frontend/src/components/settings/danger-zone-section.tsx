// src/components/settings/danger-zone-section.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    Download,
    Trash2,
    RefreshCw,
    FileJson,
    ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSettingsStore } from '@/store/settings-store';

export function DangerZoneSection() {
    const { isSaving, exportData, deleteAccount, resetToDefaults } = useSettingsStore();
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    const CONFIRMATION_TEXT = 'USUŃ MOJE KONTO';
    const canDelete = deleteConfirmation === CONFIRMATION_TEXT;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Strefa niebezpieczna
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Operacje nieodwracalne - zachowaj ostrożność
                </p>
            </div>

            {/* Export Data */}
            <div className="p-6 rounded-xl border border-border bg-card">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                            <FileJson className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Eksportuj dane</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Pobierz wszystkie swoje dane w formacie JSON. Zawiera profil,
                                ustawienia, marki, posty i konfiguracje Autopilota.
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        onClick={exportData}
                        disabled={isSaving}
                        className="gap-2 flex-shrink-0"
                    >
                        {isSaving ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        Eksportuj
                    </Button>
                </div>
            </div>

            {/* Reset to Defaults */}
            <div className="p-6 rounded-xl border border-amber-500/30 bg-amber-500/5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-amber-500/10">
                            <RefreshCw className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-amber-600 dark:text-amber-400">
                                Resetuj ustawienia
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Przywróć wszystkie ustawienia do wartości domyślnych.
                                Twoje dane (marki, posty) pozostaną nienaruszone.
                            </p>
                        </div>
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="gap-2 flex-shrink-0 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Resetuj
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Resetować ustawienia?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Wszystkie Twoje preferencje zostaną przywrócone do wartości domyślnych.
                                    Ta operacja dotyczy tylko ustawień - Twoje dane pozostaną nienaruszone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={resetToDefaults}
                                    className="bg-amber-500 hover:bg-amber-600"
                                >
                                    Resetuj ustawienia
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Delete Account */}
            <div className="p-6 rounded-xl border-2 border-destructive/50 bg-destructive/5">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-destructive/10">
                        <ShieldAlert className="w-6 h-6 text-destructive" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-destructive">
                            Usuń konto
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Ta operacja jest <strong>nieodwracalna</strong>. Wszystkie Twoje dane
                            zostaną trwale usunięte, w tym:
                        </p>
                        <ul className="text-sm text-muted-foreground mt-2 ml-4 list-disc space-y-1">
                            <li>Profil i ustawienia</li>
                            <li>Wszystkie marki i ich konfiguracje Voice DNA</li>
                            <li>Historia postów i zaplanowane publikacje</li>
                            <li>Konfiguracje Autopilota</li>
                            <li>Połączone konta social media</li>
                        </ul>

                        <div className="mt-6 p-4 rounded-lg bg-background border border-border">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        className="w-full gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Usuń moje konto na zawsze
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-destructive flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5" />
                                            Usunąć konto?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="space-y-4">
                                            <p>
                                                Ta operacja jest <strong>nieodwracalna</strong>.
                                                Wszystkie Twoje dane zostaną trwale usunięte.
                                            </p>

                                            <div className="space-y-2">
                                                <Label htmlFor="delete-confirm">
                                                    Wpisz <code className="px-1 py-0.5 bg-muted rounded font-mono text-sm">{CONFIRMATION_TEXT}</code> aby potwierdzić:
                                                </Label>
                                                <Input
                                                    id="delete-confirm"
                                                    value={deleteConfirmation}
                                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                                    placeholder={CONFIRMATION_TEXT}
                                                    className={cn(
                                                        canDelete && "border-destructive focus-visible:ring-destructive"
                                                    )}
                                                />
                                            </div>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
                                            Anuluj
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={deleteAccount}
                                            disabled={!canDelete || isSaving}
                                            className="bg-destructive hover:bg-destructive/90"
                                        >
                                            {isSaving ? (
                                                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                            ) : (
                                                <Trash2 className="w-4 h-4 mr-2" />
                                            )}
                                            Usuń konto
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}