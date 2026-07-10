// src/components/calendar/drafts-sidebar.tsx
'use client';

import { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
    FileText,
    GripVertical,
    Search,
    ChevronLeft,
    ChevronRight,
    Facebook,
    Instagram,
    Linkedin,
    Sparkles,
    Image as ImageIcon,
    Copy,
    X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Post } from '@/types/post';
import type { Platform } from '@/types';

interface DraftsSidebarProps {
    drafts: Post[];
    isLoading?: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    isMobileSheet?: boolean;
}

interface DraggableDraftCardProps {
    draft: Post;
}

const PLATFORM_CONFIG: Record<Platform, {
    icon: typeof Facebook;
    color: string;
    label: string;
}> = {
    facebook: { icon: Facebook, color: '#1877F2', label: 'FB' },
    instagram: { icon: Instagram, color: '#E4405F', label: 'IG' },
    linkedin: { icon: Linkedin, color: '#0A66C2', label: 'LI' },
};

function hasAnyPlatform(post: Post, platform: Platform): boolean {
    if (post.platforms && post.platforms.length > 0) {
        return post.platforms.includes(platform);
    }
    return post.platform === platform;
}

function DraggableDraftCard({ draft }: DraggableDraftCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useDraggable({
        id: `draft-${draft.id}`,
        data: { type: 'draft', draft },
    });

    const style = { transform: CSS.Translate.toString(transform) };

    const allPlatforms = draft.platforms && draft.platforms.length > 0
        ? draft.platforms
        : (draft.platform ? [draft.platform] : ['facebook']);

    const truncatedContent = draft.content && draft.content.length > 90
        ? `${draft.content.slice(0, 90)}...`
        : (draft.content || '');

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group glass-card-interactive relative p-3 touch-none',
                isDragging && 'opacity-50 shadow-2xl ring-2 ring-primary z-50'
            )}
        >
            <div
                {...listeners}
                {...attributes}
                className={cn(
                    'absolute left-1 top-1/2 -translate-y-1/2 p-1.5 rounded cursor-grab',
                    'text-muted-foreground hover:text-foreground hover:bg-white/[0.06]',
                    'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity',
                    isDragging && 'cursor-grabbing'
                )}
            >
                <GripVertical className="h-4 w-4" />
            </div>

            <div className="pl-6 space-y-2">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 flex-wrap">
                        {allPlatforms.map((platform) => {
                            const config = PLATFORM_CONFIG[platform as Platform];
                            if (!config) return null;
                            const Icon = config.icon;
                            return (
                                <div
                                    key={platform}
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium"
                                    style={{
                                        backgroundColor: `${config.color}15`,
                                        color: config.color,
                                    }}
                                >
                                    <Icon className="h-3 w-3" />
                                    {allPlatforms.length === 1 && config.label}
                                </div>
                            );
                        })}
                    </div>

                    {draft.ai_generated && (
                        <span className="rounded-md bg-gradient-to-br from-primary/20 to-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#c3ccff]">
                            AI
                        </span>
                    )}

                    {draft.image_url && (
                        <ImageIcon className="h-3 w-3 text-muted-foreground" />
                    )}

                    <span className="ml-auto text-[11px] text-muted-foreground">
                        {format(new Date(draft.created_at), 'd MMM', { locale: pl })}
                    </span>
                </div>

                <p className="text-[13px] text-foreground/80 line-clamp-2">
                    {truncatedContent}
                </p>

                <div className="flex gap-1.5 border-t border-white/[0.05] pt-2">
                    <span className="flex-1 rounded-lg border border-[hsl(225_100%_78%/0.25)] py-1.5 text-center text-[11px] font-semibold text-[#aebcff]">
                        Zaplanuj
                    </span>
                    <span className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.07] text-muted-foreground">
                        <Copy className="h-3.5 w-3.5" />
                    </span>
                </div>
            </div>
        </div>
    );
}

