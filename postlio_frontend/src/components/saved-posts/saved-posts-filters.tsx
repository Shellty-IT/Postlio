// src/components/saved-posts/saved-posts-filters.tsx
/**
 * Filtry i wyszukiwarka dla zapisanych postów
 */

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    X,
    SortAsc,
    SortDesc,
    Facebook,
    Instagram,
    Linkedin,
    Calendar,
    Sparkles,
    LayoutGrid,
    List,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Platform, PostStatus } from '@/types';

// ============================================================
// TYPY
// ============================================================

export type SortOption = 'newest' | 'oldest' | 'alphabetical' | 'platform';
export type ViewMode = 'grid' | 'list';

export interface SavedPostsFilters {
    search: string;
    platforms: Platform[];
    statuses: PostStatus[];
    brandId?: string;
    aiGenerated?: boolean;
    hasImage?: boolean;
    sortBy: SortOption;
}

interface SavedPostsFiltersProps {
    filters: SavedPostsFilters;
    onFiltersChange: (filters: SavedPostsFilters) => void;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    brands?: Array<{ id: string | number; name: string; primaryColor?: string }>;
    totalCount?: number;
    filteredCount?: number;
}

// ============================================================
// KONFIGURACJA
// ============================================================

const PLATFORM_OPTIONS: Array<{ value: Platform; label: string; icon: typeof Facebook; color: string }> = [
    { value: 'facebook', label: 'Facebook', icon: Facebook, color: '#1877F2' },
    { value: 'instagram', label: 'Instagram', icon: Instagram, color: '#E4405F' },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
];

const STATUS_OPTIONS: Array<{ value: PostStatus; label: string }> = [
    { value: 'draft', label: 'Szkice' },
    { value: 'scheduled', label: 'Zaplanowane' },
    { value: 'published', label: 'Opublikowane' },
    { value: 'failed', label: 'Błędy' },
];

const SORT_OPTIONS: Array<{ value: SortOption; label: string; icon: typeof SortAsc }> = [
    { value: 'newest', label: 'Najnowsze', icon: SortDesc },
    { value: 'oldest', label: 'Najstarsze', icon: SortAsc },
    { value: 'alphabetical', label: 'Alfabetycznie', icon: SortAsc },
    { value: 'platform', label: 'Platforma', icon: SortAsc },
];

// ============================================================
// KOMPONENT
// ============================================================

