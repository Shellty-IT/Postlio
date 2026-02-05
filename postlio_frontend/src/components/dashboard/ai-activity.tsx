// src/components/dashboard/ai-activity.tsx
/**
 * Aktywność AI na dashboardzie
 *
 * ✅ PRAWDZIWE DANE - posty wygenerowane przez AI
 */

'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
    Sparkles,
    ImageIcon,
    MessageSquare,
    Zap,
    ArrowRight,
    Loader2,
    Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePosts } from '@/hooks/usePosts';

// ============================================================
// KONFIGURACJA
// ============================================================

const activityConfig = {
    text: {
        icon: <MessageSquare className="h-4 w-4" />,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        label: 'Post AI',
    },
    image: {
        icon: <ImageIcon className="h-4 w-4" />,
        color: 'text-violet-500',
        bg: 'bg-violet-500/10',
        label: 'Grafika AI',
    },
};

// ============================================================
// KOMPONENT
// ============================================================

export function AIActivity() {
    const router = useRouter();

    // Pobierz posty wygenerowane przez AI
    const { data, isLoading } = usePosts({ limit: 100 });

    // Filtruj posty AI
    const aiPosts = useMemo(() => {
        const posts = data?.posts || [];
        return posts.filter(post => post.ai_generated);
    }, [data?.posts]);

    // Statystyki
    const stats = useMemo(() => {
        const textCount = aiPosts.length;
        const imageCount = aiPosts.filter(post => post.image_url && post.image_prompt).length;

        return { textCount, imageCount };
    }, [aiPosts]);

    // Ostatnie aktywności (max 4)
    const recentActivities = useMemo(() => {
        return aiPosts.slice(0, 4).map(post => ({
            id: post.id,
            type: post.image_prompt ? 'image' : 'text' as 'text' | 'image',
            description: post.content?.slice(0, 50) + '...' || 'Wygenerowany post',
            provider: post.ai_model || 'AI',
            timestamp: new Date(post.created_at),
        }));
    }, [aiPosts]);

    const formatTime = (date: Date) => {
        return formatDistanceToNow(date, { addSuffix: true, locale: pl });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Aktywność AI</h2>
                <div className="flex items-center gap-1.5 text-sm text-green-500">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Online
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 gap-3">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10"
                        >
                            <div className="flex items-center gap-2 text-blue-500 mb-1">
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-2xl font-bold">{stats.textCount}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Postów AI</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/10"
                        >
                            <div className="flex items-center gap-2 text-violet-500 mb-1">
                                <ImageIcon className="h-4 w-4" />
                                <span className="text-2xl font-bold">{stats.imageCount}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Grafik AI</p>
                        </motion.div>
                    </div>

                    {/* Activity List */}
                    {recentActivities.length > 0 ? (
                        <div className="space-y-2">
                            {recentActivities.map((activity, index) => {
                                const config = activityConfig[activity.type];

                                return (
                                    <motion.div
                                        key={activity.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2, delay: index * 0.05 }}
                                        onClick={() => router.push(`/creator?edit=${activity.id}`)}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                    >
                                        <div className={cn('p-1.5 rounded-lg', config.bg, config.color)}>
                                            {config.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm truncate">{activity.description}</p>
                                            <p className="text-xs text-muted-foreground">{activity.provider}</p>
                                        </div>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatTime(activity.timestamp)}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-6"
                        >
                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-muted flex items-center justify-center">
                                <Bot className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                                Brak aktywności AI
                            </p>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push('/creator')}
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Wypróbuj Kreator AI
                            </Button>
                        </motion.div>
                    )}

                    {/* CTA - Autopilot */}
                    {aiPosts.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Button
                                variant="outline"
                                className="w-full group"
                                onClick={() => router.push('/autopilot')}
                            >
                                <Zap className="h-4 w-4 mr-2 text-amber-500" />
                                Włącz Autopilot AI
                                <ArrowRight className="h-4 w-4 ml-auto opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                            </Button>
                        </motion.div>
                    )}
                </>
            )}
        </div>
    );
}