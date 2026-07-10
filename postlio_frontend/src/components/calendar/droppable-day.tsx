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
                'relative rounded-[14px] transition-all duration-200',
                isDragging && isDraftBeingDragged && !disabled && 'ring-2 ring-primary/30 ring-inset',
                isOver && !disabled && 'bg-primary/10 ring-2 ring-primary',
                className
            )}
        >
            {children}

            {/* Drop indicator overlay */}
            {isOver && !disabled && (
                <div className="absolute inset-0 flex items-center justify-center rounded-[14px] bg-primary/5 pointer-events-none z-10">
                    <div className="btn-gradient px-2 py-1 text-xs">
                        Upuść tutaj
                    </div>
                </div>
            )}
        </div>
    );
}

export default DroppableDay;