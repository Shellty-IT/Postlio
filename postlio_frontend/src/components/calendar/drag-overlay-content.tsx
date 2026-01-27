// src/components/calendar/drag-overlay-content.tsx
/**
 * Zawartość wyświetlana podczas przeciągania
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
import type { Post, Platform } from '@/types';

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
    const platformConfig = PLATFORM_CONFIG[draft.platform];
    const PlatformIcon = platformConfig.icon;

    const truncatedContent = draft.content.length > 50
        ? `${draft.content.slice(0, 50)}...`
        : draft.content;

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
                    <div
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                            backgroundColor: `${platformConfig.color}15`,
                            color: platformConfig.color,
                        }}
                    >
                        <PlatformIcon className="h-3 w-3" />
                        {platformConfig.label}
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
                <div className="text-[10px] text-primary font-medium text-center pt-1 border-t border-dashed">
                    Upuść na dzień w kalendarzu
                </div>
            </div>
        </div>
    );
}

export default DragOverlayContent;