// src/components/layout/mobile-nav.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AppLogo } from '@/components/common/app-logo';
import { navigation, badgeClass } from './sidebar';
import { Menu, LogOut, Plus } from 'lucide-react';

export function MobileNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);

    const goTo = (href: string) => {
        setOpen(false);
        router.push(href);
    };

    return (
        <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Otwórz menu"
                        className="h-9 w-9 flex-shrink-0 rounded-xl text-muted-foreground hover:bg-white/[0.05] hover:text-foreground sm:h-10 sm:w-10"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent
                    side="left"
                    className="flex w-[80vw] max-w-[300px] flex-col gap-0 border-white/[0.09] bg-[hsl(var(--background))] p-0"
                >
                    <SheetTitle className="sr-only">Nawigacja</SheetTitle>

                    <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-4">
                        <AppLogo className="h-9 w-9 flex-shrink-0" />
                        <span className="text-lg font-semibold tracking-tight">Postlio</span>
                    </div>

                    <div className="px-3 pt-3">
                        <button
                            onClick={() => goTo('/creator')}
                            className="btn-gradient w-full py-2.5 text-sm"
                        >
                            <Plus className="h-4 w-4 flex-shrink-0" />
                            Stwórz nowy
                        </button>
                    </div>

                    <div className="mono-label px-4 pb-1.5 pt-4">Menu</div>

                    <ScrollArea className="min-h-0 flex-1">
                        <nav className="space-y-1 px-3">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            'flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm transition-all duration-200',
                                            isActive
                                                ? 'pill-active font-semibold'
                                                : 'font-medium text-muted-foreground hover:bg-white/[0.045] hover:text-foreground'
                                        )}
                                    >
                                        <Icon className="h-[19px] w-[19px] flex-shrink-0" />
                                        <span className="flex-1">{item.title}</span>
                                        {item.badge && <span className={badgeClass(item.badge)}>{item.badge}</span>}
                                    </Link>
                                );
                            })}
                        </nav>
                    </ScrollArea>

                    <div className="border-t border-white/[0.06] p-3">
                        <div className="flex items-center gap-2.5 rounded-[14px] border border-white/[0.045] bg-white/[0.025] p-2.5">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                                <span className="text-sm font-semibold text-white">
                                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                </span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold leading-tight">
                                    {user?.full_name || 'Użytkownik'}
                                </p>
                                <p className="truncate text-[11.5px] leading-tight text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={logout}
                                className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <Link href="/dashboard" className="flex flex-shrink-0 items-center">
                <AppLogo className="h-8 w-8" />
            </Link>
        </div>
    );
}
