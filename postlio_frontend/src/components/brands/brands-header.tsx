// src/components/brands/brands-header.tsx
'use client';

import { motion } from 'framer-motion';
import { Plus, Search, Filter, LayoutGrid, List, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useBrandsStore } from '@/store/brands-store';
import { useBrandsManager } from '@/hooks/useBrands';

interface BrandsHeaderProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
    sortBy: 'name' | 'date' | 'posts';
    onSortChange: (sort: 'name' | 'date' | 'posts') => void;
}

export function BrandsHeader({
                                 searchQuery,
                                 onSearchChange,
                                 viewMode,
                                 onViewModeChange,
                                 sortBy,
                                 onSortChange,
                             }: BrandsHeaderProps) {
    const { openForm } = useBrandsStore();
    const { brands, isLoading, refetch } = useBrandsManager();

    const activeBrands = brands.filter(b => b.isActive);

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 xs:space-y-4"
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Szukaj marek..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10 h-10 xs:h-11"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10 xs:h-11 px-3 xs:px-4 flex-shrink-0">
                                <Filter className="h-4 w-4 xs:mr-2" />
                                <span className="hidden xs:inline">Sortuj</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Sortuj według</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onSortChange('name')}
                                className={cn(sortBy === 'name' && 'bg-accent')}
                            >
                                Nazwy
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onSortChange('date')}
                                className={cn(sortBy === 'date' && 'bg-accent')}
                            >
                                Daty utworzenia
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onSortChange('posts')}
                                className={cn(sortBy === 'posts' && 'bg-accent')}
                            >
                                Liczby postów
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center bg-muted rounded-lg p-1 flex-shrink-0">
                        <button
                            onClick={() => onViewModeChange('grid')}
                            className={cn(
                                "p-2 xs:p-2.5 rounded-md transition-all min-h-[36px] min-w-[36px] flex items-center justify-center",
                                viewMode === 'grid'
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => onViewModeChange('list')}
                            className={cn(
                                "p-2 xs:p-2.5 rounded-md transition-all min-h-[36px] min-w-[36px] flex items-center justify-center",
                                viewMode === 'list'
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => refetch()}
                        disabled={isLoading}
                        title="Odśwież"
                        className="h-10 w-10 xs:h-11 xs:w-11 flex-shrink-0"
                    >
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>

                    <Button
                        onClick={() => openForm()}
                        className="h-10 xs:h-11 bg-gradient-to-r from-violet-600 to-primary hover:from-violet-500 hover:to-primary/90 flex-shrink-0"
                    >
                        <Plus className="h-4 w-4 xs:mr-2" />
                        <span className="hidden xs:inline">Nowa marka</span>
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2 xs:gap-4 text-xs xs:text-sm text-muted-foreground flex-wrap">
                <span>{brands.length} marek</span>
                <span className="hidden xs:inline">•</span>
                <span>{activeBrands.length} aktywnych</span>
                {brands.find(b => b.isDefault) && (
                    <>
                        <span className="hidden xs:inline">•</span>
                        <span className="text-primary truncate max-w-[150px] xs:max-w-none">
                            Domyślna: {brands.find(b => b.isDefault)?.name}
                        </span>
                    </>
                )}
            </div>
        </motion.div>
    );
}