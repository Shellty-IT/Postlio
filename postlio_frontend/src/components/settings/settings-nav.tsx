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
import { SETTINGS_SECTIONS, type SettingsSection } from '@/types/settings';

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
    onSelect?: () => void;
}

export function SettingsNav({ className, onSelect }: SettingsNavProps) {
    const { activeSection, setActiveSection } = useSettingsStore();

    const handleSelect = (sectionId: SettingsSection) => {
        setActiveSection(sectionId);
        onSelect?.();
    };

    const mainSections = SETTINGS_SECTIONS.filter((section) => section.id !== 'danger');
    const dangerSection = SETTINGS_SECTIONS.find((section) => section.id === 'danger');

    return (
        <nav
            className={cn(
                'sticky top-0 z-20 flex items-center gap-1 overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#0d0e15]/75 p-1.5 backdrop-blur-xl no-scrollbar',
                className
            )}
        >
            {mainSections.map((section) => {
                const isActive = activeSection === section.id;

                return (
                    <button
                        key={section.id}
                        onClick={() => handleSelect(section.id as SettingsSection)}
                        className={cn(
                            'flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-[11px] px-3.5 py-2.5 text-[13.5px] font-medium transition-all min-h-[44px]',
                            isActive
                                ? 'pill-active'
                                : 'text-muted-foreground hover:bg-white/[0.045] hover:text-foreground'
                        )}
                    >
                        {ICONS[section.icon]}
                        {section.label}
                    </button>
                );
            })}

            <div className="flex-1" />

            {dangerSection && (
                <>
                    <div className="hidden h-[22px] w-px flex-shrink-0 bg-white/[0.08] sm:block" />
                    <button
                        onClick={() => handleSelect(dangerSection.id as SettingsSection)}
                        className={cn(
                            'flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-[11px] px-3.5 py-2.5 text-[13.5px] font-medium transition-all min-h-[44px] text-destructive/80',
                            activeSection === dangerSection.id
                                ? 'bg-destructive/10 text-destructive'
                                : 'hover:bg-destructive/[0.08] hover:text-destructive'
                        )}
                    >
                        {ICONS[dangerSection.icon]}
                        {dangerSection.label}
                    </button>
                </>
            )}
        </nav>
    );
}
