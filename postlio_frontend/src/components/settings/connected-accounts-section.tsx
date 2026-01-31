// src/components/settings/connected-accounts-section.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Link2,
    Plus,
    RefreshCw,
    Unlink,
    Check,
    AlertCircle,
    ExternalLink,
    ChevronDown,
    Facebook,
    Instagram,
    Linkedin,
    Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    useConnectedAccounts,
    useInitOAuth,
    useDisconnectAccount,
    useRefreshToken,
} from '@/hooks/useSocial';
import {
    type SocialPlatform,
    type AccountType,
    type ConnectedAccount,
    getAccountTypeLabel,
} from '@/lib/api/social';

// ==================== Platform Config ====================

interface PlatformConfig {
    platform: SocialPlatform;
    name: string;
    icon: React.ReactNode;
    color: string;
    gradient?: string;
    accountTypes: AccountType[];
    description: string;
}

const PLATFORMS: PlatformConfig[] = [
    {
        platform: 'facebook',
        name: 'Facebook',
        icon: <Facebook className="w-5 h-5" />,
        color: '#1877F2',
        accountTypes: ['facebook_page'],
        description: 'Połącz strony Facebook do automatycznej publikacji',
    },
    {
        platform: 'instagram',
        name: 'Instagram',
        icon: <Instagram className="w-5 h-5" />,
        color: '#E4405F',
        gradient: 'bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]',
        accountTypes: ['instagram_business', 'instagram_creator'],
        description: 'Połącz konta biznesowe lub twórców Instagram',
    },
    {
        platform: 'linkedin',
        name: 'LinkedIn',
        icon: <Linkedin className="w-5 h-5" />,
        color: '#0A66C2',
        accountTypes: ['linkedin_profile', 'linkedin_company'],
        description: 'Połącz profil osobisty lub stronę firmową',
    },
];

// ==================== Main Component ====================

