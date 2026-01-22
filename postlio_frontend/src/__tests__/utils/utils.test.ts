/**
 * Tests for utility functions.
 *
 * Testuje funkcje pomocnicze z lib/utils.
 */
import { cn } from '@/lib/utils';

describe('cn (classNames utility)', () => {
    describe('basic functionality', () => {
        it('should merge class names', () => {
            const result = cn('class1', 'class2');
            expect(result).toBe('class1 class2');
        });

        it('should handle single class', () => {
            const result = cn('single');
            expect(result).toBe('single');
        });

        it('should handle empty input', () => {
            const result = cn();
            expect(result).toBe('');
        });
    });

    describe('conditional classes', () => {
        it('should handle truthy conditions', () => {
            const result = cn('base', true && 'included');
            expect(result).toBe('base included');
        });

        it('should handle falsy conditions', () => {
            const result = cn('base', false && 'excluded');
            expect(result).toBe('base');
        });

        it('should handle null and undefined', () => {
            const result = cn('base', undefined, null, 'end');
            expect(result).toBe('base end');
        });

        it('should handle mixed conditions', () => {
            const isActive = true;
            const isDisabled = false;

            const result = cn(
                'base',
                isActive && 'active',
                isDisabled && 'disabled',
                'always'
            );

            expect(result).toBe('base active always');
        });
    });

    describe('Tailwind class merging', () => {
        it('should merge conflicting padding classes', () => {
            const result = cn('px-4', 'px-6');
            expect(result).toBe('px-6');
        });

        it('should merge conflicting margin classes', () => {
            const result = cn('mt-2', 'mt-4');
            expect(result).toBe('mt-4');
        });

        it('should merge conflicting text color classes', () => {
            const result = cn('text-red-500', 'text-blue-500');
            expect(result).toBe('text-blue-500');
        });

        it('should merge conflicting background classes', () => {
            const result = cn('bg-white', 'bg-gray-100');
            expect(result).toBe('bg-gray-100');
        });

        it('should keep non-conflicting classes', () => {
            const result = cn('px-4', 'py-2', 'mt-2');
            expect(result).toBe('px-4 py-2 mt-2');
        });

        it('should handle complex Tailwind classes', () => {
            const result = cn(
                'flex items-center justify-between',
                'px-4 py-2',
                'bg-white dark:bg-gray-800',
                'rounded-lg shadow-sm'
            );

            expect(result).toContain('flex');
            expect(result).toContain('items-center');
            expect(result).toContain('rounded-lg');
        });

        it('should handle responsive prefixes', () => {
            const result = cn('text-sm', 'md:text-base', 'lg:text-lg');
            expect(result).toBe('text-sm md:text-base lg:text-lg');
        });

        it('should handle state prefixes', () => {
            const result = cn('bg-blue-500', 'hover:bg-blue-600', 'focus:bg-blue-700');
            expect(result).toContain('hover:bg-blue-600');
            expect(result).toContain('focus:bg-blue-700');
        });
    });

    describe('clsx features', () => {
        it('should handle arrays', () => {
            const result = cn(['class1', 'class2']);
            expect(result).toContain('class1');
            expect(result).toContain('class2');
        });

        it('should handle objects', () => {
            const result = cn({
                active: true,
                disabled: false,
                hidden: false,
            });
            expect(result).toBe('active');
        });

        it('should handle nested arrays', () => {
            const result = cn('base', ['nested1', 'nested2']);
            expect(result).toContain('base');
            expect(result).toContain('nested1');
            expect(result).toContain('nested2');
        });

        it('should handle mixed inputs', () => {
            const result = cn(
                'string-class',
                ['array-class'],
                { 'object-class': true },
                undefined,
                null,
                false && 'conditional'
            );

            expect(result).toContain('string-class');
            expect(result).toContain('array-class');
            expect(result).toContain('object-class');
            expect(result).not.toContain('conditional');
        });
    });

    describe('real-world usage patterns', () => {
        it('should work with component variants', () => {
            // Use variables with explicit string type to avoid literal type comparison issues
            const variant = 'primary' as string;
            const size = 'lg' as string;

            const result = cn(
                'btn',
                variant === 'primary' && 'bg-blue-500 text-white',
                variant === 'secondary' && 'bg-gray-200 text-gray-800',
                size === 'sm' && 'px-2 py-1 text-sm',
                size === 'lg' && 'px-6 py-3 text-lg'
            );

            expect(result).toContain('btn');
            expect(result).toContain('bg-blue-500');
            expect(result).toContain('px-6');
            expect(result).not.toContain('bg-gray-200');
        });

        it('should work with dynamic states', () => {
            const isLoading = true;
            const isDisabled = false;
            const isActive = true;

            const result = cn(
                'button',
                isLoading && 'opacity-50 cursor-wait',
                isDisabled && 'opacity-50 cursor-not-allowed',
                isActive && 'ring-2 ring-blue-500'
            );

            expect(result).toContain('opacity-50');
            expect(result).toContain('cursor-wait');
            expect(result).toContain('ring-2');
            expect(result).not.toContain('cursor-not-allowed');
        });

        it('should work with className prop override', () => {
            const baseClasses = 'px-4 py-2 bg-blue-500';
            const customClassName = 'px-8 bg-red-500';

            const result = cn(baseClasses, customClassName);

            // Custom classes should override base classes
            expect(result).toContain('px-8');
            expect(result).toContain('bg-red-500');
            expect(result).not.toContain('px-4');
            expect(result).not.toContain('bg-blue-500');
        });

        it('should work with function returning classes based on props', () => {
            const getButtonClasses = (variant: string, size: string) => {
                return cn(
                    'btn inline-flex items-center justify-center',
                    variant === 'primary' && 'bg-blue-500 text-white',
                    variant === 'secondary' && 'bg-gray-200 text-gray-800',
                    variant === 'ghost' && 'bg-transparent hover:bg-gray-100',
                    size === 'sm' && 'h-8 px-3 text-sm',
                    size === 'md' && 'h-10 px-4',
                    size === 'lg' && 'h-12 px-6 text-lg'
                );
            };

            const primaryMd = getButtonClasses('primary', 'md');
            expect(primaryMd).toContain('bg-blue-500');
            expect(primaryMd).toContain('h-10');

            const secondaryLg = getButtonClasses('secondary', 'lg');
            expect(secondaryLg).toContain('bg-gray-200');
            expect(secondaryLg).toContain('h-12');
        });
    });

    describe('edge cases', () => {
        it('should handle empty strings', () => {
            const result = cn('', 'class1', '', 'class2');
            expect(result).toBe('class1 class2');
        });

        it('should handle only falsy values', () => {
            const result = cn(false, null, undefined, '');
            expect(result).toBe('');
        });

        it('should handle deeply nested arrays', () => {
            const result = cn('base', [['nested1'], ['nested2']]);
            expect(result).toContain('base');
        });

        it('should handle number 0 correctly', () => {
            const result = cn('base', 0 && 'conditional');
            expect(result).toBe('base');
        });
    });
});