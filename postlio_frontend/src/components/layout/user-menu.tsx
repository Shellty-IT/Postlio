// src/components/layout/user-menu.tsx
/**
 * Menu użytkownika w topbar
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    User,
    Settings,
    CreditCard,
    HelpCircle,
    LogOut,
    ChevronDown,
    Sparkles,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks';

// ============================================================
// KOMPONENT
// ============================================================

export function UserMenu() {
    const { user, logout, isLoading } = useAuth();
    const [open, setOpen] = useState(false);

    if (isLoading || !user) {
        return (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
        );
    }

    // Inicjały użytkownika
    const initials = user.full_name
        ? user.full_name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : user.email[0].toUpperCase();

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-10 w-auto gap-2 px-2 hover:bg-muted/50"
                >
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-violet-500 text-white text-sm">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium truncate max-w-[120px]">
              {user.full_name || 'Użytkownik'}
            </span>
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {user.email}
            </span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {user.full_name || 'Użytkownik'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {/* Plan */}
                <div className="px-2 py-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Plan</span>
                        <span className="text-xs font-medium bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              Pro
            </span>
                    </div>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link href="/settings" className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            Profil
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/settings?tab=billing" className="cursor-pointer">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Płatności
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/settings" className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            Ustawienia
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                    <Link href="/help" className="cursor-pointer">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Pomoc
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className="text-red-500 focus:text-red-500 cursor-pointer"
                    onClick={() => {
                        setOpen(false);
                        logout();
                    }}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Wyloguj się
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default UserMenu;