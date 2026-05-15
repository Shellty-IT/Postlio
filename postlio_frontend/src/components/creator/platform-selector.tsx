// src/components/creator/platform-selector.tsx
'use client';

import { cn } from '@/lib/utils';
import type { Platform } from '@/types';
import { Facebook, Instagram, Linkedin, Check } from 'lucide-react';

interface PlatformSelectorProps {
    selected: Platform[];
    onChange: (platforms: Platform[]) => void;
    disabled?: boolean;
}

const platforms: { id: Platform; name: string; icon: React.ReactNode; color: string; bgColor: string }[] = [
    {
        id: 'facebook',
        name: 'Facebook',
        icon: <Facebook className="h-5 w-5" />,
        color: 'text-[#1877F2]',
        bgColor: 'bg-[#1877F2]',
    },
    {
        id: 'instagram',
        name: 'Instagram',
        icon: <Instagram className="h-5 w-5" />,
        color: 'text-[#E4405F]',
        bgColor: 'bg-[#E4405F]',
    },
    {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: <Linkedin className="h-5 w-5" />,
        color: 'text-[#0A66C2]',
        bgColor: 'bg-[#0A66C2]',
    },
];

export function PlatformSelector({ selected, onChange, disabled }: PlatformSelectorProps) {
    const togglePlatform = (platform: Platform) => {
        if (disabled) return;

        if (selected.includes(platform)) {
            // Nie pozwól odznaczyć ostatniej platformy
            if (selected.length > 1) {
                onChange(selected.filter((p) => p !== platform));
            }
        } else {
            onChange([...selected, platform]);
        }
    };

    return (
        <div className="space-y-3">
            <label className="text-sm font-medium">Platformy docelowe</label>
            <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => {
                    const isSelected = selected.includes(platform.id);

                    return (
                        <button
                            key={platform.id}
                            type="button"
                            onClick={() => togglePlatform(platform.id)}
                            disabled={disabled}
                            className={cn(
                                'relative flex items-center gap-2 px-4 py-2.5 rounded-xl border-2',
                                'transition-all duration-200',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                isSelected
                                    ? `${platform.bgColor} text-white border-transparent shadow-lg`
                                    : `bg-card border-border hover:border-muted-foreground/30 ${platform.color}`
                            )}
                        >
                            {platform.icon}
                            <span className="font-medium text-sm">{platform.name}</span>

                            {isSelected && (
                                <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-white flex items-center justify-center shadow-md">
                                    <Check className="h-3 w-3 text-success" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}