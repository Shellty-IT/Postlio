// src/components/settings/connected-accounts-section.tsx
'use client';

import { motion } from 'framer-motion';
import {
    Link2,
    Plus,
    RefreshCw,
    Unlink,
    Check,
    AlertCircle,
    Clock,
    ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/store/settings-store';
import { PLATFORM_INFO, type SocialPlatform } from '@/types/settings';

export function ConnectedAccountsSection() {
    const {
        settings,
        isSaving,
        connectAccount,
        disconnectAccount,
        refreshAccount
    } = useSettingsStore();
    const { connectedAccounts } = settings;

    // All platforms that can be connected
    const allPlatforms: SocialPlatform[] = ['facebook', 'instagram', 'linkedin', 'twitter'];

    // Check if expiring soon (within 7 days)
    const isExpiringSoon = (expiresAt?: string) => {
        if (!expiresAt) return false;
        const days = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return days < 7 && days > 0;
    };

    // Check if expired
    const isExpired = (expiresAt?: string) => {
        if (!expiresAt) return false;
        return new Date(expiresAt).getTime() < Date.now();
    };

    // Format date
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pl-PL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-primary" />
                    Połączone konta
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Zarządzaj połączeniami z kontami social media
                </p>
            </div>

            {/* Connected Accounts */}
            <div className="space-y-4">
                {allPlatforms.map((platform) => {
                    const account = connectedAccounts.find(a => a.platform === platform);
                    const platformInfo = PLATFORM_INFO[platform];
                    const isConnected = account?.isConnected;
                    const expiringSoon = isExpiringSoon(account?.expiresAt);
                    const expired = isExpired(account?.expiresAt);

                    return (
                        <motion.div
                            key={platform}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                                "p-5 rounded-xl border-2 transition-all",
                                isConnected && !expired
                                    ? "border-green-500/30 bg-green-500/5"
                                    : expired
                                        ? "border-destructive/30 bg-destructive/5"
                                        : "border-border bg-card"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                {/* Platform Icon */}
                                <div
                                    className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold",
                                        platform === 'instagram' && "bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]",
                                        platform === 'twitter' && "bg-black"
                                    )}
                                    style={{
                                        backgroundColor: platform !== 'instagram' && platform !== 'twitter'
                                            ? platformInfo.color
                                            : undefined
                                    }}
                                >
                                    {platform[0].toUpperCase()}
                                </div>

                                {/* Account Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">{platformInfo.name}</h3>

                                        {isConnected && !expired && (
                                            <Badge variant="outline" className="text-green-500 border-green-500/50 gap-1">
                                                <Check className="w-3 h-3" />
                                                Połączono
                                            </Badge>
                                        )}

                                        {expired && (
                                            <Badge variant="outline" className="text-destructive border-destructive/50 gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                Wygasło
                                            </Badge>
                                        )}

                                        {expiringSoon && !expired && (
                                            <Badge variant="outline" className="text-amber-500 border-amber-500/50 gap-1">
                                                <Clock className="w-3 h-3" />
                                                Wygasa wkrótce
                                            </Badge>
                                        )}
                                    </div>

                                    {account && isConnected ? (
                                        <div className="text-sm text-muted-foreground mt-1">
                                            <span className="font-medium text-foreground">{account.accountName}</span>
                                            {account.connectedAt && (
                                                <span> • Połączono {formatDate(account.connectedAt)}</span>
                                            )}
                                            {account.expiresAt && (
                                                <span className={cn(expired && "text-destructive", expiringSoon && "text-amber-500")}>
                          {' '}• {expired ? 'Wygasło' : 'Wygasa'} {formatDate(account.expiresAt)}
                        </span>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Nie połączono
                                        </p>
                                    )}

                                    {/* Permissions */}
                                    {account?.permissions && account.permissions.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {account.permissions.map((perm) => (
                                                <span
                                                    key={perm}
                                                    className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
                                                >
                          {perm}
                        </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {isConnected && !expired ? (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => account && refreshAccount(account.id)}
                                                disabled={isSaving}
                                                className="gap-1.5"
                                            >
                                                <RefreshCw className={cn("w-4 h-4", isSaving && "animate-spin")} />
                                                <span className="hidden sm:inline">Odśwież</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => account && disconnectAccount(account.id)}
                                                className="gap-1.5 text-destructive hover:text-destructive"
                                            >
                                                <Unlink className="w-4 h-4" />
                                                <span className="hidden sm:inline">Rozłącz</span>
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            onClick={() => connectAccount(platform)}
                                            disabled={isSaving}
                                            className="gap-1.5"
                                            style={{ backgroundColor: platformInfo.color }}
                                        >
                                            {isSaving ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Plus className="w-4 h-4" />
                                            )}
                                            {expired ? 'Połącz ponownie' : 'Połącz'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Info */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-start gap-3">
                    <ExternalLink className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                        <p>
                            Połączenie kont wymaga autoryzacji OAuth. Po kliknięciu &quot;Połącz&quot;
                            zostaniesz przekierowany na stronę danej platformy.
                        </p>
                        <p className="mt-1">
                            Tokeny dostępu są bezpiecznie przechowywane i szyfrowane.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}