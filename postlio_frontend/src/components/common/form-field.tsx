// src/components/common/form-field.tsx
'use client';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface FormFieldProps {
    label: string;
    htmlFor: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
    className?: string;
}

export function FormField({
                              label,
                              htmlFor,
                              error,
                              required,
                              children,
                              className,
                          }: FormFieldProps) {
    return (
        <div className={cn('space-y-2', className)}>
            <Label
                htmlFor={htmlFor}
                className={cn(
                    'text-sm font-medium',
                    error && 'text-destructive'
                )}
            >
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </Label>

            {children}

            {error && (
                <p className="text-sm text-destructive animate-in slide-in-from-top-1 duration-200">
                    {error}
                </p>
            )}
        </div>
    );
}