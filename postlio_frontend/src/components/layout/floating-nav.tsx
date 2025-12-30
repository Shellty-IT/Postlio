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
        <nav className="floating-island pb-safe">
            <div className="flex items-center gap-1">
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
                                className={cn(
                                    'relative flex flex-col items-center justify-center',
                                    'w-14 h-14 -mt-6',
                                    'rounded-2xl',
                                    'bg-gradient-to-br from-primary to-accent',
                                    'text-white shadow-lg shadow-primary/30',
                                    'transition-all duration-300',
                                    'hover:shadow-xl hover:shadow-primary/40 hover:scale-105',
                                    'active:scale-95'
                                )}
                            >
                                <Icon className="h-6 w-6" />
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center justify-center',
                                'w-14 h-14 rounded-xl',
                                'transition-all duration-200',
                                isActive
                                    ? 'text-primary bg-primary/10'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                            )}
                        >
                            <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                            <span className={cn(
                                'text-[10px] mt-1 font-medium',
                                isActive && 'text-primary'
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