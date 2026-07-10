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
    ExternalLink,
    ChevronDown,
    Facebook,
    Instagram,
    Linkedin,
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
        icon: <Facebook className="w-4 h-4 xs:w-5 xs:h-5" />,
        color: '#1877F2',
        accountTypes: ['facebook_page'],
        description: 'Połącz strony Facebook',
    },
    {
        platform: 'instagram',
        name: 'Instagram',
        icon: <Instagram className="w-4 h-4 xs:w-5 xs:h-5" />,
        color: '#E4405F',
        gradient: 'bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]',
        accountTypes: ['instagram_business', 'instagram_creator'],
        description: 'Konta biznesowe lub twórców',
    },
    {
        platform: 'linkedin',
        name: 'LinkedIn',
        icon: <Linkedin className="w-4 h-4 xs:w-5 xs:h-5" />,
        color: '#0A66C2',
        accountTypes: ['linkedin_profile', 'linkedin_company'],
        description: 'Profil lub strona firmowa',
    },
];

function deduplicateAccounts(accounts: ConnectedAccount[]): ConnectedAccount[] {
    const seen = new Map<string, ConnectedAccount>();

    for (const account of accounts) {
        const key = `${account.platform}_${account.platform_user_id}`;

        const existing = seen.get(key);
        if (!existing) {
            seen.set(key, account);
        } else {
            const statusPriority: Record<string, number> = {
                connected: 4,
                expired: 3,
                error: 2,
                disconnected: 1,
            };

            const existingPriority = statusPriority[existing.status] || 0;
            const newPriority = statusPriority[account.status] || 0;

            if (newPriority > existingPriority ||
                (newPriority === existingPriority && account.id > existing.id)) {
                seen.set(key, account);
            }
        }
    }

    return Array.from(seen.values());
}

