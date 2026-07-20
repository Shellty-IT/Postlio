// src/components/creator/account-selector.tsx
'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useConnectedAccounts } from '@/hooks/useSocial';
import type { ConnectedAccount } from '@/types';
import { Facebook, Instagram, Linkedin, Link2, Zap, Hand } from 'lucide-react';

interface AccountSelectorProps {
    selected: number[];
    onChange: (accountIds: number[]) => void;
    disabled?: boolean;
}

const PLATFORM_ICON: Record<string, React.ElementType> = {
    facebook: Facebook,
    instagram: Instagram,
    linkedin: Linkedin,
};

const PLATFORM_BG: Record<string, string> = {
    facebook: 'bg-[#1877F2]',
    instagram: 'bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
    linkedin: 'bg-[#0A66C2]',
};

export function AccountSelector({ selected, onChange, disabled }: AccountSelectorProps) {
    const { data, isLoading } = useConnectedAccounts();

    const accounts = (data?.accounts ?? []).filter(
        (a) => a.is_active && a.status !== 'disconnected'
    );

    const toggleAccount = (account: ConnectedAccount) => {
        if (disabled) return;

        const isSelected = selected.includes(account.id);

        if (isSelected) {
            if (selected.length > 1) {
                onChange(selected.filter((id) => id !== account.id));
            }
            return;
        }

        // Max jedno konto na platformę - wybór nowego odznacza inne konto tej samej platformy.
        const withoutSamePlatform = selected.filter((id) => {
            const other = accounts.find((a) => a.id === id);
            return other?.platform !== account.platform;
        });

        onChange([...withoutSamePlatform, account.id]);
    };

    if (isLoading) {
        return (
            <div className="space-y-2">
                <label className="mono-label">Konta docelowe</label>
                <div className="h-11 rounded-[11px] border border-white/[0.09] bg-white/[0.02] animate-pulse" />
            </div>
        );
    }

    if (accounts.length === 0) {
        return (
            <div className="space-y-2">
                <label className="mono-label">Konta docelowe</label>
                <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-[11px] border border-dashed border-white/[0.15] text-sm text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-colors"
                >
                    <Link2 className="h-3.5 w-3.5" />
                    Podłącz konto social media w Ustawieniach
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <label className="mono-label">Konta docelowe</label>
            <div className="flex flex-wrap gap-2">
                {accounts.map((account) => {
                    const isSelected = selected.includes(account.id);
                    const Icon = PLATFORM_ICON[account.platform] ?? Link2;
                    const isAuto = account.publish_method === 'auto';

                    return (
                        <button
                            key={account.id}
                            type="button"
                            onClick={() => toggleAccount(account)}
                            disabled={disabled}
                            title={
                                isAuto
                                    ? 'Publikacja automatyczna'
                                    : 'Wymaga ręcznego skopiowania treści'
                            }
                            className={cn(
                                'relative flex items-center gap-2 px-3 py-2 rounded-[11px] border',
                                'transition-all duration-200',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                isSelected
                                    ? 'bg-gradient-to-br from-primary/20 to-accent/10 border-primary/35 text-white'
                                    : 'border-white/[0.09] text-muted-foreground hover:bg-white/[0.04]'
                            )}
                        >
                            <span
                                className={cn(
                                    'flex h-5 w-5 items-center justify-center rounded-[6px] text-white flex-shrink-0',
                                    PLATFORM_BG[account.platform]
                                )}
                            >
                                <Icon className="h-3 w-3" />
                            </span>

                            <span className="flex flex-col items-start leading-tight">
                                <span className={cn('font-medium text-sm', isSelected ? 'text-white' : 'text-[#c7cad2]')}>
                                    {account.display_name}
                                </span>
                                {account.platform_username && (
                                    <span className="text-[10px] text-muted-foreground">
                                        @{account.platform_username}
                                    </span>
                                )}
                            </span>

                            <span
                                className={cn(
                                    'flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0',
                                    isAuto
                                        ? 'bg-emerald-400/15 text-emerald-400'
                                        : 'bg-amber-400/15 text-amber-400'
                                )}
                            >
                                {isAuto ? <Zap className="h-2.5 w-2.5" /> : <Hand className="h-2.5 w-2.5" />}
                                {isAuto ? 'Auto' : 'Ręcznie'}
                            </span>

                            {isSelected && (
                                <span className="absolute -top-1 -right-1 h-[11px] w-[11px] rounded-full bg-emerald-400 border-2 border-background" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