export function SavedPostsFilters({
                                      filters,
                                      onFiltersChange,
                                      viewMode,
                                      onViewModeChange,
                                      brands = [],
                                      totalCount = 0,
                                      filteredCount = 0,
                                  }: SavedPostsFiltersProps) {
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Liczba aktywnych filtrów (bez search i sort)
    const activeFiltersCount =
        filters.platforms.length +
        filters.statuses.length +
        (filters.brandId ? 1 : 0) +
        (filters.aiGenerated !== undefined ? 1 : 0) +
        (filters.hasImage !== undefined ? 1 : 0);

    // Handler zmiany search z debounce
    const handleSearchChange = useCallback((value: string) => {
        onFiltersChange({ ...filters, search: value });
    }, [filters, onFiltersChange]);

    // Toggle platform filter
    const togglePlatform = useCallback((platform: Platform) => {
        const newPlatforms = filters.platforms.includes(platform)
            ? filters.platforms.filter(p => p !== platform)
            : [...filters.platforms, platform];
        onFiltersChange({ ...filters, platforms: newPlatforms });
    }, [filters, onFiltersChange]);

    // Toggle status filter
    const toggleStatus = useCallback((status: PostStatus) => {
        const newStatuses = filters.statuses.includes(status)
            ? filters.statuses.filter(s => s !== status)
            : [...filters.statuses, status];
        onFiltersChange({ ...filters, statuses: newStatuses });
    }, [filters, onFiltersChange]);

    // Clear all filters
    const clearFilters = useCallback(() => {
        onFiltersChange({
            search: '',
            platforms: [],
            statuses: [],
            brandId: undefined,
            aiGenerated: undefined,
            hasImage: undefined,
            sortBy: 'newest',
        });
    }, [onFiltersChange]);

    // Check if any filter is active
    const hasActiveFilters = filters.search || activeFiltersCount > 0;

    return (
        <div className="space-y-4">
            {/* Main toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={filters.search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Szukaj w treści postów..."
                        className="pl-9 pr-9"
                    />
                    {filters.search && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => handleSearchChange('')}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Quick platform filters */}
                <div className="flex items-center gap-2">
                    {PLATFORM_OPTIONS.map(({ value, icon: Icon, color }) => (
                        <Button
                            key={value}
                            variant={filters.platforms.includes(value) ? 'default' : 'outline'}
                            size="icon"
                            className={cn(
                                'h-9 w-9 transition-all',
                                filters.platforms.includes(value) && 'text-white'
                            )}
                            style={filters.platforms.includes(value) ? { backgroundColor: color } : undefined}
                            onClick={() => togglePlatform(value)}
                        >
                            <Icon className="h-4 w-4" />
                        </Button>
                    ))}
                </div>

                {/* Advanced filters dropdown */}
                <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Filtry
                            {activeFiltersCount > 0 && (
                                <Badge
                                    variant="secondary"
                                    className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground"
                                >
                                    {activeFiltersCount}
                                </Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Filtry zaawansowane</h4>
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={clearFilters}
                                    >
                                        Wyczyść wszystko
                                    </Button>
                                )}
                            </div>

                            {/* Status filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Status</label>
                                <div className="flex flex-wrap gap-2">
                                    {STATUS_OPTIONS.map(({ value, label }) => (
                                        <Button
                                            key={value}
                                            variant={filters.statuses.includes(value) ? 'default' : 'outline'}
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => toggleStatus(value)}
                                        >
                                            {label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Brand filter */}
                            {brands.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Marka</label>
                                    <Select
                                        value={filters.brandId || 'all'}
                                        onValueChange={(value) =>
                                            onFiltersChange({ ...filters, brandId: value === 'all' ? undefined : value })
                                        }
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Wszystkie marki" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Wszystkie marki</SelectItem>
                                            {brands.map((brand) => (
                                                <SelectItem key={brand.id} value={String(brand.id)}>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-3 w-3 rounded-full"
                                                            style={{ backgroundColor: brand.primaryColor || '#8B5CF6' }}
                                                        />
                                                        {brand.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Additional filters */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Dodatkowe</label>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant={filters.aiGenerated === true ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-7 text-xs gap-1"
                                        onClick={() =>
                                            onFiltersChange({
                                                ...filters,
                                                aiGenerated: filters.aiGenerated === true ? undefined : true
                                            })
                                        }
                                    >
                                        <Sparkles className="h-3 w-3" />
                                        Tylko AI
                                    </Button>
                                    <Button
                                        variant={filters.hasImage === true ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-7 text-xs gap-1"
                                        onClick={() =>
                                            onFiltersChange({
                                                ...filters,
                                                hasImage: filters.hasImage === true ? undefined : true
                                            })
                                        }
                                    >
                                        <Calendar className="h-3 w-3" />
                                        Z obrazem
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Sort */}
                <Select
                    value={filters.sortBy}
                    onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value as SortOption })}
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                            <SelectItem key={value} value={value}>
                                <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* View mode toggle */}
                <div className="flex items-center rounded-lg border bg-muted p-1">
                    <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onViewModeChange('grid')}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onViewModeChange('list')}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Active filters badges */}
            <AnimatePresence>
                {hasActiveFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap items-center gap-2"
                    >
            <span className="text-sm text-muted-foreground">
              {filteredCount} z {totalCount} materiałów
            </span>

                        <div className="h-4 w-px bg-border" />

                        {filters.search && (
                            <Badge variant="secondary" className="gap-1">
                                Szukaj: &quot;{filters.search}&quot;
                                <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => handleSearchChange('')}
                                />
                            </Badge>
                        )}

                        {filters.platforms.map(platform => {
                            const config = PLATFORM_OPTIONS.find(p => p.value === platform);
                            return config ? (
                                <Badge
                                    key={platform}
                                    variant="secondary"
                                    className="gap-1"
                                    style={{ backgroundColor: `${config.color}20`, color: config.color }}
                                >
                                    <config.icon className="h-3 w-3" />
                                    {config.label}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => togglePlatform(platform)}
                                    />
                                </Badge>
                            ) : null;
                        })}

                        {filters.statuses.map(status => {
                            const config = STATUS_OPTIONS.find(s => s.value === status);
                            return config ? (
                                <Badge key={status} variant="secondary" className="gap-1">
                                    {config.label}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => toggleStatus(status)}
                                    />
                                </Badge>
                            ) : null;
                        })}

                        {filters.aiGenerated && (
                            <Badge variant="secondary" className="gap-1 bg-violet-500/10 text-violet-600">
                                <Sparkles className="h-3 w-3" />
                                AI
                                <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => onFiltersChange({ ...filters, aiGenerated: undefined })}
                                />
                            </Badge>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-muted-foreground"
                            onClick={clearFilters}
                        >
                            Wyczyść filtry
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default SavedPostsFilters;