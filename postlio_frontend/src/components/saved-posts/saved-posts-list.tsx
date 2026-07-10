// src/components/saved-posts/saved-posts-list.tsx
/**
 * Lista zapisanych postów z obsługą bulk actions
 *
 * ✅ NAPRAWIONE: Obsługa platforms[] zamiast platform
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trash2,
    Calendar,
    FileText,
    Loader2,
} from 'lucide-react';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { SavedPostCard } from './saved-post-card';
import { SavedPostsFilters, type SavedPostsFilters as FiltersType, type ViewMode, type SortOption } from './saved-posts-filters';
import { cn } from '@/lib/utils';
import type { Platform } from '@/types';
import type { Post } from '@/types/post';

// ============================================================
// TYPY
// ============================================================

interface SavedPostsListProps {
    posts: Post[];
    isLoading?: boolean;
    brands?: Array<{ id: string | number; name: string; primaryColor?: string }>;
    onEdit?: (post: Post) => void;
    onSchedule?: (post: Post) => void;
    onPublish?: (post: Post) => void;
    onDelete?: (post: Post) => void;
    onDuplicate?: (post: Post) => void;
    onBulkDelete?: (postIds: (string | number)[]) => Promise<void>;
    onBulkSchedule?: (postIds: (string | number)[]) => void;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Sprawdź czy post zawiera którąkolwiek z platform
 */
function postHasPlatform(post: Post, platforms: Platform[]): boolean {
    if (platforms.length === 0) return true;

    if (post.platforms && post.platforms.length > 0) {
        return post.platforms.some(p => platforms.includes(p));
    }

    if (post.platform) {
        return platforms.includes(post.platform);
    }

    return false;
}

/**
 * Pobierz pierwszą platformę z posta (do sortowania)
 */
function getPrimaryPlatform(post: Post): string {
    if (post.platforms && post.platforms.length > 0) {
        return post.platforms[0];
    }
    return post.platform || 'facebook';
}

function filterPosts(posts: Post[], filters: FiltersType): Post[] {
    return posts.filter(post => {
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesContent = post.content?.toLowerCase().includes(searchLower) || false;
            const matchesHashtags = post.hashtags?.some(tag =>
                tag.toLowerCase().includes(searchLower)
            );
            if (!matchesContent && !matchesHashtags) return false;
        }

        if (filters.platforms.length > 0 && !postHasPlatform(post, filters.platforms)) {
            return false;
        }

        if (filters.statuses.length > 0 && !filters.statuses.includes(post.status)) {
            return false;
        }

        if (filters.brandId && String(post.brand_id) !== filters.brandId) {
            return false;
        }

        if (filters.aiGenerated !== undefined && post.ai_generated !== filters.aiGenerated) {
            return false;
        }

        if (filters.hasImage !== undefined) {
            const hasImage = !!post.image_url;
            if (hasImage !== filters.hasImage) return false;
        }

        return true;
    });
}

