// src/components/saved-posts/saved-posts-list.tsx
/**
 * Lista zapisanych postów z obsługą bulk actions
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
import type { Post } from '@/types';

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

function filterPosts(posts: Post[], filters: FiltersType): Post[] {
    return posts.filter(post => {
        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesContent = post.content.toLowerCase().includes(searchLower);
            const matchesHashtags = post.hashtags?.some(tag =>
                tag.toLowerCase().includes(searchLower)
            );
            if (!matchesContent && !matchesHashtags) return false;
        }

        // Platform filter
        if (filters.platforms.length > 0 && !filters.platforms.includes(post.platform)) {
            return false;
        }

        // Status filter
        if (filters.statuses.length > 0 && !filters.statuses.includes(post.status)) {
            return false;
        }

        // Brand filter
        if (filters.brandId && String(post.brand_id) !== filters.brandId) {
            return false;
        }

        // AI generated filter
        if (filters.aiGenerated !== undefined && post.ai_generated !== filters.aiGenerated) {
            return false;
        }

        // Has image filter
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
                a.content.localeCompare(b.content, 'pl')
            );
        case 'platform':
            return sorted.sort((a, b) =>
                a.platform.localeCompare(b.platform)
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
    // State
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

    // Filtered and sorted posts
    const filteredPosts = useMemo(() => {
        const filtered = filterPosts(posts, filters);
        return sortPosts(filtered, filters.sortBy);
    }, [posts, filters]);

    // Selection handlers
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

    // Handler dla checkbox "zaznacz wszystko" - z prawidłowym typem
    const handleSelectAllCheckedChange = (checked: boolean | 'indeterminate') => {
        if (typeof checked === 'boolean') {
            handleSelectAll();
        }
    };

    // Bulk delete handler
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

    // Bulk schedule handler
    const handleBulkSchedule = useCallback(() => {
        if (!onBulkSchedule || selectedIds.size === 0) return;
        onBulkSchedule(Array.from(selectedIds));
    }, [onBulkSchedule, selectedIds]);

    const isAllSelected = filteredPosts.length > 0 && selectedIds.size === filteredPosts.length;
    const hasSelection = selectedIds.size > 0;

    return (
        <div className="space-y-6">
            {/* Filters */}
            <SavedPostsFilters
                filters={filters}
                onFiltersChange={setFilters}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                brands={brands}
                totalCount={posts.length}
                filteredCount={filteredPosts.length}
            />

            {/* Bulk actions bar */}
            <AnimatePresence>
                {hasSelection && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20"
                    >
                        <div className="flex items-center gap-3">
                            <Checkbox
                                checked={isAllSelected}
                                onCheckedChange={handleSelectAllCheckedChange}
                            />
                            <span className="text-sm font-medium">
                Zaznaczono {selectedIds.size} {selectedIds.size === 1 ? 'post' : 'postów'}
              </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBulkSchedule}
                                className="gap-2"
                            >
                                <Calendar className="h-4 w-4" />
                                Zaplanuj wszystkie
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDeleteDialog(true)}
                                className="gap-2 text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                                Usuń
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearSelection}
                            >
                                Anuluj
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading state */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Ładowanie materiałów...</p>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && filteredPosts.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                >
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">
                        {posts.length === 0 ? 'Brak zapisanych materiałów' : 'Brak wyników'}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        {posts.length === 0
                            ? 'Stwórz swój pierwszy post w Kreatorze AI, a pojawi się tutaj jako szkic.'
                            : 'Spróbuj zmienić filtry lub wyszukiwaną frazę.'}
                    </p>
                </motion.div>
            )}

            {/* Posts grid/list */}
            {!isLoading && filteredPosts.length > 0 && (
                <motion.div
                    layout
                    className={cn(
                        viewMode === 'grid'
                            ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                            : 'flex flex-col gap-3'
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
                </motion.div>
            )}

            {/* Delete confirmation dialog */}
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