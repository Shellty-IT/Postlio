'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { usePosts } from '@/hooks/usePosts';
import {
    Facebook,
    Instagram,
    Linkedin,
    ImageIcon,
    Sparkles,
    FileText,
    Edit3,
    Send,
} from 'lucide-react';
import type { Platform } from '@/types';

const platformIcons: Record<Platform, React.ReactNode> = {
    facebook: <Facebook className="h-3 w-3" />,
    instagram: <Instagram className="h-3 w-3" />,
    linkedin: <Linkedin className="h-3 w-3" />,
};

export function RecentDrafts() {
    const router = useRouter();
    const { data, isLoading } = usePosts({ status: 'draft', limit: 4 });

    const drafts = data?.posts || [];

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className="mono-label">Ostatnie szkice</div>
                <Link href="/saved-posts" className="text-[12.5px] text-muted-foreground transition-colors hover:text-foreground/90">
                    Wszystkie &rarr;
                </Link>
            </div>

            {isLoading ? (
                <div className="glass-card h-32 animate-pulse" />
            ) : drafts.length > 0 ? (
                <div className="glass-card flex flex-col gap-1 p-2">
                    {drafts.map((draft, index) => {
                        const platforms = draft.platforms && draft.platforms.length > 0
                            ? draft.platforms
                            : (draft.platform ? [draft.platform] : ['facebook']);

                        return (
                            <div key={draft.id}>
                                {index > 0 && <div className="mx-3 h-px bg-white/[0.05]" />}
                                <div
                                    onClick={() => router.push(`/creator?edit=${draft.id}`)}
                                    className="flex cursor-pointer items-center gap-3.5 rounded-[14px] p-3 transition-colors hover:bg-white/[0.03]"
                                >
                                    <div className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-gradient-to-br from-primary/20 to-accent/20 text-muted-foreground">
                                        {draft.image_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={draft.image_url} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <ImageIcon className="h-5 w-5" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {platforms.map((platform) => (
                                                <span
                                                    key={platform}
                                                    className={cn(
                                                        'flex h-[18px] w-[18px] items-center justify-center rounded-[5px]',
                                                        `platform-${platform}`
                                                    )}
                                                >
                                                    {platformIcons[platform as Platform]}
                                                </span>
                                            ))}
                                            <span className="rounded-md bg-warning/15 px-1.5 py-0.5 text-[11px] font-medium text-warning">
                                                Szkic
                                            </span>
                                            {draft.ai_generated && (
                                                <span className="flex items-center gap-1 rounded-md bg-gradient-to-br from-primary/20 to-accent/20 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                                                    <Sparkles className="h-2.5 w-2.5" />
                                                    AI
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1.5 truncate text-[13.5px] text-foreground/85">
                                            {draft.content || 'Brak treści'}
                                        </p>
                                    </div>

                                    <span className="flex-shrink-0 text-[11.5px] text-muted-foreground">
                                        {formatDistanceToNow(new Date(draft.created_at), { addSuffix: true, locale: pl })}
                                    </span>

                                    <div className="flex flex-shrink-0 gap-1">
                                        <button
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                router.push(`/creator?edit=${draft.id}`);
                                            }}
                                            className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-white/[0.07] text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
                                        >
                                            <Edit3 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="empty-state-card"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold">Brak szkiców</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Stwórz swój pierwszy post z pomocą AI</p>
                    </div>
                    <button
                        onClick={() => router.push('/creator')}
                        className="btn-gradient px-4 py-2.5 text-sm"
                    >
                        <Send className="h-4 w-4" />
                        Utwórz post
                    </button>
                </motion.div>
            )}
        </div>
    );
}
