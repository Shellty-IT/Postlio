// src/components/layout/floating-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    PenTool,
    Calendar,
    Zap,
    Plus,
} from 'lucide-react';
import { useModal } from '@/store/ui-store';

const navItems = [
    {
        title: 'Home',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Kreator',
        href: '/creator',
        icon: PenTool,
    },
    {
        title: 'Nowy',
        href: '#',
        icon: Plus,
        isAction: true,
    },
    {
        title: 'Kalendarz',
        href: '/calendar',
        icon: Calendar,
    },
    {
        title: 'Autopilot',
        href: '/autopilot',
        icon: Zap,
    },
];

export function FloatingNav() {
    const pathname = usePathname();
    const { open: openModal } = useModal();

    return (
        <nav className="floating-island" role="navigation" aria-label="Główna nawigacja mobilna">
            <div className="flex items-center justify-center gap-0.5 xs:gap-1">
                {navItems.map((item) => {
                    const isActive = !item.isAction && (
                        pathname === item.href || pathname.startsWith(`${item.href}/`)
                    );
                    const Icon = item.icon;

                    // Przycisk akcji "Nowy post"
                    if (item.isAction) {
                        return (
                            <button
                                key={item.title}
                                onClick={() => openModal('create-post')}
                                aria-label="Utwórz nowy post"
                                className={cn(
                                    'relative flex flex-col items-center justify-center',
                                    // ✅ Responsywne rozmiary
                                    'w-12 h-12 xs:w-14 xs:h-14',
                                    '-mt-4 xs:-mt-6',
                                    'rounded-xl xs:rounded-2xl',
                                    'bg-gradient-to-br from-primary to-accent',
                                    'text-white shadow-lg shadow-primary/30',
                                    'transition-all duration-300',
                                    'hover:shadow-xl hover:shadow-primary/40 hover:scale-105',
                                    'active:scale-95',
                                    // ✅ Touch-friendly
                                    'touch-target'
                                )}
                            >
                                <Icon className="h-5 w-5 xs:h-6 xs:w-6" />
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-label={item.title}
                            aria-current={isActive ? 'page' : undefined}
                            className={cn(
                                'flex flex-col items-center justify-center',
                                // ✅ Responsywne rozmiary - mniejsze na bardzo małych ekranach
                                'w-11 h-11 xs:w-14 xs:h-14',
                                'rounded-lg xs:rounded-xl',
                                'transition-all duration-200',
                                // ✅ Touch-friendly minimum
                                'touch-target',
                                isActive
                                    ? 'text-primary bg-primary/10'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary active:bg-secondary/80'
                            )}
                        >
                            <Icon className={cn(
                                'h-5 w-5',
                                isActive && 'text-primary'
                            )} />
                            <span className={cn(
                                // ✅ Responsywna typografia - ukryj na bardzo małych
                                'text-[9px] xs:text-[10px] mt-0.5 xs:mt-1 font-medium',
                                // Na bardzo małych ekranach pokazuj tylko dla aktywnego
                                'hidden xs:block',
                                isActive && 'block text-primary'
                            )}>
                                {item.title}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}