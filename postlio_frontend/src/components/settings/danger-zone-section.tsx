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
            className="space-y-6 sm:space-y-8"
        >
            <div>
                <h2 className="text-lg xs:text-xl font-semibold text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 xs:w-5 xs:h-5" />
                    Strefa niebezpieczna
                </h2>
                <p className="text-xs xs:text-sm text-muted-foreground mt-1">
                    Eksport danych i usunięcie konta.
                </p>
            </div>

            <div className="flex flex-col xs:flex-row items-start justify-between gap-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] p-4 xs:p-6">
                <div className="flex items-start gap-3 xs:gap-4">
                    <div className="p-2 xs:p-3 rounded-lg bg-primary/10 flex-shrink-0">
                        <FileJson className="w-5 h-5 xs:w-6 xs:h-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-sm xs:text-base">Eksportuj dane</h3>
                        <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground mt-1">
                            Pobierz kopię swoich danych i treści.
                        </p>
                    </div>
                </div>

                <Button
                    variant="outline"
                    onClick={exportData}
                    disabled={isSaving}
                    className="gap-2 w-full xs:w-auto h-9 xs:h-10"
                >
                    {isSaving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                        <Download className="w-4 h-4" />
                    )}
                    <span className="xs:hidden">Pobierz</span>
                    <span className="hidden xs:inline">Eksportuj</span>
                </Button>
            </div>

            <div className="p-4 xs:p-6 rounded-xl border border-amber-500/30 bg-amber-500/5">
                <div className="flex flex-col xs:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-3 xs:gap-4">
                        <div className="p-2 xs:p-3 rounded-lg bg-amber-500/10 flex-shrink-0">
                            <RefreshCw className="w-5 h-5 xs:w-6 xs:h-6 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-amber-600 dark:text-amber-400 text-sm xs:text-base">
                                Resetuj ustawienia
                            </h3>
                            <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground mt-1">
                                Przywróć domyślne wartości. Twoje dane pozostaną.
                            </p>
                        </div>
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="gap-2 w-full xs:w-auto h-9 xs:h-10 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Resetuj
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[calc(100vw-2rem)] xs:max-w-md">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-base xs:text-lg">Resetować ustawienia?</AlertDialogTitle>
                                <AlertDialogDescription className="text-xs xs:text-sm">
                                    Wszystkie preferencje zostaną przywrócone do wartości domyślnych.
                                    Twoje dane pozostaną nienaruszone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col xs:flex-row gap-2">
                                <AlertDialogCancel className="w-full xs:w-auto">Anuluj</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={resetToDefaults}
                                    className="w-full xs:w-auto bg-amber-500 hover:bg-amber-600"
                                >
                                    Resetuj ustawienia
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            <div className="p-4 xs:p-6 rounded-xl border-2 border-destructive/50 bg-destructive/5">
                <div className="flex items-start gap-3 xs:gap-4">
                    <div className="p-2 xs:p-3 rounded-lg bg-destructive/10 flex-shrink-0">
                        <ShieldAlert className="w-5 h-5 xs:w-6 xs:h-6 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-destructive text-sm xs:text-base">
                            Usuń konto
                        </h3>
                        <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground mt-1">
                            Ta operacja jest <strong>nieodwracalna</strong>. Wszystkie dane zostaną usunięte.
                        </p>
                        <ul className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground mt-2 ml-3 xs:ml-4 list-disc space-y-0.5 xs:space-y-1">
                            <li>Profil i ustawienia</li>
                            <li>Marki i konfiguracje</li>
                            <li>Historia postów</li>
                            <li>Połączone konta</li>
                        </ul>

                        <div className="mt-4 xs:mt-6 p-3 xs:p-4 rounded-lg bg-background border border-border">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        className="w-full gap-2 h-9 xs:h-10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="text-xs xs:text-sm">Usuń moje konto na zawsze</span>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="max-w-[calc(100vw-2rem)] xs:max-w-md">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-destructive flex items-center gap-2 text-base xs:text-lg">
                                            <AlertTriangle className="w-4 h-4 xs:w-5 xs:h-5" />
                                            Usunąć konto?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="space-y-3 xs:space-y-4 text-xs xs:text-sm">
                                            <p>
                                                Ta operacja jest <strong>nieodwracalna</strong>.
                                                Wszystkie dane zostaną usunięte.
                                            </p>

                                            <div className="space-y-2">
                                                <Label htmlFor="delete-confirm" className="text-xs xs:text-sm">
                                                    Wpisz <code className="px-1 py-0.5 bg-muted rounded font-mono text-[10px] xs:text-xs">{CONFIRMATION_TEXT}</code>:
                                                </Label>
                                                <Input
                                                    id="delete-confirm"
                                                    value={deleteConfirmation}
                                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                                    placeholder={CONFIRMATION_TEXT}
                                                    className={cn(
                                                        "h-9 xs:h-10 text-sm",
                                                        canDelete && "border-destructive focus-visible:ring-destructive"
                                                    )}
                                                />
                                            </div>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-col xs:flex-row gap-2">
                                        <AlertDialogCancel
                                            onClick={() => setDeleteConfirmation('')}
                                            className="w-full xs:w-auto"
                                        >
                                            Anuluj
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={deleteAccount}
                                            disabled={!canDelete || isSaving}
                                            className="w-full xs:w-auto bg-destructive hover:bg-destructive/90"
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