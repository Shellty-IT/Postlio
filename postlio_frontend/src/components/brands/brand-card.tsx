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
    Sparkles,
    ExternalLink,
    Star,
    Loader2,
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

    // API hooks
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

    // Oblicz "siłę" Voice DNA (jak dobrze jest skonfigurowany)
    const voiceStrength = calculateVoiceStrength(brand);

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
                        "relative overflow-hidden rounded-xl border bg-card p-5",
                        "transition-all duration-300 hover:shadow-lg hover:border-primary/30",
                        brand.isDefault && "ring-2 ring-primary/50"
                    )}
                >
                    {/* Color accent bar */}
                    <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ backgroundColor: brand.primaryColor }}
                    />

                    {/* Default badge */}
                    {brand.isDefault && (
                        <div className="absolute top-3 left-3">
                            <Badge variant="default" className="bg-primary text-xs">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                Domyślna
                            </Badge>
                        </div>
                    )}

                    {/* Header */}
                    <div className={cn("flex items-start justify-between mb-4", brand.isDefault && "mt-6")}>
                        <div className="flex items-center gap-3">
                            {/* Logo/Avatar */}
                            {brand.logoUrl ? (
                                <div className="w-12 h-12 rounded-lg overflow-hidden relative">
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
                                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                                    style={{ backgroundColor: brand.primaryColor }}
                                >
                                    {brand.name.charAt(0).toUpperCase()}
                                </div>
                            )}

                            <div>
                                <h3 className="font-semibold text-lg">{brand.name}</h3>
                                {brand.industry && (
                                    <p className="text-sm text-muted-foreground">{brand.industry}</p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
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

                    {/* Description */}
                    {brand.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {brand.description}
                        </p>
                    )}

                    {/* Voice DNA Preview */}
                    <div className="space-y-3 mb-4">
                        {/* Personality Traits */}
                        <div className="flex flex-wrap gap-1.5">
                            {brand.voiceDNA.personalityTraits.slice(0, 3).map((trait) => (
                                <Badge
                                    key={trait}
                                    variant="secondary"
                                    className="text-xs"
                                >
                                    {PERSONALITY_TRAITS[trait]?.icon} {PERSONALITY_TRAITS[trait]?.label}
                                </Badge>
                            ))}
                            {brand.voiceDNA.personalityTraits.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    +{brand.voiceDNA.personalityTraits.length - 3}
                                </Badge>
                            )}
                        </div>

                        {/* Communication Style */}
                        <div className="flex items-center gap-2 text-sm">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                                {COMMUNICATION_STYLES[brand.voiceDNA.communicationStyle]?.label || 'Informacyjny'}
                            </span>
                        </div>

                        {/* Voice DNA Strength */}
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-violet-500" />
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${voiceStrength}%` }}
                                    transition={{ delay: 0.3, duration: 0.5 }}
                                    className="h-full bg-gradient-to-r from-violet-500 to-primary rounded-full"
                                />
                            </div>
                            <span className="text-xs text-muted-foreground">{voiceStrength}%</span>
                        </div>
                    </div>

                    {/* Footer Stats */}
                    <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <BarChart3 className="h-4 w-4" />
                                <span>{brand.postsCount || 0} postów</span>
                            </div>
                        </div>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEdit}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Voice DNA
                        </Button>
                    </div>

                    {/* Active indicator */}
                    {brand.isActive && !brand.isDefault && (
                        <div className="absolute top-3 right-3">
                            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Czy na pewno chcesz usunąć tę markę?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Usunięcie marki <strong>&quot;{brand.name}&quot;</strong> jest nieodwracalne.
                            Wszystkie ustawienia Voice DNA zostaną utracone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
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

// Helper function to calculate voice DNA strength
function calculateVoiceStrength(brand: Brand): number {
    let score = 0;
    const dna = brand.voiceDNA;

    if (!dna) return 0;

    // Personality traits (max 20 points)
    score += Math.min((dna.personalityTraits?.length || 0) * 5, 20);

    // Keywords (max 15 points)
    score += Math.min((dna.keywords?.length || 0) * 3, 15);

    // Hashtags (max 15 points)
    score += Math.min((dna.hashtags?.length || 0) * 3, 15);

    // Sample posts (max 20 points)
    score += Math.min((dna.samplePosts?.length || 0) * 5, 20);

    // Tone settings configured (max 20 points)
    const toneConfigured = [dna.toneFormality, dna.toneEnergy, dna.toneHumor, dna.toneEmotion]
        .filter(t => t !== undefined && t !== 50).length;
    score += toneConfigured * 5;

    // Preferred emojis (max 10 points)
    score += Math.min((dna.preferredEmojis?.length || 0) * 2, 10);

    return Math.min(score, 100);
}