function sortPosts(posts: Post[], sortBy: SortOption): Post[] {
    const sorted = [...posts];

    switch (sortBy) {
        case 'newest':
            return sorted.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
        case 'oldest':
            return sorted.sort((a, b) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
        case 'alphabetical':
            return sorted.sort((a, b) =>
                (a.content || '').localeCompare(b.content || '', 'pl')
            );
        case 'platform':
            return sorted.sort((a, b) =>
                getPrimaryPlatform(a).localeCompare(getPrimaryPlatform(b))
            );
        default:
            return sorted;
    }
}

// ============================================================
// KOMPONENT
// ============================================================

export function SavedPostsList({
                                   posts,
                                   isLoading = false,
                                   brands = [],
                                   onEdit,
                                   onSchedule,
                                   onPublish,
                                   onDelete,
                                   onDuplicate,
                                   onBulkDelete,
                                   onBulkSchedule,
                               }: SavedPostsListProps) {
    const router = useRouter();
    const [filters, setFilters] = useState<FiltersType>({
        search: '',
        platforms: [],
        statuses: [],
        brandId: undefined,
        aiGenerated: undefined,
        hasImage: undefined,
        sortBy: 'newest',
    });
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const filteredPosts = useMemo(() => {
        const filtered = filterPosts(posts, filters);
        return sortPosts(filtered, filters.sortBy);
    }, [posts, filters]);

    const handleSelect = useCallback((id: string | number, selected: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (selected) {
                next.add(id);
            } else {
                next.delete(id);
            }
            return next;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        if (selectedIds.size === filteredPosts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredPosts.map(p => p.id)));
        }
    }, [filteredPosts, selectedIds.size]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const handleSelectAllCheckedChange = (checked: boolean | 'indeterminate') => {
        if (typeof checked === 'boolean') {
            handleSelectAll();
        }
    };

    const handleBulkDelete = useCallback(async () => {
        if (!onBulkDelete || selectedIds.size === 0) return;

        setIsDeleting(true);
        try {
            await onBulkDelete(Array.from(selectedIds));
            clearSelection();
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    }, [onBulkDelete, selectedIds, clearSelection]);

    const handleBulkSchedule = useCallback(() => {
        if (!onBulkSchedule || selectedIds.size === 0) return;
        onBulkSchedule(Array.from(selectedIds));
    }, [onBulkSchedule, selectedIds]);

    const isAllSelected = filteredPosts.length > 0 && selectedIds.size === filteredPosts.length;
    const hasSelection = selectedIds.size > 0;

    return (
        <div className="space-y-4 sm:space-y-6">
            <SavedPostsFilters
                filters={filters}
                onFiltersChange={setFilters}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                brands={brands}
                totalCount={posts.length}
                filteredCount={filteredPosts.length}
            />

            <AnimatePresence>
                {hasSelection && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2.5 xs:gap-3 p-3 rounded-[14px] bg-primary/[0.06] border border-primary/20"
                    >
                        <div className="flex items-center gap-2.5 sm:gap-3">
                            <Checkbox
                                checked={isAllSelected}
                                onCheckedChange={handleSelectAllCheckedChange}
                            />
                            <span className="text-xs sm:text-sm font-medium">
                                Zaznaczono {selectedIds.size} {selectedIds.size === 1 ? 'post' : 'postów'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 w-full xs:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBulkSchedule}
                                className="gap-1.5 sm:gap-2 flex-1 xs:flex-initial text-xs sm:text-sm"
                            >
                                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="hidden xs:inline">Zaplanuj</span>
                                <span className="xs:hidden">Zaplanuj</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDeleteDialog(true)}
                                className="gap-1.5 sm:gap-2 text-destructive hover:text-destructive flex-1 xs:flex-initial text-xs sm:text-sm"
                            >
                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                Usuń
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearSelection}
                                className="text-xs sm:text-sm flex-shrink-0"
                            >
                                Anuluj
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isLoading && (
                <div className="flex items-center justify-center py-8 sm:py-12">
                    <div className="flex flex-col items-center gap-3 sm:gap-4">
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                        <p className="text-xs sm:text-sm text-muted-foreground">Ładowanie materiałów...</p>
                    </div>
                </div>
            )}

            {!isLoading && filteredPosts.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="empty-state-card"
                >
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                        <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground" />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-medium mb-1">
                            {posts.length === 0 ? 'Brak zapisanych materiałów' : 'Brak wyników'}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
                            {posts.length === 0
                                ? 'Stwórz swój pierwszy post w Kreatorze AI, a pojawi się tutaj jako szkic.'
                                : 'Spróbuj zmienić filtry lub wyszukiwaną frazę.'}
                        </p>
                    </div>
                </motion.div>
            )}

            {!isLoading && filteredPosts.length > 0 && (
                <motion.div
                    layout
                    className={cn(
                        viewMode === 'grid'
                            ? 'grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                            : 'flex flex-col gap-2.5 sm:gap-3'
                    )}
                >
                    <AnimatePresence mode="popLayout">
                        {filteredPosts.map((post) => (
                            <SavedPostCard
                                key={post.id}
                                post={post}
                                isSelected={selectedIds.has(post.id)}
                                onSelect={handleSelect}
                                onEdit={onEdit}
                                onSchedule={onSchedule}
                                onPublish={onPublish}
                                onDelete={onDelete}
                                onDuplicate={onDuplicate}
                            />
                        ))}
                    </AnimatePresence>

                    {viewMode === 'grid' && (
                        <button
                            type="button"
                            onClick={() => router.push('/creator')}
                            className="dashed-slot flex min-h-[220px] flex-col items-center justify-center gap-3 transition-colors hover:bg-primary/[0.07]"
                        >
                            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-primary/25 bg-gradient-to-br from-primary/[0.18] to-accent/[0.14] text-primary">
                                <Plus className="h-5 w-5" />
                            </span>
                            <div className="text-center">
                                <div className="text-[13.5px] font-semibold">Stwórz nowy post</div>
                                <div className="text-xs text-muted-foreground mt-0.5">z Kreatorem AI</div>
                            </div>
                        </button>
                    )}
                </motion.div>
            )}

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Usuń zaznaczone posty?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Zamierzasz usunąć {selectedIds.size} {selectedIds.size === 1 ? 'post' : 'postów'}.
                            Ta akcja jest nieodwracalna.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBulkDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Usuwanie...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Usuń
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default SavedPostsList;