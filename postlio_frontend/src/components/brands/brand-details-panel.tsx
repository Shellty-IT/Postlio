// src/components/brands/brand-details-panel.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    X,
    Pencil,
    Trash2,
    Copy,
    BarChart3,
    Calendar,
    MessageSquare,
    Hash,
    PenTool,
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
    Brand,
    PERSONALITY_TRAITS,
    COMMUNICATION_STYLES
} from '@/types/brand';
import { useBrandsStore } from '@/store/brands-store';
import { WritingStyleRadar } from './writing-style-radar';

interface BrandDetailsPanelProps {
    brand: Brand;
    onClose: () => void;
}

export function BrandDetailsPanel({ brand, onClose }: BrandDetailsPanelProps) {
    const { openForm, deleteBrand } = useBrandsStore();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleEdit = () => {
        openForm(brand.id);
    };

    const handleDelete = () => {
        if (confirm(`Czy na pewno chcesz usunąć markę "${brand.name}"?`)) {
            deleteBrand(brand.id);
            onClose();
        }
    };

    const toneLabels = [
        { key: 'toneFormality', label: 'Formalność', value: brand.voiceDNA.toneFormality },
        { key: 'toneEnergy', label: 'Energia', value: brand.voiceDNA.toneEnergy },
        { key: 'toneHumor', label: 'Humor', value: brand.voiceDNA.toneHumor },
        { key: 'toneEmotion', label: 'Emocjonalność', value: brand.voiceDNA.toneEmotion },
    ];

    const content = (
        <ScrollArea className="h-full">
            <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 xs:gap-3">
                        <div
                            className="w-12 h-12 xs:w-14 xs:h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg xs:text-xl flex-shrink-0"
                            style={{ backgroundColor: brand.primaryColor }}
                        >
                            {brand.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg xs:text-xl font-bold truncate">{brand.name}</h2>
                            {brand.industry && (
                                <p className="text-xs xs:text-sm text-muted-foreground truncate">{brand.industry}</p>
                            )}
                        </div>
                    </div>
                    {!isMobile && (
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 flex-shrink-0">
                            <X className="h-5 w-5" />
                        </Button>
                    )}
                </div>

                {brand.description && (
                    <p className="text-sm text-muted-foreground mb-4 sm:mb-6">{brand.description}</p>
                )}

                <div className="grid grid-cols-3 gap-2 xs:gap-4 mb-4 sm:mb-6">
                    <div className="text-center p-2 xs:p-3 rounded-lg bg-muted/50">
                        <BarChart3 className="h-4 w-4 xs:h-5 xs:w-5 mx-auto text-primary mb-1" />
                        <div className="text-base xs:text-lg font-semibold">{brand.postsCount || 0}</div>
                        <div className="text-[10px] xs:text-xs text-muted-foreground">Postów</div>
                    </div>
                    <div className="text-center p-2 xs:p-3 rounded-lg bg-muted/50">
                        <Calendar className="h-4 w-4 xs:h-5 xs:w-5 mx-auto text-primary mb-1" />
                        <div className="text-base xs:text-lg font-semibold">
                            {format(new Date(brand.createdAt), 'd MMM', { locale: pl })}
                        </div>
                        <div className="text-[10px] xs:text-xs text-muted-foreground">Utworzono</div>
                    </div>
                    <div className="text-center p-2 xs:p-3 rounded-lg bg-muted/50">
                        <PenTool className="h-4 w-4 xs:h-5 xs:w-5 mx-auto text-violet-500 mb-1" />
                        <div className="text-base xs:text-lg font-semibold">
                            {brand.voiceDNA.personalityTraits.length}
                        </div>
                        <div className="text-[10px] xs:text-xs text-muted-foreground">Cech</div>
                    </div>
                </div>

                <Separator className="my-4 sm:my-6" />

                <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-2">
                        <PenTool className="h-4 w-4 xs:h-5 xs:w-5 text-violet-500" />
                        <h3 className="font-semibold text-sm xs:text-base">Styl pisania</h3>
                    </div>

                    <div className="flex justify-center">
                        <WritingStyleRadar
                            voiceDNA={brand.voiceDNA}
                            primaryColor={brand.primaryColor}
                            size={isMobile ? 160 : 180}
                        />
                    </div>

                    <div className="space-y-2 xs:space-y-3">
                        {toneLabels.map((tone) => (
                            <div key={tone.key} className="space-y-1">
                                <div className="flex justify-between text-xs xs:text-sm">
                                    <span>{tone.label}</span>
                                    <span className="text-muted-foreground">{tone.value}%</span>
                                </div>
                                <div className="h-1.5 xs:h-2 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${tone.value}%` }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: brand.primaryColor }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <Separator />

                    <div>
                        <div className="flex items-center gap-2 mb-2 xs:mb-3">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs xs:text-sm font-medium">Styl komunikacji</span>
                        </div>
                        <Badge variant="secondary" className="text-xs xs:text-sm">
                            {COMMUNICATION_STYLES[brand.voiceDNA.communicationStyle].label}
                        </Badge>
                        <p className="text-[10px] xs:text-xs text-muted-foreground mt-2">
                            {COMMUNICATION_STYLES[brand.voiceDNA.communicationStyle].description}
                        </p>
                    </div>

                    <Separator />

                    <div>
                        <div className="flex items-center gap-2 mb-2 xs:mb-3">
                            <PenTool className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs xs:text-sm font-medium">Charakter treści</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 xs:gap-2">
                            {brand.voiceDNA.personalityTraits.map((trait) => (
                                <Badge key={trait} variant="outline" className="text-[10px] xs:text-xs">
                                    {PERSONALITY_TRAITS[trait].icon} {PERSONALITY_TRAITS[trait].label}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {brand.voiceDNA.keywords.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <div className="flex items-center gap-2 mb-2 xs:mb-3">
                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs xs:text-sm font-medium">Słowa kluczowe</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 xs:gap-2">
                                    {brand.voiceDNA.keywords.map((keyword) => (
                                        <Badge key={keyword} variant="secondary" className="text-[10px] xs:text-xs">
                                            {keyword}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {brand.voiceDNA.hashtags.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <div className="flex items-center gap-2 mb-2 xs:mb-3">
                                    <Hash className="h-4 w-4 text-primary" />
                                    <span className="text-xs xs:text-sm font-medium">Hashtagi</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 xs:gap-2">
                                    {brand.voiceDNA.hashtags.map((hashtag) => (
                                        <Badge
                                            key={hashtag}
                                            variant="outline"
                                            className="text-[10px] xs:text-xs text-primary"
                                        >
                                            {hashtag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {brand.voiceDNA.preferredEmojis.length > 0 && (
                        <>
                            <Separator />
                            <div>
                                <span className="text-xs xs:text-sm font-medium">Preferowane emoji</span>
                                <div className="flex gap-2 mt-2 text-xl xs:text-2xl">
                                    {brand.voiceDNA.preferredEmojis.map((emoji, index) => (
                                        <span key={index}>{emoji}</span>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {brand.targetAudience && (
                        <>
                            <Separator />
                            <div>
                                <span className="text-xs xs:text-sm font-medium">Grupa docelowa</span>
                                <p className="text-xs xs:text-sm text-muted-foreground mt-1">
                                    {brand.targetAudience}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex gap-2 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
                    <Button onClick={handleEdit} className="flex-1 h-10 xs:h-11">
                        <Pencil className="h-4 w-4 mr-2" />
                        Edytuj
                    </Button>
                    <Button variant="outline" size="icon" className="h-10 w-10 xs:h-11 xs:w-11">
                        <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleDelete}
                        className="h-10 w-10 xs:h-11 xs:w-11 text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </ScrollArea>
    );

    if (isMobile) {
        return (
            <Sheet open={true} onOpenChange={onClose}>
                <SheetContent side="right" className="w-[85vw] max-w-md p-0">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Szczegóły marki</SheetTitle>
                    </SheetHeader>
                    {content}
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
                "fixed right-0 top-0 bottom-0 w-full max-w-md z-50",
                "bg-background border-l shadow-2xl"
            )}
        >
            {content}

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 -z-10"
                onClick={onClose}
            />
        </motion.div>
    );
}