// src/components/common/loading-button.tsx
'use client';

import { forwardRef } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends ButtonProps {
    isLoading?: boolean;
    loadingText?: string;
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
    ({ children, isLoading, loadingText, disabled, className, ...props }, ref) => {
        return (
            <Button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn('relative', className)}
                {...props}
            >
                {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isLoading && loadingText ? loadingText : children}
            </Button>
        );
    }
);

LoadingButton.displayName = 'LoadingButton';