export function ConnectedAccountsSection() {
    const { data, isLoading, error } = useConnectedAccounts();
    const initOAuth = useInitOAuth();
    const disconnectAccount = useDisconnectAccount();
    const refreshToken = useRefreshToken();

    const [disconnectingId, setDisconnectingId] = useState<number | null>(null);
    const [expandedPlatform, setExpandedPlatform] = useState<SocialPlatform | null>(null);

    const rawAccounts = data?.accounts || [];
    const accounts = deduplicateAccounts(rawAccounts)
        .filter(a => a.status !== 'disconnected');

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
        if (days < 7) return `Za ${days} dni`;
        return `${formatDate(dateStr)}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 sm:space-y-8"
        >
            <div>
                <h2 className="text-lg xs:text-xl font-semibold text-foreground flex items-center gap-2">
                    <Link2 className="w-4 h-4 xs:w-5 xs:h-5 text-primary" />
                    Połączone konta
                </h2>
                <p className="text-xs xs:text-sm text-muted-foreground mt-1">
                    Zarządzaj kontami social media.
                </p>
            </div>

            {isLoading && (
                <div className="space-y-3 xs:space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 xs:h-24 rounded-xl bg-muted animate-pulse" />
                    ))}
                </div>
            )}

            {error && (
                <div className="p-3 xs:p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive">
                    <p className="font-medium text-sm">Błąd ładowania kont</p>
                    <p className="text-xs xs:text-sm mt-1">{error.message}</p>
                </div>
            )}

            {!isLoading && !error && (
                <div className="space-y-3 xs:space-y-4">
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

            {!isLoading && accounts.length > 0 && (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 xs:p-4">
                    <div className="flex items-center gap-2 xs:gap-3">
                        <div className="w-8 h-8 xs:w-10 xs:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 xs:w-5 xs:h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium text-sm xs:text-base text-foreground">
                                {accounts.filter(a => a.status === 'connected').length} aktywnych połączeń
                            </p>
                            <p className="text-xs xs:text-sm text-muted-foreground">
                                Możesz publikować na {accounts.filter(a => a.status === 'connected').length} kontach
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="glass-card p-3 xs:p-4">
                <div className="flex items-start gap-2 xs:gap-3">
                    <ExternalLink className="w-4 h-4 xs:w-5 xs:h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground space-y-1.5 xs:space-y-2">
                        <p>
                            <strong>Facebook:</strong> Wymagana Strona Facebook
                        </p>
                        <p>
                            <strong>Instagram:</strong> Konto Business/Creator + Strona FB
                        </p>
                        <p>
                            <strong>LinkedIn:</strong> Profil lub strona firmowa
                        </p>
                    </div>
                </div>
            </div>

            <AlertDialog open={disconnectingId !== null} onOpenChange={() => setDisconnectingId(null)}>
                <AlertDialogContent className="max-w-[calc(100vw-2rem)] xs:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base xs:text-lg">Rozłączyć konto?</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs xs:text-sm">
                            Po rozłączeniu nie będziesz mógł publikować na tym koncie.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col xs:flex-row gap-2">
                        <AlertDialogCancel className="w-full xs:w-auto">Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => disconnectingId && handleDisconnect(disconnectingId)}
                            className="w-full xs:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
                "rounded-2xl border transition-all overflow-hidden",
                connectedCount > 0
                    ? "border-emerald-500/25 bg-emerald-500/[0.04]"
                    : "border-white/[0.07] bg-white/[0.022]"
            )}
        >
            <div className="p-3 xs:p-4 sm:p-5">
                <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                    <div
                        className={cn(
                            "w-10 h-10 xs:w-12 xs:h-12 rounded-lg xs:rounded-xl flex items-center justify-center text-white flex-shrink-0",
                            platform.gradient || ""
                        )}
                        style={{
                            backgroundColor: !platform.gradient ? platform.color : undefined
                        }}
                    >
                        {platform.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 xs:gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm xs:text-base">{platform.name}</h3>
                            {connectedCount > 0 && (
                                <Badge variant="outline" className="text-green-500 border-green-500/50 gap-0.5 xs:gap-1 text-[10px] xs:text-xs px-1.5">
                                    <Check className="w-2.5 h-2.5 xs:w-3 xs:h-3" />
                                    {connectedCount}
                                </Badge>
                            )}
                        </div>
                        <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                            {platform.description}
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 xs:gap-2 flex-shrink-0">
                        {hasAccounts && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onToggleExpand}
                                className="gap-1 h-8 xs:h-9 px-2 xs:px-3 text-xs"
                            >
                                <ChevronDown className={cn(
                                    "w-3.5 h-3.5 xs:w-4 xs:h-4 transition-transform",
                                    isExpanded && "rotate-180"
                                )} />
                                <span className="hidden xs:inline">Szczegóły</span>
                            </Button>
                        )}
                        <Button
                            onClick={onConnect}
                            disabled={isConnecting}
                            size="sm"
                            className="gap-1 xs:gap-1.5 h-8 xs:h-9 px-2 xs:px-3 text-xs"
                            style={{ backgroundColor: platform.color }}
                        >
                            {isConnecting ? (
                                <RefreshCw className="w-3.5 h-3.5 xs:w-4 xs:h-4 animate-spin" />
                            ) : (
                                <Plus className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                            )}
                            <span className="hidden xs:inline">{hasAccounts ? 'Dodaj' : 'Połącz'}</span>
                        </Button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && hasAccounts && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-border"
                    >
                        <div className="p-3 xs:p-4 space-y-2 xs:space-y-3">
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
    const [imageError, setImageError] = useState(false);

    const showFallback = !account.avatar_url || imageError;

    return (
        <div className={cn(
            "p-3 xs:p-4 rounded-lg border transition-all",
            isExpired
                ? "border-destructive/30 bg-destructive/5"
                : isExpiringSoon
                    ? "border-yellow-500/30 bg-yellow-500/5"
                    : "border-border bg-background"
        )}>
            <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                <div className="relative flex-shrink-0">
                    {!showFallback ? (
                        <Image
                            src={account.avatar_url!}
                            alt=""
                            width={40}
                            height={40}
                            className="rounded-full object-cover w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12"
                            onError={() => setImageError(true)}
                            unoptimized
                        />
                    ) : (
                        <div
                            className="w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm xs:text-base"
                            style={{ backgroundColor: platformColor }}
                        >
                            {(account.platform_username || 'U')[0].toUpperCase()}
                        </div>
                    )}
                    <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 xs:w-3.5 xs:h-3.5 rounded-full border-2 border-background",
                        account.status === 'connected' && "bg-green-500",
                        account.status === 'expired' && "bg-yellow-500",
                        account.status === 'error' && "bg-red-500",
                        account.status === 'disconnected' && "bg-gray-400"
                    )} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 xs:gap-2 flex-wrap">
                        <span className="font-semibold text-xs xs:text-sm sm:text-base truncate">
                            {account.platform_username || 'Nieznane konto'}
                        </span>
                        <Badge variant="secondary" className="text-[9px] xs:text-[10px] px-1 xs:px-1.5 flex-shrink-0">
                            {getAccountTypeLabel(account.account_type)}
                        </Badge>
                    </div>

                    <p className="text-[9px] xs:text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                        <span className="hidden xs:inline">Połączono {formatDate(account.connected_at)}</span>
                        <span className="xs:hidden">{formatDate(account.connected_at)}</span>
                        {account.expires_at && (
                            <span className={cn(
                                "ml-1 xs:ml-2",
                                isExpired && "text-destructive font-medium",
                                isExpiringSoon && !isExpired && "text-yellow-600 font-medium"
                            )}>
                                • {formatExpiryDate(account.expires_at)}
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-1 xs:gap-2 flex-shrink-0">
                    {(isExpired || isExpiringSoon) && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRefresh}
                            className="gap-1 text-[10px] xs:text-xs h-7 xs:h-8 px-2"
                        >
                            <RefreshCw className="w-3 h-3" />
                            <span className="hidden xs:inline">Odśwież</span>
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onDisconnect}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 xs:h-8 xs:w-8"
                    >
                        <Unlink className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}