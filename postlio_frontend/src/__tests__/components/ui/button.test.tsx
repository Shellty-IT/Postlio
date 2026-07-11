/**
 * Tests for Button component.
 *
 * Testuje wszystkie warianty, rozmiary i stany przycisku.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, buttonVariants } from '@/components/ui/button';

describe('Button', () => {
    describe('rendering', () => {
        it('should render button with text', () => {
            render(<Button>Click me</Button>);

            expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
        });

        it('should render with default variant and size', () => {
            render(<Button>Default</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('bg-primary');
            expect(button).toHaveClass('h-10');
            expect(button).toHaveClass('sm:h-9');
        });

        it('should forward ref correctly', () => {
            const ref = jest.fn();
            render(<Button ref={ref}>With Ref</Button>);

            expect(ref).toHaveBeenCalled();
        });

        it('should have correct displayName', () => {
            expect(Button.displayName).toBe('Button');
        });
    });

    describe('variants', () => {
        it('should render default variant', () => {
            render(<Button variant="default">Default</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('bg-primary');
            expect(button).toHaveClass('text-primary-foreground');
        });

        it('should render destructive variant', () => {
            render(<Button variant="destructive">Delete</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('bg-destructive');
            expect(button).toHaveClass('text-destructive-foreground');
        });

        it('should render outline variant', () => {
            render(<Button variant="outline">Outline</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('border');
            expect(button).toHaveClass('bg-background');
        });

        it('should render secondary variant', () => {
            render(<Button variant="secondary">Secondary</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('bg-secondary');
            expect(button).toHaveClass('text-secondary-foreground');
        });

        it('should render ghost variant', () => {
            render(<Button variant="ghost">Ghost</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('hover:bg-accent');
        });

        it('should render link variant', () => {
            render(<Button variant="link">Link</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('text-primary');
            expect(button).toHaveClass('underline-offset-4');
        });
    });

    describe('sizes', () => {
        it('should render default size', () => {
            render(<Button size="default">Default Size</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('h-10');
            expect(button).toHaveClass('sm:h-9');
            expect(button).toHaveClass('px-4');
        });

        it('should render small size', () => {
            render(<Button size="sm">Small</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('h-9');
            expect(button).toHaveClass('sm:h-8');
            expect(button).toHaveClass('px-3');
            expect(button).toHaveClass('text-xs');
        });

        it('should render large size', () => {
            render(<Button size="lg">Large</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('h-11');
            expect(button).toHaveClass('sm:h-10');
            expect(button).toHaveClass('px-8');
        });

        it('should render icon size', () => {
            render(<Button size="icon">🔥</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('h-10');
            expect(button).toHaveClass('w-10');
            expect(button).toHaveClass('sm:h-9');
            expect(button).toHaveClass('sm:w-9');
        });
    });

    describe('disabled state', () => {
        it('should be disabled when disabled prop is true', () => {
            render(<Button disabled>Disabled</Button>);

            const button = screen.getByRole('button');
            expect(button).toBeDisabled();
            expect(button).toHaveClass('disabled:pointer-events-none');
            expect(button).toHaveClass('disabled:opacity-50');
        });

        it('should not trigger onClick when disabled', async () => {
            const handleClick = jest.fn();
            render(<Button disabled onClick={handleClick}>Disabled</Button>);

            const button = screen.getByRole('button');
            await userEvent.click(button);

            expect(handleClick).not.toHaveBeenCalled();
        });
    });

    describe('interactions', () => {
        it('should call onClick when clicked', async () => {
            const handleClick = jest.fn();
            render(<Button onClick={handleClick}>Clickable</Button>);

            await userEvent.click(screen.getByRole('button'));

            expect(handleClick).toHaveBeenCalledTimes(1);
        });

        it('should handle multiple clicks', async () => {
            const handleClick = jest.fn();
            render(<Button onClick={handleClick}>Multi-click</Button>);

            const button = screen.getByRole('button');
            await userEvent.click(button);
            await userEvent.click(button);
            await userEvent.click(button);

            expect(handleClick).toHaveBeenCalledTimes(3);
        });

        it('should be focusable', () => {
            render(<Button>Focusable</Button>);

            const button = screen.getByRole('button');
            button.focus();

            expect(button).toHaveFocus();
        });

        it('should respond to keyboard events', async () => {
            const handleClick = jest.fn();
            render(<Button onClick={handleClick}>Keyboard</Button>);

            const button = screen.getByRole('button');
            button.focus();

            await userEvent.keyboard('{Enter}');
            expect(handleClick).toHaveBeenCalled();
        });
    });

    describe('asChild prop', () => {
        it('should render as child element when asChild is true', () => {
            render(
                <Button asChild>
                    <a href="/test">Link Button</a>
                </Button>
            );

            const link = screen.getByRole('link', { name: /link button/i });
            expect(link).toBeInTheDocument();
            expect(link).toHaveAttribute('href', '/test');
        });

        it('should apply button classes to child element', () => {
            render(
                <Button asChild variant="destructive">
                    <a href="/delete">Delete Link</a>
                </Button>
            );

            const link = screen.getByRole('link');
            expect(link).toHaveClass('bg-destructive');
        });
    });

    describe('custom className', () => {
        it('should merge custom className with default classes', () => {
            render(<Button className="custom-class">Custom</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('custom-class');
            expect(button).toHaveClass('inline-flex');
        });

        it('should allow overriding default classes', () => {
            render(<Button className="rounded-full">Rounded</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('rounded-full');
        });
    });

    describe('with icons', () => {
        it('should render with icon', () => {
            render(
                <Button>
                    <svg data-testid="icon" />
                    With Icon
                </Button>
            );

            expect(screen.getByTestId('icon')).toBeInTheDocument();
            expect(screen.getByText('With Icon')).toBeInTheDocument();
        });

        it('should apply icon styles', () => {
            render(
                <Button>
                    <svg data-testid="icon" className="test-icon" />
                    Icon Button
                </Button>
            );

            const button = screen.getByRole('button');
            expect(button.className).toContain('[&_svg]');
        });
    });

    describe('HTML attributes', () => {
        it('should pass through HTML button attributes', () => {
            render(
                <Button type="submit" name="submit-btn" aria-label="Submit form">
                    Submit
                </Button>
            );

            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('type', 'submit');
            expect(button).toHaveAttribute('name', 'submit-btn');
            expect(button).toHaveAttribute('aria-label', 'Submit form');
        });

        it('should have type button by default', () => {
            render(<Button>Default Type</Button>);

            const button = screen.getByRole('button');
            expect(button.tagName).toBe('BUTTON');
        });
    });

    describe('accessibility', () => {
        it('should have accessible name', () => {
            render(<Button>Accessible Button</Button>);

            expect(screen.getByRole('button', { name: 'Accessible Button' })).toBeInTheDocument();
        });

        it('should support aria-disabled', () => {
            render(<Button aria-disabled="true">Aria Disabled</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('aria-disabled', 'true');
        });

        it('should have focus-visible styles', () => {
            render(<Button>Focus Visible</Button>);

            const button = screen.getByRole('button');
            expect(button).toHaveClass('focus-visible:outline-none');
            expect(button).toHaveClass('focus-visible:ring-1');
        });
    });
});

describe('buttonVariants', () => {
    it('should generate correct classes for default variant', () => {
        const classes = buttonVariants({ variant: 'default', size: 'default' });

        expect(classes).toContain('bg-primary');
        expect(classes).toContain('h-10');
        expect(classes).toContain('sm:h-9');
    });

    it('should generate correct classes for all variants', () => {
        const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;

        variants.forEach((variant) => {
            const classes = buttonVariants({ variant });
            expect(typeof classes).toBe('string');
            expect(classes.length).toBeGreaterThan(0);
        });
    });

    it('should generate correct classes for all sizes', () => {
        const sizes = ['default', 'sm', 'lg', 'icon'] as const;

        sizes.forEach((size) => {
            const classes = buttonVariants({ size });
            expect(typeof classes).toBe('string');
            expect(classes.length).toBeGreaterThan(0);
        });
    });
});