export function ConnectedAccountsSection() {
    const { data, isLoading, error } = useConnectedAccounts();
    const initOAuth = useInitOAuth();
    const disconnectAccount = useDisconnectAccount();
    const refreshToken = useRefreshToken();

    const [disconnectingId, setDisconnectingId] = useState<number | null>(null);
    const [expandedPlatform, setExpandedPlatform] = useState<SocialPlatform | null>(null);

    const accounts = data?.accounts || [];

    // Group accounts by platform
    const accountsByPlatform = PLATFORMS.map(platform => ({
        ...platform,
        accounts: accounts.filter(a => a.platform === platform.platform),
    }));

    const handleConnect = (platform: SocialPlatform) => {
        initOAuth.mutate({ platform, context: 'settings' });
    };

    const handleDisconnect = (accountId: number) => {
        disconnectAccount.mutate(accountId, {
            onSuccess: () => setDisconnectingId(null),
        });
    };

    const handleRefresh = (accountId: number) => {
        refreshToken.mutate(accountId);
    };

    // Check if expiring soon (within 7 days)
    const isExpiringSoon = (expiresAt?: string) => {
        if (!expiresAt) return false;
        const days = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return days < 7 && days > 0;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pl-PL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatExpiryDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (days < 0) return 'Wygasło';
        if (days === 0) return 'Wygasa dziś';
        if (days === 1) return 'Wygasa jutro';
        if (days < 7) return `Wygasa za ${days} dni`;
        return `Wygasa ${formatDate(dateStr)}`;
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

            {/* Loading State */}
            {isLoading && (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
                    ))}
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive">
                    <p className="font-medium">Błąd ładowania kont</p>
                    <p className="text-sm mt-1">{error.message}</p>
                </div>
            )}

            {/* Platforms */}
            {!isLoading && !error && (
                <div className="space-y-4">
                    {accountsByPlatform.map((platform) => (
                        <PlatformCard
                            key={platform.platform}
                            platform={platform}
                            isExpanded={expandedPlatform === platform.platform}
                            onToggleExpand={() => setExpandedPlatform(
                                expandedPlatform === platform.platform ? null : platform.platform
                            )}
                            onConnect={() => handleConnect(platform.platform)}
                            onDisconnect={(id) => setDisconnectingId(id)}
                            onRefresh={handleRefresh}
                            isConnecting={initOAuth.isPending}
                            isExpiringSoon={isExpiringSoon}
                            formatDate={formatDate}
                            formatExpiryDate={formatExpiryDate}
                        />
                    ))}
                </div>
            )}

            {/* Summary */}
            {!isLoading && accounts.length > 0 && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Check className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">
                                {accounts.filter(a => a.status === 'connected').length} aktywnych połączeń
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Możesz publikować na {accounts.filter(a => a.status === 'connected').length} kontach
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Info */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-start gap-3">
                    <ExternalLink className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-muted-foreground space-y-2">
                        <p>
                            <strong>Facebook:</strong> Wymagana Strona Facebook (nie profil osobisty)
                        </p>
                        <p>
                            <strong>Instagram:</strong> Wymagane konto Business lub Creator połączone ze Stroną Facebook
                        </p>
                        <p>
                            <strong>LinkedIn:</strong> Możesz połączyć profil osobisty lub stronę firmową
                        </p>
                        <p className="pt-2 border-t border-border mt-2">
                            Tokeny dostępu są bezpiecznie szyfrowane. Połączenie wymaga autoryzacji OAuth.
                        </p>
                    </div>
                </div>
            </div>

            {/* Disconnect Confirmation Dialog */}
            <AlertDialog open={disconnectingId !== null} onOpenChange={() => setDisconnectingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Rozłączyć konto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Po rozłączeniu nie będziesz mógł publikować na tym koncie.
                            Możesz je połączyć ponownie w każdej chwili.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => disconnectingId && handleDisconnect(disconnectingId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {disconnectAccount.isPending ? (
                                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Unlink className="w-4 h-4 mr-2" />
                            )}
                            Rozłącz
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
}

// ==================== Platform Card ====================

interface PlatformCardProps {
    platform: PlatformConfig & { accounts: ConnectedAccount[] };
    isExpanded: boolean;
    onToggleExpand: () => void;
    onConnect: () => void;
    onDisconnect: (id: number) => void;
    onRefresh: (id: number) => void;
    isConnecting: boolean;
    isExpiringSoon: (date?: string) => boolean;
    formatDate: (date: string) => string;
    formatExpiryDate: (date: string) => string;
}

function PlatformCard({
                          platform,
                          isExpanded,
                          onToggleExpand,
                          onConnect,
                          onDisconnect,
                          onRefresh,
                          isConnecting,
                          isExpiringSoon,
                          formatDate,
                          formatExpiryDate,
                      }: PlatformCardProps) {
    const hasAccounts = platform.accounts.length > 0;
    const connectedCount = platform.accounts.filter(a => a.status === 'connected').length;

    return (
        <motion.div
            layout
            className={cn(
                "rounded-xl border-2 transition-all overflow-hidden",
                connectedCount > 0
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-border bg-card"
            )}
        >
            {/* Header */}
            <div className="p-5">
                <div className="flex items-center gap-4">
                    {/* Platform Icon */}
                    <div
                        className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0",
                            platform.gradient || ""
                        )}
                        style={{
                            backgroundColor: !platform.gradient ? platform.color : undefined
                        }}
                    >
                        {platform.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{platform.name}</h3>
                            {connectedCount > 0 && (
                                <Badge variant="outline" className="text-green-500 border-green-500/50 gap-1">
                                    <Check className="w-3 h-3" />
                                    {connectedCount} {connectedCount === 1 ? 'konto' : 'kont'}
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {platform.description}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {hasAccounts && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onToggleExpand}
                                className="gap-1"
                            >
                                <ChevronDown className={cn(
                                    "w-4 h-4 transition-transform",
                                    isExpanded && "rotate-180"
                                )} />
                                Szczegóły
                            </Button>
                        )}
                        <Button
                            onClick={onConnect}
                            disabled={isConnecting}
                            size="sm"
                            className="gap-1.5"
                            style={{ backgroundColor: platform.color }}
                        >
                            {isConnecting ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <Plus className="w-4 h-4" />
                            )}
                            {hasAccounts ? 'Dodaj kolejne' : 'Połącz'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Expanded Accounts List */}
            <AnimatePresence>
                {isExpanded && hasAccounts && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-border"
                    >
                        <div className="p-4 space-y-3">
                            {platform.accounts.map((account) => (
                                <AccountItem
                                    key={account.id}
                                    account={account}
                                    platformColor={platform.color}
                                    onDisconnect={() => onDisconnect(account.id)}
                                    onRefresh={() => onRefresh(account.id)}
                                    isExpiringSoon={isExpiringSoon(account.expires_at)}
                                    formatDate={formatDate}
                                    formatExpiryDate={formatExpiryDate}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
// ==================== Account Item ====================

interface AccountItemProps {
    account: ConnectedAccount;
    platformColor: string;
    onDisconnect: () => void;
    onRefresh: () => void;
    isExpiringSoon: boolean;
    formatDate: (date: string) => string;
    formatExpiryDate: (date: string) => string;
}

function AccountItem({
                         account,
                         platformColor,
                         onDisconnect,
                         onRefresh,
                         isExpiringSoon,
                         formatDate,
                         formatExpiryDate,
                     }: AccountItemProps) {
    const isExpired = account.status === 'expired';

    return (
        <div className={cn(
            "p-4 rounded-lg border transition-all",
            isExpired
                ? "border-destructive/30 bg-destructive/5"
                : isExpiringSoon
                    ? "border-yellow-500/30 bg-yellow-500/5"
                    : "border-border bg-background"
        )}>
            <div className="flex items-center gap-4">
                {/* Avatar z kropką statusu */}
                <div className="relative flex-shrink-0">
                    {account.avatar_url ? (
                        <Image
                            src={account.avatar_url}
                            alt=""
                            width={48}
                            height={48}
                            className="rounded-full object-cover"
                        />
                    ) : (
                        <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: platformColor }}
                        >
                            {(account.platform_username || 'U')[0].toUpperCase()}
                        </div>
                    )}
                    {/* Status indicator */}
                    <div className={cn(
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background",
                        account.status === 'connected' && "bg-green-500",
                        account.status === 'expired' && "bg-yellow-500",
                        account.status === 'error' && "bg-red-500",
                        account.status === 'disconnected' && "bg-gray-400"
                    )} />
                </div>

                {/* Info - TYLKO jedna linia z nazwą */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-base truncate">
                            {account.platform_username || 'Nieznane konto'}
                        </span>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                            {getAccountTypeLabel(account.account_type)}
                        </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">
                        Połączono {formatDate(account.connected_at)}
                        {account.expires_at && (
                            <span className={cn(
                                "ml-2",
                                isExpired && "text-destructive font-medium",
                                isExpiringSoon && !isExpired && "text-yellow-600 font-medium"
                            )}>
                                • {formatExpiryDate(account.expires_at)}
                            </span>
                        )}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {(isExpired || isExpiringSoon) && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRefresh}
                            className="gap-1 text-xs"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Odśwież
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDisconnect}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <Unlink className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}