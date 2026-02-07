// src/components/brands/brand-card.tsx
'use client';

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    Copy,
    BarChart3,
    MessageSquare,
    ExternalLink,
    Star,
    Loader2,
    PenTool,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Brand, PERSONALITY_TRAITS, COMMUNICATION_STYLES } from '@/types/brand';
import { useBrandsStore } from '@/store/brands-store';
import { useDeleteBrand, useSetDefaultBrand } from '@/hooks/useBrands';

interface BrandCardProps {
    brand: Brand;
    index?: number;
}

export const BrandCard = memo(function BrandCard({ brand, index = 0 }: BrandCardProps) {
    const { openForm, selectBrand } = useBrandsStore();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const deleteBrand = useDeleteBrand({
        onSuccess: () => {
            setShowDeleteDialog(false);
        },
    });

    const setDefaultBrand = useSetDefaultBrand();

    const handleEdit = () => {
        openForm(brand.id);
    };

    const handleDelete = () => {
        deleteBrand.mutate(brand.id);
    };

    const handleSelect = () => {
        selectBrand(brand);
    };

    const handleSetDefault = () => {
        setDefaultBrand.mutate(brand.id);
    };

    const styleStrength = calculateStyleStrength(brand);

    const isDeleting = deleteBrand.isPending;
    const isSettingDefault = setDefaultBrand.isPending;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="group relative"
            >
                <div
                    className={cn(
                        "relative overflow-hidden rounded-xl border bg-card p-3 xs:p-4 sm:p-5",
                        "transition-all duration-300 hover:shadow-lg hover:border-primary/30",
                        brand.isDefault && "ring-2 ring-primary/50"
                    )}
                >
                    <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ backgroundColor: brand.primaryColor }}
                    />

                    {brand.isDefault && (
                        <div className="absolute top-2 xs:top-3 left-2 xs:left-3">
                            <Badge variant="default" className="bg-primary text-[10px] xs:text-xs px-1.5 xs:px-2">
                                <Star className="h-2.5 w-2.5 xs:h-3 xs:w-3 mr-0.5 xs:mr-1 fill-current" />
                                <span className="hidden xs:inline">Domyślna</span>
                                <span className="xs:hidden">Dom.</span>
                            </Badge>
                        </div>
                    )}

                    <div className={cn("flex items-start justify-between mb-3 xs:mb-4", brand.isDefault && "mt-5 xs:mt-6")}>
                        <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
                            {brand.logoUrl ? (
                                <div className="w-10 h-10 xs:w-12 xs:h-12 rounded-lg overflow-hidden relative flex-shrink-0">
                                    <Image
                                        src={brand.logoUrl}
                                        alt={brand.name}
                                        fill
                                        className="object-cover"
                                        sizes="48px"
                                    />
                                </div>
                            ) : (
                                <div
                                    className="w-10 h-10 xs:w-12 xs:h-12 rounded-lg flex items-center justify-center text-white font-bold text-base xs:text-lg flex-shrink-0"
                                    style={{ backgroundColor: brand.primaryColor }}
                                >
                                    {brand.name.charAt(0).toUpperCase()}
                                </div>
                            )}

                            <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-base xs:text-lg truncate">{brand.name}</h3>
                                {brand.industry && (
                                    <p className="text-xs xs:text-sm text-muted-foreground truncate">{brand.industry}</p>
                                )}
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 xs:h-10 xs:w-10 sm:h-9 sm:w-9 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={handleEdit}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edytuj
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleSelect}>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Szczegóły
                                </DropdownMenuItem>
                                {!brand.isDefault && (
                                    <DropdownMenuItem onClick={handleSetDefault} disabled={isSettingDefault}>
                                        {isSettingDefault ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Star className="h-4 w-4 mr-2" />
                                        )}
                                        Ustaw jako domyślną
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplikuj
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="text-destructive"
                                    disabled={brand.isDefault}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Usuń
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {brand.description && (
                        <p className="text-xs xs:text-sm text-muted-foreground mb-3 xs:mb-4 line-clamp-2">
                            {brand.description}
                        </p>
                    )}

                    <div className="space-y-2 xs:space-y-3 mb-3 xs:mb-4">
                        <div className="flex flex-wrap gap-1 xs:gap-1.5">
                            {brand.voiceDNA.personalityTraits.slice(0, 2).map((trait) => (
                                <Badge
                                    key={trait}
                                    variant="secondary"
                                    className="text-[10px] xs:text-xs px-1.5 xs:px-2"
                                >
                                    {PERSONALITY_TRAITS[trait]?.icon} <span className="hidden xs:inline ml-1">{PERSONALITY_TRAITS[trait]?.label}</span>
                                </Badge>
                            ))}
                            {brand.voiceDNA.personalityTraits.length > 2 && (
                                <Badge variant="outline" className="text-[10px] xs:text-xs px-1.5">
                                    +{brand.voiceDNA.personalityTraits.length - 2}
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-xs xs:text-sm">
                            <MessageSquare className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground truncate">
                                {COMMUNICATION_STYLES[brand.voiceDNA.communicationStyle]?.label || 'Informacyjny'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <PenTool className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-violet-500 flex-shrink-0" />
                            <div className="flex-1 h-1.5 xs:h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${styleStrength}%` }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                    className="h-full bg-gradient-to-r from-violet-500 to-primary rounded-full"
                                />
                            </div>
                            <span className="text-[10px] xs:text-xs text-muted-foreground">{styleStrength}%</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 xs:pt-4 border-t">
                        <div className="flex items-center gap-2 xs:gap-4 text-xs xs:text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <BarChart3 className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                                <span>{brand.postsCount || 0}</span>
                                <span className="hidden xs:inline">postów</span>
                            </div>
                        </div>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEdit}
                            className="h-8 xs:h-9 text-xs xs:text-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        >
                            <PenTool className="h-3.5 w-3.5 xs:h-4 xs:w-4 mr-1 xs:mr-2" />
                            <span className="hidden xs:inline">Styl pisania</span>
                            <span className="xs:hidden">Styl</span>
                        </Button>
                    </div>

                    {brand.isActive && !brand.isDefault && (
                        <div className="absolute top-2 xs:top-3 right-2 xs:right-3">
                            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        </div>
                    )}
                </div>
            </motion.div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="mx-4 max-w-[calc(100vw-2rem)] sm:max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base xs:text-lg">Czy na pewno chcesz usunąć tę markę?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            Usunięcie marki <strong>&quot;{brand.name}&quot;</strong> jest nieodwracalne.
                            Wszystkie ustawienia Stylu pisania zostaną utracone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col xs:flex-row gap-2">
                        <AlertDialogCancel disabled={isDeleting} className="w-full xs:w-auto">Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full xs:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Usuwanie...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Usuń markę
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
});

function calculateStyleStrength(brand: Brand): number {
    let score = 0;
    const dna = brand.voiceDNA;

    if (!dna) return 0;

    score += Math.min((dna.personalityTraits?.length || 0) * 5, 20);
    score += Math.min((dna.keywords?.length || 0) * 3, 15);
    score += Math.min((dna.hashtags?.length || 0) * 3, 15);
    score += Math.min((dna.samplePosts?.length || 0) * 5, 20);

    const toneConfigured = [dna.toneFormality, dna.toneEnergy, dna.toneHumor, dna.toneEmotion]
        .filter(t => t !== undefined && t !== 50).length;
    score += toneConfigured * 5;

    score += Math.min((dna.preferredEmojis?.length || 0) * 2, 10);

    return Math.min(score, 100);
}