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
    Trash2
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
import { STATUS_CONFIG, type QueueStatus } from '@/types/autopilot';

export function AutopilotQueue() {
    const [searchQuery, setSearchQuery] = useState('');
    const {
        queueFilter,
        setQueueFilter,
        getFilteredQueue,
        approvePost,
        rejectPost,
        regeneratePost,
        deleteQueuedPost,
    } = useAutopilotStore();

    const posts = getFilteredQueue();

    // Filter by search
    const filteredPosts = posts.filter(post =>
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.topic?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Format date
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

    // Status badge
    const StatusBadge = ({ status }: { status: QueueStatus }) => {
        const config = STATUS_CONFIG[status];
        return (
            <Badge
                variant="outline"
                style={{
                    borderColor: config.color,
                    color: config.color,
                    backgroundColor: config.bgColor,
                }}
            >
                {config.label}
            </Badge>
        );
    };

    // Platform badge
    const PlatformBadge = ({ platform }: { platform: string }) => {
        const colors: Record<string, string> = {
            facebook: '#1877F2',
            instagram: '#E4405F',
            linkedin: '#0A66C2',
        };

        return (
            <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: colors[platform] || '#6B7280' }}
            >
                {platform[0].toUpperCase()}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Szukaj w treści lub temacie..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <Select
                    value={queueFilter}
                    onValueChange={(v) => setQueueFilter(v as QueueStatus | 'all')}
                >
                    <SelectTrigger className="w-full sm:w-48">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filtruj status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Wszystkie</SelectItem>
                        <SelectItem value="pending_review">Do przeglądu</SelectItem>
                        <SelectItem value="approved">Zatwierdzone</SelectItem>
                        <SelectItem value="scheduled">Zaplanowane</SelectItem>
                        <SelectItem value="published">Opublikowane</SelectItem>
                        <SelectItem value="failed">Błędy</SelectItem>
                        <SelectItem value="rejected">Odrzucone</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Queue List */}
            <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="space-y-3 pr-4">
                    <AnimatePresence mode="popLayout">
                        {filteredPosts.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12 text-muted-foreground"
                            >
                                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <h3 className="font-medium mb-1">Brak postów w kolejce</h3>
                                <p className="text-sm">
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
                                        "p-4 rounded-xl border bg-card",
                                        "hover:border-primary/30 transition-all"
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Platforms */}
                                        <div className="flex flex-col gap-1">
                                            {post.platforms.map((platform) => (
                                                <PlatformBadge key={platform} platform={platform} />
                                            ))}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <StatusBadge status={post.status} />
                                                {post.topic && (
                                                    <span className="text-xs text-muted-foreground">
                            {post.topic}
                          </span>
                                                )}
                                            </div>

                                            <p className="text-sm line-clamp-3 mb-3">
                                                {post.content}
                                            </p>

                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                            {formatDate(post.scheduledFor)}
                        </span>
                                                <span>
                          via {post.generatedBy}
                        </span>
                                            </div>
                                        </div>

                                        {/* Image Preview */}
                                        {post.imageUrl && (
                                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
                                                <Image
                                                    src={post.imageUrl}
                                                    alt="Post preview"
                                                    fill
                                                    className="object-cover"
                                                    unoptimized
                                                />
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            {post.status === 'pending_review' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => approvePost(post.id)}
                                                        className="gap-1 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                        <span className="hidden sm:inline">Zatwierdź</span>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => rejectPost(post.id)}
                                                        className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        <span className="hidden sm:inline">Odrzuć</span>
                                                    </Button>
                                                </>
                                            )}

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="sm" variant="ghost">
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
                                                    <DropdownMenuItem
                                                        className="gap-2"
                                                        onClick={() => regeneratePost(post.id)}
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                        Regeneruj
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="gap-2 text-destructive"
                                                        onClick={() => deleteQueuedPost(post.id)}
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

            {/* Summary */}
            {filteredPosts.length > 0 && (
                <div className="text-sm text-muted-foreground text-center">
                    Pokazano {filteredPosts.length} z {posts.length} postów
                </div>
            )}
        </div>
    );
}