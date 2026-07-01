// src/components/creator/platform-selector.tsx
'use client';

import { cn } from '@/lib/utils';
import type { Platform } from '@/types';
import { Facebook, Instagram, Linkedin } from 'lucide-react';

interface PlatformSelectorProps {
    selected: Platform[];
    onChange: (platforms: Platform[]) => void;
    disabled?: boolean;
}

const platforms: { id: Platform; name: string; icon: React.ReactNode; bgColor: string }[] = [
    {
        id: 'facebook',
        name: 'Facebook',
        icon: <Facebook className="h-3 w-3" />,
        bgColor: 'bg-[#1877F2]',
    },
    {
        id: 'instagram',
        name: 'Instagram',
        icon: <Instagram className="h-3 w-3" />,
        bgColor: 'bg-[#E4405F]',
    },
    {
        id: 'linkedin',
        name: 'LinkedIn',
        icon: <Linkedin className="h-3 w-3" />,
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
        <div className="space-y-2">
            <label className="mono-label">Platformy docelowe</label>
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
                                'relative flex items-center gap-2 px-4 py-2.5 rounded-[11px] border',
                                'transition-all duration-200',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                isSelected
                                    ? 'bg-gradient-to-br from-primary/20 to-accent/10 border-primary/35 text-white'
                                    : 'border-white/[0.09] text-muted-foreground hover:bg-white/[0.04]'
                            )}
                        >
                            <span className={cn(
                                'flex h-5 w-5 items-center justify-center rounded-[6px] text-white',
                                platform.bgColor,
                                platform.id === 'instagram' && 'bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]'
                            )}>
                                {platform.icon}
                            </span>
                            <span className={cn('font-medium text-sm', isSelected ? 'text-white' : 'text-[#c7cad2]')}>
                                {platform.name}
                            </span>

                            {isSelected && (
                                <span className="absolute -top-1 -right-1 h-[11px] w-[11px] rounded-full bg-emerald-400 border-2 border-background" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}