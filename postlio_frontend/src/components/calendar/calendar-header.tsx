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
                <div className="flex items-center gap-1 rounded-[11px] border border-white/[0.06] bg-white/[0.03] p-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToPrevious}
                        className="h-[30px] w-[30px] rounded-lg text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={goToNext}
                        className="h-[30px] w-[30px] rounded-lg text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <motion.h2
                    key={title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-base xs:text-lg sm:text-[17px] font-semibold tracking-tight capitalize sm:ml-2"
                >
                    <span className="xs:hidden">{shortTitle}</span>
                    <span className="hidden xs:inline">{title}</span>
                </motion.h2>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                    className="hidden xs:flex h-9 rounded-[10px] border-white/[0.08] bg-transparent hover:bg-white/[0.05]"
                >
                    <CalendarIcon className="h-4 w-4 xs:mr-2" />
                    <span className="hidden xs:inline">Dziś</span>
                </Button>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                {!isMobile && (
                    <TooltipProvider>
                        <div className="flex items-center gap-1 rounded-[11px] border border-white/[0.06] bg-white/[0.03] p-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setView('month')}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition-all duration-200",
                                            view === 'month'
                                                ? "pill-active"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                        Miesiąc
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Widok miesięczny</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setView('week')}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition-all duration-200",
                                            view === 'week'
                                                ? "pill-active"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Rows3 className="h-4 w-4" />
                                        Timeline
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>Widok tygodniowy</TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>
                )}

                <Button
                    variant="outline"
                    onClick={() => openScheduleModal()}
                    size={isMobile ? "sm" : "default"}
                    className="rounded-[11px] border-white/10 bg-white/[0.03] font-medium hover:bg-white/[0.06]"
                >
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Zaplanuj post</span>
                    <span className="sm:hidden">Nowy</span>
                </Button>
            </div>
        </motion.div>
    );
}