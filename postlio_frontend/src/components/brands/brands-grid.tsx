// src/components/brands/brands-grid.tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Brand } from '@/types/brand';
import { BrandCard } from './brand-card';

interface BrandsGridProps {
    brands: Brand[];
    viewMode: 'grid' | 'list';
}

export function BrandsGrid({ brands, viewMode }: BrandsGridProps) {
    return (
        <motion.div
            layout
            className={cn(
                "gap-3 xs:gap-4",
                viewMode === 'grid'
                    ? "grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3"
                    : "flex flex-col"
            )}
        >
            {brands.map((brand, index) => (
                <BrandCard key={brand.id} brand={brand} index={index} />
            ))}
        </motion.div>
    );
}