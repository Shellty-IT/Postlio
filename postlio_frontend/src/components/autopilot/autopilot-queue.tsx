// src/components/autopilot/autopilot-queue.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Check,
    X,
    RefreshCw,
    Calendar,
    Clock,
    MoreHorizontal,
    Eye,
    Edit3,
    Trash2,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAutopilotStore } from '@/store/autopilot-store';
import {
    useApproveQueueItem,
    useRejectQueueItem,
    useDeleteQueueItem,
} from '@/hooks/useAutopilot';
import type { BackendQueueItem, BackendQueueStatus } from '@/types/autopilot';

const STATUS_CONFIG: Record<BackendQueueStatus, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Do przeglądu', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)' },
    approved: { label: 'Zatwierdzony', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' },
    scheduled: { label: 'Zaplanowany', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.1)' },
    published: { label: 'Opublikowany', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' },
    failed: { label: 'Błąd', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
    rejected: { label: 'Odrzucony', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.1)' },
};

interface AutopilotQueueProps {
    configId: number | null;
    queueItems: BackendQueueItem[];
}

export function AutopilotQueue({ configId, queueItems }: AutopilotQueueProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const { queueFilter, setQueueFilter } = useAutopilotStore();

    const approveItem = useApproveQueueItem();
    const rejectItem = useRejectQueueItem();
    const deleteItem = useDeleteQueueItem();

    const filteredPosts = queueItems.filter(post =>
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.topic_used?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return `Dziś, ${date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (days === 1) {
            return `Jutro, ${date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (days < 7) {
            return date.toLocaleDateString('pl-PL', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const StatusBadge = ({ status }: { status: BackendQueueStatus }) => {
        const config = STATUS_CONFIG[status];
        if (!config) return null;

        return (
            <Badge
                variant="outline"
                className="text-[10px] xs:text-xs px-1.5 xs:px-2"
                style={{
                    borderColor: config.color,
                    color: config.color,
                    backgroundColor: config.bgColor,
                }}
            >
                <span className="hidden xs:inline">{config.label}</span>
                <span className="xs:hidden">{config.label.split(' ')[0]}</span>
            </Badge>
        );
    };

    const PlatformBadge = ({ platform }: { platform: string }) => {
        const colors: Record<string, string> = {
            facebook: '#1877F2',
            instagram: '#E4405F',
            linkedin: '#0A66C2',
        };

        return (
            <div
                className="w-5 h-5 xs:w-6 xs:h-6 rounded-full flex items-center justify-center text-white text-[10px] xs:text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: colors[platform] || '#6B7280' }}
            >
                {platform[0].toUpperCase()}
            </div>
        );
    };

    const handleApprove = (postId: number) => {
        approveItem.mutate({ itemId: postId });
    };

    const handleReject = (postId: number) => {
        rejectItem.mutate({ itemId: postId });
    };

    const handleDelete = (postId: number) => {
        deleteItem.mutate(postId);
    };

    if (!configId) {
        return (
            <div className="text-center py-8 xs:py-12 text-muted-foreground">
                <Calendar className="w-10 h-10 xs:w-12 xs:h-12 mx-auto mb-3 xs:mb-4 opacity-30" />
                <h3 className="font-medium mb-1 text-sm xs:text-base">Wybierz konfigurację</h3>
                <p className="text-xs xs:text-sm">
                    Wybierz konfigurację aby zobaczyć kolejkę
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3 xs:space-y-4">
            <div className="flex flex-col xs:flex-row gap-2 xs:gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Szukaj..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 xs:h-11"
                    />
                </div>

                <Select
                    value={queueFilter}
                    onValueChange={(v) => setQueueFilter(v as BackendQueueStatus | 'all')}
                >
                    <SelectTrigger className="w-full xs:w-40 sm:w-48 h-10 xs:h-11">
                        <Filter className="w-4 h-4 mr-2 flex-shrink-0" />
                        <SelectValue placeholder="Filtruj" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Wszystkie</SelectItem>
                        <SelectItem value="pending">Do przeglądu</SelectItem>
                        <SelectItem value="approved">Zatwierdzone</SelectItem>
                        <SelectItem value="scheduled">Zaplanowane</SelectItem>
                        <SelectItem value="published">Opublikowane</SelectItem>
                        <SelectItem value="failed">Błędy</SelectItem>
                        <SelectItem value="rejected">Odrzucone</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <ScrollArea className="h-[calc(100vh-280px)] xs:h-[calc(100vh-300px)] sm:h-[calc(100vh-320px)]">
                <div className="space-y-2 xs:space-y-3 pr-2 xs:pr-4">
                    <AnimatePresence mode="popLayout">
                        {filteredPosts.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-8 xs:py-12 text-muted-foreground"
                            >
                                <Calendar className="w-10 h-10 xs:w-12 xs:h-12 mx-auto mb-3 xs:mb-4 opacity-30" />
                                <h3 className="font-medium mb-1 text-sm xs:text-base">Brak postów w kolejce</h3>
                                <p className="text-xs xs:text-sm">
                                    {queueFilter !== 'all'
                                        ? 'Zmień filtr lub wygeneruj nowe posty'
                                        : 'Uruchom Autopilota aby wygenerować posty'}
                                </p>
                            </motion.div>
                        ) : (
                            filteredPosts.map((post, index) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={cn(
                                        "p-3 xs:p-4 rounded-xl border bg-card",
                                        "hover:border-primary/30 transition-all"
                                    )}
                                >
                                    <div className="flex items-start gap-2 xs:gap-4">
                                        <PlatformBadge platform={post.platform} />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 xs:gap-2 mb-1.5 xs:mb-2 flex-wrap">
                                                <StatusBadge status={post.status} />
                                                {post.category && (
                                                    <span className="text-[10px] xs:text-xs text-muted-foreground hidden xs:inline">
                                                        {post.category}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-xs xs:text-sm line-clamp-2 xs:line-clamp-3 mb-2 xs:mb-3">
                                                {post.content}
                                            </p>

                                            <div className="flex items-center gap-2 xs:gap-4 text-[10px] xs:text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span className="hidden xs:inline">{formatDate(post.scheduled_for)}</span>
                                                    <span className="xs:hidden">{new Date(post.scheduled_for).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </span>
                                            </div>
                                        </div>

                                        {post.image_url && (
                                            <div className="w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
                                                <Image
                                                    src={post.image_url}
                                                    alt="Post preview"
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            </div>
                                        )}

                                        <div className="flex items-center gap-1 xs:gap-2 flex-shrink-0">
                                            {post.status === 'pending' && (
                                                <>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        onClick={() => handleApprove(post.id)}
                                                        disabled={approveItem.isPending}
                                                        className="h-8 w-8 xs:h-9 xs:w-9 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                                    >
                                                        {approveItem.isPending ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Check className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        onClick={() => handleReject(post.id)}
                                                        disabled={rejectItem.isPending}
                                                        className="h-8 w-8 xs:h-9 xs:w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        {rejectItem.isPending ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <X className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </>
                                            )}

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 xs:h-9 xs:w-9">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="gap-2">
                                                        <Eye className="w-4 h-4" />
                                                        Podgląd
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2">
                                                        <Edit3 className="w-4 h-4" />
                                                        Edytuj
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2">
                                                        <RefreshCw className="w-4 h-4" />
                                                        Regeneruj
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="gap-2 text-destructive"
                                                        onClick={() => handleDelete(post.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Usuń
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </ScrollArea>

            {filteredPosts.length > 0 && (
                <div className="text-xs xs:text-sm text-muted-foreground text-center">
                    Pokazano {filteredPosts.length} postów
                </div>
            )}
        </div>
    );
}