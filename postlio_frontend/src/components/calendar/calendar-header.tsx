// src/components/calendar/calendar-header.tsx
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
    TooltipTrigger
} from '@/components/ui/tooltip';
import { useCalendarStore } from '@/store/calendar-store';
import { cn } from '@/lib/utils';

export function CalendarHeader() {
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

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
        >
            {/* Left side - Navigation */}
            <div className="flex items-center gap-2">
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
                    className="ml-2"
                >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Dziś
                </Button>

                <motion.h2
                    key={title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xl font-semibold ml-4 capitalize"
                >
                    {title}
                </motion.h2>
            </div>

            {/* Right side - View toggle & Add button */}
            <div className="flex items-center gap-3">
                {/* View Toggle */}
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

                {/* Add Post Button */}
                <Button
                    onClick={() => openScheduleModal()}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Zaplanuj post
                </Button>
            </div>
        </motion.div>
    );
}