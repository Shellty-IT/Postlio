// src/components/calendar/drafts-sidebar.tsx
/**
 * Sidebar z listą szkiców/draftów do przeciągnięcia na kalendarz
 */

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
import type { Post, Platform } from '@/types';

// ============================================================
// TYPY
// ============================================================

interface DraftsSidebarProps {
    drafts: Post[];
    isLoading?: boolean;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

interface DraggableDraftCardProps {
    draft: Post;
}

// ============================================================
// KONFIGURACJA PLATFORM
// ============================================================

const PLATFORM_CONFIG: Record<Platform, {
    icon: typeof Facebook;
    color: string;
    label: string;
}> = {
    facebook: { icon: Facebook, color: '#1877F2', label: 'FB' },
    instagram: { icon: Instagram, color: '#E4405F', label: 'IG' },
    linkedin: { icon: Linkedin, color: '#0A66C2', label: 'LI' },
};

// ============================================================
// DRAGGABLE DRAFT CARD
// ============================================================

function DraggableDraftCard({ draft }: DraggableDraftCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useDraggable({
        id: `draft-${draft.id}`,
        data: {
            type: 'draft',
            draft,
        },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
    };

    const platformConfig = PLATFORM_CONFIG[draft.platform];
    const PlatformIcon = platformConfig.icon;

    // Skrócona treść
    const truncatedContent = draft.content.length > 60
        ? `${draft.content.slice(0, 60)}...`
        : draft.content;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group relative rounded-lg border bg-card p-3 transition-all',
                'hover:shadow-md hover:border-primary/30',
                isDragging && 'opacity-50 shadow-lg ring-2 ring-primary z-50'
            )}
        >
            {/* Drag handle */}
            <div
                {...listeners}
                {...attributes}
                className={cn(
                    'absolute left-1 top-1/2 -translate-y-1/2 p-1 rounded cursor-grab',
                    'text-muted-foreground hover:text-foreground hover:bg-muted',
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    isDragging && 'cursor-grabbing opacity-100'
                )}
            >
                <GripVertical className="h-4 w-4" />
            </div>

            <div className="pl-5 space-y-2">
                {/* Header: Platform + AI badge */}
                <div className="flex items-center justify-between gap-2">
                    <div
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                            backgroundColor: `${platformConfig.color}15`,
                            color: platformConfig.color,
                        }}
                    >
                        <PlatformIcon className="h-3 w-3" />
                        {platformConfig.label}
                    </div>

                    <div className="flex items-center gap-1">
                        {draft.image_url && (
                            <ImageIcon className="h-3 w-3 text-muted-foreground" />
                        )}
                        {draft.ai_generated && (
                            <Sparkles className="h-3 w-3 text-violet-500" />
                        )}
                    </div>
                </div>

                {/* Content preview */}
                <p className="text-xs text-muted-foreground line-clamp-2">
                    {truncatedContent}
                </p>

                {/* Date */}
                <div className="text-[10px] text-muted-foreground">
                    {format(new Date(draft.created_at), 'd MMM', { locale: pl })}
                </div>
            </div>
        </div>
    );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function DraftsSidebar({
                                  drafts,
                                  isLoading = false,
                                  isCollapsed = false,
                                  onToggleCollapse,
                              }: DraftsSidebarProps) {
    const [search, setSearch] = useState('');
    const [platformFilter, setPlatformFilter] = useState<Platform | null>(null);

    // Filter drafts
    const filteredDrafts = useMemo(() => {
        return drafts.filter(draft => {
            // Only show drafts (not scheduled or published)
            if (draft.status !== 'draft') return false;

            // Search filter
            if (search) {
                const searchLower = search.toLowerCase();
                if (!draft.content.toLowerCase().includes(searchLower)) {
                    return false;
                }
            }

            // Platform filter
            if (platformFilter && draft.platform !== platformFilter) {
                return false;
            }

            return true;
        });
    }, [drafts, search, platformFilter]);

    // Collapsed state
    if (isCollapsed) {
        return (
            <div className="w-12 border-l bg-card flex flex-col items-center py-4">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggleCollapse}
                                className="mb-4"
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

    return (
        <div className="w-72 border-l bg-card flex flex-col">
            {/* Header */}
            <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Szkice
                        <Badge variant="secondary" className="text-xs">
                            {filteredDrafts.length}
                        </Badge>
                    </h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleCollapse}
                        className="h-8 w-8"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Szukaj..."
                        className="pl-8 h-8 text-sm"
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

                {/* Platform filters */}
                <div className="flex items-center gap-1 mt-2">
                    <Button
                        variant={platformFilter === null ? 'default' : 'ghost'}
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setPlatformFilter(null)}
                    >
                        Wszystkie
                    </Button>
                    {(Object.entries(PLATFORM_CONFIG) as [Platform, typeof PLATFORM_CONFIG.facebook][]).map(
                        ([platform, config]) => {
                            const Icon = config.icon;
                            return (
                                <Button
                                    key={platform}
                                    variant={platformFilter === platform ? 'default' : 'ghost'}
                                    size="icon"
                                    className={cn(
                                        'h-7 w-7',
                                        platformFilter === platform && 'text-white'
                                    )}
                                    style={platformFilter === platform ? { backgroundColor: config.color } : undefined}
                                    onClick={() => setPlatformFilter(platformFilter === platform ? null : platform)}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                </Button>
                            );
                        }
                    )}
                </div>
            </div>

            {/* Drafts list */}
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                            <span className="text-xs">Ładowanie...</span>
                        </div>
                    ) : filteredDrafts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
                            <p className="text-sm text-muted-foreground">
                                {drafts.filter(d => d.status === 'draft').length === 0
                                    ? 'Brak szkiców'
                                    : 'Brak wyników'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
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
            </ScrollArea>

            {/* Help text */}
            <div className="p-3 border-t bg-muted/30">
                <p className="text-xs text-muted-foreground text-center">
                    💡 Przeciągnij szkic na dzień w kalendarzu, aby go zaplanować
                </p>
            </div>
        </div>
    );
}

export default DraftsSidebar;