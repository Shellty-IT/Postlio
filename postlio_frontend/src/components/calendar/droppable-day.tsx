// src/components/calendar/droppable-day.tsx
/**
 * Wrapper dla dni kalendarza z obsługą drop
 */

'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DroppableDayProps {
    id: string;
    date: Date;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
}

export function DroppableDay({
                                 id,
                                 date,
                                 children,
                                 className,
                                 disabled = false,
                             }: DroppableDayProps) {
    const { isOver, setNodeRef, active } = useDroppable({
        id,
        data: {
            type: 'calendar-day',
            date,
        },
        disabled,
    });

    // Check if something is being dragged
    const isDragging = !!active;
    const isDraftBeingDragged = active?.data?.current?.type === 'draft';

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'relative transition-all duration-200',
                isDragging && isDraftBeingDragged && !disabled && 'ring-2 ring-primary/30 ring-inset',
                isOver && !disabled && 'bg-primary/10 ring-2 ring-primary',
                className
            )}
        >
            {children}

            {/* Drop indicator overlay */}
            {isOver && !disabled && (
                <div className="absolute inset-0 bg-primary/5 flex items-center justify-center pointer-events-none z-10">
                    <div className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full shadow-lg">
                        Upuść tutaj
                    </div>
                </div>
            )}
        </div>
    );
}

export default DroppableDay;