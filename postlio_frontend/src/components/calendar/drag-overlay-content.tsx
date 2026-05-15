// src/components/calendar/drag-overlay-content.tsx
/**
 * Zawartość wyświetlana podczas przeciągania
 *
 * ✅ NAPRAWIONE: Obsługa platforms[] zamiast platform
 */

'use client';

import {
    Facebook,
    Instagram,
    Linkedin,
    Sparkles,
    Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Post } from '@/types/post';
import type { Platform } from '@/types';

interface DragOverlayContentProps {
    draft: Post;
}

const PLATFORM_CONFIG: Record<Platform, {
    icon: typeof Facebook;
    color: string;
    label: string;
}> = {
    facebook: { icon: Facebook, color: '#1877F2', label: 'FB' },
    instagram: { icon: Instagram, color: '#E4405F', label: 'IG' },
    linkedin: { icon: Linkedin, color: '#0A66C2', label: 'LI' },
};

export function DragOverlayContent({ draft }: DragOverlayContentProps) {
    // Wszystkie platformy posta
    const allPlatforms = draft.platforms && draft.platforms.length > 0
        ? draft.platforms
        : (draft.platform ? [draft.platform] : ['facebook']);

    // Pierwsza platforma (dla głównego koloru)
    const primaryPlatform = allPlatforms[0] as Platform;
    const primaryConfig = PLATFORM_CONFIG[primaryPlatform];

    const truncatedContent = draft.content && draft.content.length > 50
        ? `${draft.content.slice(0, 50)}...`
        : (draft.content || '');

    return (
        <div
            className={cn(
                'w-64 rounded-lg border-2 border-primary bg-card p-3 shadow-2xl',
                'rotate-3 scale-105'
            )}
        >
            <div className="space-y-2">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                    {/* Wyświetl wszystkie platformy */}
                    <div className="flex items-center gap-1">
                        {allPlatforms.map((platform) => {
                            const config = PLATFORM_CONFIG[platform as Platform];
                            if (!config) return null;
                            const Icon = config.icon;
                            return (
                                <div
                                    key={platform}
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium"
                                    style={{
                                        backgroundColor: `${config.color}15`,
                                        color: config.color,
                                    }}
                                >
                                    <Icon className="h-3 w-3" />
                                    {allPlatforms.length === 1 && config.label}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-1">
                        {draft.image_url && (
                            <ImageIcon className="h-3 w-3 text-muted-foreground" />
                        )}
                        {draft.ai_generated && (
                            <Sparkles className="h-3 w-3 text-violet-500" />
                        )}
                    </div>
                </div>

                {/* Content */}
                <p className="text-xs text-muted-foreground line-clamp-2">
                    {truncatedContent}
                </p>

                {/* Drop hint */}
                <div
                    className="text-[10px] font-medium text-center pt-1 border-t border-dashed"
                    style={{ color: primaryConfig?.color || '#3B82F6' }}
                >
                    Upuść na dzień w kalendarzu
                </div>
            </div>
        </div>
    );
}

export default DragOverlayContent;