// src/app/(dashboard)/brands/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
    BrandsHeader,
    BrandsGrid,
    BrandFormModal,
    BrandDetailsPanel,
    EmptyState
} from '@/components/brands';
import { useBrandsStore } from '@/store/brands-store';
import { useBrandsManager } from '@/hooks/useBrands';
import { Loader2 } from 'lucide-react';

type SortOption = 'name' | 'date' | 'posts';
type ViewMode = 'grid' | 'list';

export default function BrandsPage() {
    const { selectedBrand, selectBrand } = useBrandsStore();
    const { brands, isLoading, isError, refetch } = useBrandsManager();

    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortBy, setSortBy] = useState<SortOption>('date');

    const filteredBrands = useMemo(() => {
        let result = [...brands];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (brand) =>
                    brand.name.toLowerCase().includes(query) ||
                    brand.description?.toLowerCase().includes(query) ||
                    brand.industry?.toLowerCase().includes(query)
            );
        }

        result.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'date':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'posts':
                    return (b.postsCount || 0) - (a.postsCount || 0);
                default:
                    return 0;
            }
        });

        return result;
    }, [brands, searchQuery, sortBy]);

    const hasNoBrands = brands.length === 0;
    const hasNoResults = filteredBrands.length === 0 && !hasNoBrands;

    const handleClearFilters = () => {
        setSearchQuery('');
    };

    const handleCloseDetails = () => {
        selectBrand(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[300px] xs:min-h-[400px]">
                <div className="flex flex-col items-center gap-3 xs:gap-4">
                    <Loader2 className="h-6 w-6 xs:h-8 xs:w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Ładowanie marek...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex items-center justify-center min-h-[300px] xs:min-h-[400px]">
                <div className="flex flex-col items-center gap-3 xs:gap-4 text-center px-4">
                    <div className="text-3xl xs:text-4xl">😕</div>
                    <h3 className="text-base xs:text-lg font-semibold">Nie udało się załadować marek</h3>
                    <p className="text-sm text-muted-foreground">
                        Sprawdź połączenie i spróbuj ponownie.
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                    >
                        Spróbuj ponownie
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            <BrandsHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                sortBy={sortBy}
                onSortChange={setSortBy}
            />

            {hasNoBrands ? (
                <EmptyState />
            ) : hasNoResults ? (
                <EmptyState isFiltered onClearFilters={handleClearFilters} />
            ) : (
                <BrandsGrid brands={filteredBrands} viewMode={viewMode} />
            )}

            <BrandFormModal />

            <AnimatePresence>
                {selectedBrand && (
                    <BrandDetailsPanel
                        brand={selectedBrand}
                        onClose={handleCloseDetails}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}