export function DraftsSidebar({
                                  drafts,
                                  isLoading = false,
                                  isCollapsed = false,
                                  onToggleCollapse,
                                  isMobileSheet = false,
                              }: DraftsSidebarProps) {
    const [search, setSearch] = useState('');
    const [platformFilter, setPlatformFilter] = useState<Platform | null>(null);

    const filteredDrafts = useMemo(() => {
        return drafts.filter(draft => {
            if (draft.status !== 'draft') return false;

            if (search) {
                const searchLower = search.toLowerCase();
                if (!draft.content?.toLowerCase().includes(searchLower)) {
                    return false;
                }
            }

            if (platformFilter && !hasAnyPlatform(draft, platformFilter)) {
                return false;
            }

            return true;
        });
    }, [drafts, search, platformFilter]);

    if (isCollapsed && !isMobileSheet) {
        return (
            <div className="w-12 border-l border-white/[0.06] bg-white/[0.015] flex flex-col items-center py-4">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggleCollapse}
                                className="mb-4 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">Rozwiń panel szkiców</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <div className="flex flex-col items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs font-medium writing-mode-vertical">
                        {filteredDrafts.length} szkiców
                    </span>
                </div>
            </div>
        );
    }

    const content = (
        <>
            <div className={cn("p-3 sm:p-4", !isMobileSheet && "border-b border-white/[0.06]")}>
                {!isMobileSheet && (
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="mono-label flex items-center gap-2 text-foreground/70">
                            SZKICE
                            {filteredDrafts.length > 0 && (
                                <Badge className="rounded-md bg-warning/16 px-2 py-0 text-[11px] font-semibold text-warning hover:bg-warning/16">
                                    {filteredDrafts.length}
                                </Badge>
                            )}
                        </h3>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggleCollapse}
                            className="h-8 w-8 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Szukaj..."
                        className="h-9 rounded-[11px] border-white/[0.06] bg-white/[0.03] pl-8 text-sm"
                    />
                    {search && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                            onClick={() => setSearch('')}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
                    <button
                        type="button"
                        onClick={() => setPlatformFilter(null)}
                        className={cn(
                            'flex-shrink-0 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors',
                            platformFilter === null
                                ? 'pill-active'
                                : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground'
                        )}
                    >
                        Wszystkie
                    </button>
                    {(Object.entries(PLATFORM_CONFIG) as [Platform, typeof PLATFORM_CONFIG.facebook][]).map(
                        ([platform, config]) => {
                            const Icon = config.icon;
                            const isActive = platformFilter === platform;
                            return (
                                <button
                                    key={platform}
                                    type="button"
                                    onClick={() => setPlatformFilter(isActive ? null : platform)}
                                    className={cn(
                                        'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
                                        !isActive && 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground'
                                    )}
                                    style={isActive ? { backgroundColor: config.color, color: '#fff' } : undefined}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                </button>
                            );
                        }
                    )}
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                            <span className="text-xs">Ładowanie...</span>
                        </div>
                    ) : filteredDrafts.length === 0 ? (
                        <div className="empty-state-card py-8">
                            <FileText className="h-8 w-8 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">
                                {drafts.filter(d => d.status === 'draft').length === 0
                                    ? 'Brak szkiców'
                                    : 'Brak wyników'}
                            </p>
                            <p className="text-xs text-muted-foreground -mt-2">
                                {drafts.filter(d => d.status === 'draft').length === 0
                                    ? 'Utwórz post w Kreatorze AI'
                                    : 'Zmień filtry wyszukiwania'}
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filteredDrafts.map((draft) => (
                                <motion.div
                                    key={draft.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    <DraggableDraftCard draft={draft} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {filteredDrafts.length > 0 && (
                    <div className="px-3 pb-3">
                        <div className="ai-card flex flex-col gap-2.5 p-3.5">
                            <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                                    <Sparkles className="h-3 w-3 text-white" />
                                </span>
                                <span className="text-[12.5px] font-semibold">Asystent AI</span>
                            </div>
                            <p className="text-xs leading-relaxed text-foreground/70">
                                Mogę zaplanować {filteredDrafts.length === 1 ? 'ten szkic' : 'te szkice'} automatycznie w najlepszych terminach.
                            </p>
                            <span className="rounded-[9px] border border-[hsl(225_100%_78%/0.25)] bg-primary/10 py-2 text-center text-xs font-semibold text-[#c3ccff] cursor-pointer transition-colors hover:bg-primary/[0.16]">
                                Zaplanuj szkice z AI
                            </span>
                        </div>
                    </div>
                )}
            </ScrollArea>

            <div className="p-3 border-t border-white/[0.06]">
                <p className="text-xs text-muted-foreground text-center">
                    Przeciągnij szkic na dzień w kalendarzu
                </p>
            </div>
        </>
    );

    if (isMobileSheet) {
        return <div className="flex flex-col h-full">{content}</div>;
    }

    return (
        <div className="w-72 border-l border-white/[0.06] bg-white/[0.012] flex flex-col">
            {content}
        </div>
    );
}

export default DraftsSidebar;