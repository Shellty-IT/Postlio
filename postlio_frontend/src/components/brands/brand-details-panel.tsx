// src/components/brands/brand-details-panel.tsx
'use client';

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
            <ScrollArea className="h-full">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                                style={{ backgroundColor: brand.primaryColor }}
                            >
                                {brand.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{brand.name}</h2>
                                {brand.industry && (
                                    <p className="text-sm text-muted-foreground">{brand.industry}</p>
                                )}
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Description */}
                    {brand.description && (
                        <p className="text-muted-foreground mb-6">{brand.description}</p>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                            <BarChart3 className="h-5 w-5 mx-auto text-primary mb-1" />
                            <div className="text-lg font-semibold">{brand.postsCount || 0}</div>
                            <div className="text-xs text-muted-foreground">Postów</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                            <Calendar className="h-5 w-5 mx-auto text-primary mb-1" />
                            <div className="text-lg font-semibold">
                                {format(new Date(brand.createdAt), 'd MMM', { locale: pl })}
                            </div>
                            <div className="text-xs text-muted-foreground">Utworzono</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-muted/50">
                            <PenTool className="h-5 w-5 mx-auto text-violet-500 mb-1" />
                            <div className="text-lg font-semibold">
                                {brand.voiceDNA.personalityTraits.length}
                            </div>
                            <div className="text-xs text-muted-foreground">Cech</div>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Styl pisania Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <PenTool className="h-5 w-5 text-violet-500" />
                            <h3 className="font-semibold">Styl pisania</h3>
                        </div>

                        {/* Radar Chart */}
                        <div className="flex justify-center">
                            <WritingStyleRadar
                                voiceDNA={brand.voiceDNA}
                                primaryColor={brand.primaryColor}
                                size={180}
                            />
                        </div>

                        {/* Tone Values */}
                        <div className="space-y-3">
                            {toneLabels.map((tone) => (
                                <div key={tone.key} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span>{tone.label}</span>
                                        <span className="text-muted-foreground">{tone.value}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
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

                        {/* Communication Style */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Styl komunikacji</span>
                            </div>
                            <Badge variant="secondary" className="text-sm">
                                {COMMUNICATION_STYLES[brand.voiceDNA.communicationStyle].label}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-2">
                                {COMMUNICATION_STYLES[brand.voiceDNA.communicationStyle].description}
                            </p>
                        </div>

                        <Separator />

                        {/* Personality Traits */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <PenTool className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Charakter treści</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {brand.voiceDNA.personalityTraits.map((trait) => (
                                    <Badge key={trait} variant="outline">
                                        {PERSONALITY_TRAITS[trait].icon} {PERSONALITY_TRAITS[trait].label}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Keywords */}
                        {brand.voiceDNA.keywords.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Hash className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Słowa kluczowe</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {brand.voiceDNA.keywords.map((keyword) => (
                                            <Badge key={keyword} variant="secondary" className="text-xs">
                                                {keyword}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Hashtags */}
                        {brand.voiceDNA.hashtags.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Hash className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-medium">Hashtagi</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {brand.voiceDNA.hashtags.map((hashtag) => (
                                            <Badge
                                                key={hashtag}
                                                variant="outline"
                                                className="text-xs text-primary"
                                            >
                                                {hashtag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Emoji Preferences */}
                        {brand.voiceDNA.preferredEmojis.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <span className="text-sm font-medium">Preferowane emoji</span>
                                    <div className="flex gap-2 mt-2 text-2xl">
                                        {brand.voiceDNA.preferredEmojis.map((emoji, index) => (
                                            <span key={index}>{emoji}</span>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Target Audience */}
                        {brand.targetAudience && (
                            <>
                                <Separator />
                                <div>
                                    <span className="text-sm font-medium">Grupa docelowa</span>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {brand.targetAudience}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-8 pt-6 border-t">
                        <Button onClick={handleEdit} className="flex-1">
                            <Pencil className="h-4 w-4 mr-2" />
                            Edytuj
                        </Button>
                        <Button variant="outline" size="icon">
                            <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleDelete}
                            className="text-destructive hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </ScrollArea>

            {/* Backdrop */}
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