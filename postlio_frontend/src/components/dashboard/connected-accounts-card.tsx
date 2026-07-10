'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Linkedin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConnectedAccount, SocialPlatform } from '@/types';

const platformMeta: Record<SocialPlatform, { name: string; icon: React.ReactNode }> = {
    facebook: { name: 'Facebook', icon: <Facebook className="h-4 w-4" /> },
    instagram: { name: 'Instagram', icon: <Instagram className="h-[18px] w-[18px]" /> },
    linkedin: { name: 'LinkedIn', icon: <Linkedin className="h-4 w-4" /> },
};

const platforms: SocialPlatform[] = ['facebook', 'instagram', 'linkedin'];

interface ConnectedAccountsCardProps {
    accounts: ConnectedAccount[];
}

export function ConnectedAccountsCard({ accounts }: ConnectedAccountsCardProps) {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-3">
            <div className="mono-label">Twoje konta</div>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card flex flex-col gap-1 p-2.5"
            >
                {platforms.map((platform) => {
                    const meta = platformMeta[platform];
                    const account = accounts.find((acc) => acc.platform === platform);

                    return (
                        <div key={platform} className="flex items-center gap-3 rounded-[13px] p-2.5">
                            <span className={cn('flex h-9 w-9 items-center justify-center rounded-[10px] text-white', `platform-${platform}`)}>
                                {meta.icon}
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="text-[13.5px] font-semibold">{meta.name}</div>
                                <div className="truncate text-[11.5px] text-muted-foreground">
                                    {account ? (account.display_name || account.platform_username || 'Połączone') : 'niepołączony'}
                                </div>
                            </div>
                            {account ? (
                                <span className="flex items-center gap-1.5 text-[11.5px] text-success">
                                    <span className="status-dot status-dot-pulse bg-success" />
                                    Połączony
                                </span>
                            ) : (
                                <button
                                    onClick={() => router.push('/settings')}
                                    className="rounded-[9px] border border-primary/25 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/[0.12]"
                                >
                                    Połącz
                                </button>
                            )}
                        </div>
                    );
                })}
            </motion.div>
        </div>
    );
}
