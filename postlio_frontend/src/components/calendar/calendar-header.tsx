//calendar-header.tsx

'use client';

import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Plus,
    LayoutGrid,
    Rows3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from '@/components/ui/tooltip';
import { useCalendarStore } from '@/store/calendar-store';
import { cn } from '@/lib/utils';

interface CalendarHeaderProps {
    isMobile?: boolean;
}

export function CalendarHeader({ isMobile = false }: CalendarHeaderProps) {
    const {
        currentDate,
        view,
        setView,
        goToNext,
        goToPrevious,
        goToToday,
        openScheduleModal
    } = useCalendarStore();

    const title = view === 'month'
        ? format(currentDate, 'LLLL yyyy', { locale: pl })
        : `Tydzień ${format(currentDate, 'w, LLLL yyyy', { locale: pl })}`;

    const shortTitle = format(currentDate, 'LLL yyyy', { locale: pl });

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 mb-4 sm:mb-6"
        >
            <div className="flex items-center justify-between sm:justify-start gap-2">
                <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={goToPrevious}
                        className="h-9 w-9"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={goToNext}
                        className="h-9 w-9"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToToday}
                        className="hidden xs:flex h-9"
                    >
                        <CalendarIcon className="h-4 w-4 xs:mr-2" />
                        <span className="hidden xs:inline">Dziś</span>
                    </Button>
                </div>

                <motion.h2
                    key={title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-base xs:text-lg sm:text-xl font-semibold capitalize sm:ml-2"
                >
                    <span className="xs:hidden">{shortTitle}</span>
                    <span className="hidden xs:inline">{title}</span>
                </motion.h2>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                {!isMobile && (
                    <TooltipProvider>
                        <div className="flex items-center bg-muted rounded-lg p-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setView('month')}
                                        className={cn(
                                            "p-2 rounded-md transition-all duration-200",
                                            view === 'month'
                                                ? "bg-background shadow-sm text-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Widok miesięczny</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setView('week')}
                                        className={cn(
                                            "p-2 rounded-md transition-all duration-200",
                                            view === 'week'
                                                ? "bg-background shadow-sm text-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Rows3 className="h-4 w-4" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Widok tygodniowy</TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>
                )}

                <Button
                    onClick={() => openScheduleModal()}
                    size={isMobile ? "sm" : "default"}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Zaplanuj post</span>
                    <span className="sm:hidden">Nowy</span>
                </Button>
            </div>
        </motion.div>
    );
}