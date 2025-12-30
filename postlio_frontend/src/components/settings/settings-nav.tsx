// src/components/settings/settings-nav.tsx
'use client';

import {
    User,
    Sparkles,
    Bell,
    Palette,
    Link,
    AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settings-store';
import { SETTINGS_SECTIONS } from '@/types/settings';

const ICONS: Record<string, React.ReactNode> = {
    User: <User className="w-4 h-4" />,
    Sparkles: <Sparkles className="w-4 h-4" />,
    Bell: <Bell className="w-4 h-4" />,
    Palette: <Palette className="w-4 h-4" />,
    Link: <Link className="w-4 h-4" />,
    AlertTriangle: <AlertTriangle className="w-4 h-4" />,
};

interface SettingsNavProps {
    className?: string;
}

export function SettingsNav({ className }: SettingsNavProps) {
    const { activeSection, setActiveSection } = useSettingsStore();

    return (
        <nav className={cn('space-y-1', className)}>
            {SETTINGS_SECTIONS.map((section) => {
                const isActive = activeSection === section.id;
                const isDanger = section.id === 'danger';

                return (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                            "hover:bg-accent",
                            isActive && !isDanger && "bg-primary/10 text-primary border border-primary/20",
                            isActive && isDanger && "bg-destructive/10 text-destructive border border-destructive/20",
                            !isActive && isDanger && "text-destructive/70 hover:text-destructive hover:bg-destructive/5",
                            !isActive && !isDanger && "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <div className={cn(
                            "p-2 rounded-lg",
                            isActive && !isDanger && "bg-primary/10",
                            isActive && isDanger && "bg-destructive/10",
                            !isActive && "bg-muted"
                        )}>
                            {ICONS[section.icon]}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{section.label}</p>
                            <p className={cn(
                                "text-xs truncate",
                                isActive ? "opacity-70" : "text-muted-foreground"
                            )}>
                                {section.description}
                            </p>
                        </div>
                    </button>
                );
            })}
        </nav>
    );
}