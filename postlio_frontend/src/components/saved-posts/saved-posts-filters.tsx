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

    const activeFiltersCount =
        filters.platforms.length +
        filters.statuses.length +
        (filters.brandId ? 1 : 0) +
        (filters.aiGenerated !== undefined ? 1 : 0) +
        (filters.hasImage !== undefined ? 1 : 0);

    const handleSearchChange = useCallback((value: string) => {
        onFiltersChange({ ...filters, search: value });
    }, [filters, onFiltersChange]);

    const togglePlatform = useCallback((platform: Platform) => {
        const newPlatforms = filters.platforms.includes(platform)
            ? filters.platforms.filter(p => p !== platform)
            : [...filters.platforms, platform];
        onFiltersChange({ ...filters, platforms: newPlatforms });
    }, [filters, onFiltersChange]);

    const toggleStatus = useCallback((status: PostStatus) => {
        const newStatuses = filters.statuses.includes(status)
            ? filters.statuses.filter(s => s !== status)
            : [...filters.statuses, status];
        onFiltersChange({ ...filters, statuses: newStatuses });
    }, [filters, onFiltersChange]);

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

    const hasActiveFilters = filters.search || activeFiltersCount > 0;

    return (
        <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col gap-2.5 sm:gap-3">
                <div className="relative max-w-full sm:max-w-[340px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={filters.search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Szukaj w treści postów..."
                        className="rounded-xl border-white/[0.06] bg-white/[0.03] pl-9 pr-9 focus-visible:ring-primary/40"
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

                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 xs:gap-2">
                        <button
                            type="button"
                            onClick={() => onFiltersChange({ ...filters, platforms: [] })}
                            className={cn(
                                'rounded-[9px] px-3.5 py-2 text-xs sm:text-[12.5px] font-semibold transition-all',
                                filters.platforms.length === 0
                                    ? 'pill-active'
                                    : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground'
                            )}
                        >
                            Wszystkie
                        </button>
                        {PLATFORM_OPTIONS.map(({ value, icon: Icon }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => togglePlatform(value)}
                                className={cn(
                                    'flex h-8 w-8 xs:h-9 xs:w-9 items-center justify-center rounded-[9px] transition-all',
                                    filters.platforms.includes(value)
                                        ? cn('text-white', `platform-${value}`)
                                        : 'text-muted-foreground bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
                                )}
                            >
                                <Icon className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                            </button>
                        ))}
                    </div>

                    <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 sm:gap-2 h-8 xs:h-9 rounded-[10px] border-white/[0.08] bg-transparent text-xs sm:text-sm hover:bg-white/[0.05]"
                            >
                                <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="hidden xs:inline">Filtry</span>
                                {activeFiltersCount > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="ml-0.5 sm:ml-1 h-4 w-4 xs:h-5 xs:w-5 p-0 flex items-center justify-center text-[10px] xs:text-xs bg-primary text-primary-foreground"
                                    >
                                        {activeFiltersCount}
                                    </Badge>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] xs:w-80" align="end">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm">Filtry zaawansowane</h4>
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

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <div className="flex flex-wrap gap-1.5 xs:gap-2">
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

                    <div className="ml-auto hidden sm:block" />

                    <Select
                        value={filters.sortBy}
                        onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value as SortOption })}
                    >
                        <SelectTrigger className="w-[120px] xs:w-[140px] sm:w-[160px] h-8 xs:h-9 rounded-[10px] border-white/[0.08] bg-transparent text-xs sm:text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                                <SelectItem key={value} value={value}>
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        {label}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-1 rounded-[11px] border border-white/[0.06] bg-white/[0.03] p-1">
                        <button
                            type="button"
                            onClick={() => onViewModeChange('grid')}
                            className={cn(
                                'flex h-6 w-6 xs:h-[30px] xs:w-[30px] items-center justify-center rounded-lg transition-all',
                                viewMode === 'grid' ? 'pill-active' : 'text-muted-foreground hover:bg-white/[0.06]'
                            )}
                        >
                            <LayoutGrid className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewModeChange('list')}
                            className={cn(
                                'flex h-6 w-6 xs:h-[30px] xs:w-[30px] items-center justify-center rounded-lg transition-all',
                                viewMode === 'list' ? 'pill-active' : 'text-muted-foreground hover:bg-white/[0.06]'
                            )}
                        >
                            <List className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {hasActiveFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap items-center gap-1.5 xs:gap-2"
                    >
                        <span className="text-xs sm:text-sm text-muted-foreground">
                            {filteredCount} z {totalCount}
                        </span>

                        <div className="h-4 w-px bg-border" />

                        {filters.search && (
                            <Badge variant="secondary" className="gap-1 text-[10px] xs:text-xs">
                                <span className="hidden xs:inline">Szukaj:</span> &quot;{filters.search}&quot;
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
                                    className="gap-1 text-[10px] xs:text-xs"
                                    style={{ backgroundColor: `${config.color}20`, color: config.color }}
                                >
                                    <config.icon className="h-3 w-3" />
                                    <span className="hidden xs:inline">{config.label}</span>
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
                                <Badge key={status} variant="secondary" className="gap-1 text-[10px] xs:text-xs">
                                    {config.label}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => toggleStatus(status)}
                                    />
                                </Badge>
                            ) : null;
                        })}

                        {filters.aiGenerated && (
                            <Badge variant="secondary" className="gap-1 bg-accent/10 text-accent text-[10px] xs:text-xs">
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
                            className="h-6 text-[10px] xs:text-xs text-muted-foreground"
                            onClick={clearFilters}
                        >
                            Wyczyść
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default SavedPostsFilters;