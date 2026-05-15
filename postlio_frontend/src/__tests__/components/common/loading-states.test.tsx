/**
 * Tests for loading states and skeleton components.
 *
 * Testuje stany ładowania i placeholder komponenty.
 */
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Simple Skeleton component for testing
// (In real app, this might be imported from @/components/ui/skeleton)
function Skeleton({ className }: { className?: string }) {
    return (
        <div
            className={`animate-pulse rounded-md bg-muted ${className || ''}`}
            data-testid="skeleton"
        />
    );
}

// Loading spinner component
function LoadingSpinner({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
    const sizes = {
        sm: 'h-4 w-4',
        default: 'h-6 w-6',
        lg: 'h-8 w-8',
    };

    return (
        <div
            className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizes[size]}`}
            role="status"
            aria-label="Loading"
            data-testid="loading-spinner"
        />
    );
}

// Loading button state
function LoadingButton({ isLoading, children }: { isLoading: boolean; children: React.ReactNode }) {
    return (
        <Button disabled={isLoading}>
            {isLoading ? (
                <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Ładowanie...</span>
                </>
            ) : (
                children
            )}
        </Button>
    );
}

// Card skeleton
function CardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-24 w-full" />
            </CardContent>
        </Card>
    );
}

describe('Skeleton', () => {
    it('should render skeleton element', () => {
        render(<Skeleton />);

        expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    });

    it('should have animation class', () => {
        render(<Skeleton />);

        expect(screen.getByTestId('skeleton')).toHaveClass('animate-pulse');
    });

    it('should have background color', () => {
        render(<Skeleton />);

        expect(screen.getByTestId('skeleton')).toHaveClass('bg-muted');
    });

    it('should apply custom className', () => {
        render(<Skeleton className="h-10 w-full" />);

        const skeleton = screen.getByTestId('skeleton');
        expect(skeleton).toHaveClass('h-10');
        expect(skeleton).toHaveClass('w-full');
    });

    it('should have rounded corners', () => {
        render(<Skeleton />);

        expect(screen.getByTestId('skeleton')).toHaveClass('rounded-md');
    });
});

describe('LoadingSpinner', () => {
    it('should render spinner element', () => {
        render(<LoadingSpinner />);

        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should have animation class', () => {
        render(<LoadingSpinner />);

        expect(screen.getByTestId('loading-spinner')).toHaveClass('animate-spin');
    });

    it('should have correct role and aria-label', () => {
        render(<LoadingSpinner />);

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });

    it('should render small size', () => {
        render(<LoadingSpinner size="sm" />);

        const spinner = screen.getByTestId('loading-spinner');
        expect(spinner).toHaveClass('h-4');
        expect(spinner).toHaveClass('w-4');
    });

    it('should render default size', () => {
        render(<LoadingSpinner size="default" />);

        const spinner = screen.getByTestId('loading-spinner');
        expect(spinner).toHaveClass('h-6');
        expect(spinner).toHaveClass('w-6');
    });

    it('should render large size', () => {
        render(<LoadingSpinner size="lg" />);

        const spinner = screen.getByTestId('loading-spinner');
        expect(spinner).toHaveClass('h-8');
        expect(spinner).toHaveClass('w-8');
    });
});

describe('LoadingButton', () => {
    it('should render normal button when not loading', () => {
        render(<LoadingButton isLoading={false}>Click me</LoadingButton>);

        expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    it('should render loading state when loading', () => {
        render(<LoadingButton isLoading={true}>Click me</LoadingButton>);

        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        expect(screen.getByText('Ładowanie...')).toBeInTheDocument();
        expect(screen.queryByText('Click me')).not.toBeInTheDocument();
    });

    it('should be disabled when loading', () => {
        render(<LoadingButton isLoading={true}>Submit</LoadingButton>);

        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should not be disabled when not loading', () => {
        render(<LoadingButton isLoading={false}>Submit</LoadingButton>);

        expect(screen.getByRole('button')).not.toBeDisabled();
    });

    it('should transition between states', () => {
        const { rerender } = render(<LoadingButton isLoading={false}>Save</LoadingButton>);

        expect(screen.getByText('Save')).toBeInTheDocument();

        rerender(<LoadingButton isLoading={true}>Save</LoadingButton>);

        expect(screen.queryByText('Save')).not.toBeInTheDocument();
        expect(screen.getByText('Ładowanie...')).toBeInTheDocument();

        rerender(<LoadingButton isLoading={false}>Save</LoadingButton>);

        expect(screen.getByText('Save')).toBeInTheDocument();
    });
});

describe('CardSkeleton', () => {
    it('should render card skeleton', () => {
        render(<CardSkeleton />);

        const skeletons = screen.getAllByTestId('skeleton');
        expect(skeletons.length).toBe(3); // Title, description, content
    });

    it('should have different skeleton sizes', () => {
        render(<CardSkeleton />);

        const skeletons = screen.getAllByTestId('skeleton');

        // Title skeleton
        expect(skeletons[0]).toHaveClass('w-3/4');

        // Description skeleton
        expect(skeletons[1]).toHaveClass('w-1/2');

        // Content skeleton
        expect(skeletons[2]).toHaveClass('w-full');
    });

    it('should be wrapped in Card component', () => {
        const { container } = render(<CardSkeleton />);

        const card = container.querySelector('.rounded-xl.border.bg-card');
        expect(card).toBeInTheDocument();
    });
});

describe('Loading states in context', () => {
    it('should show loading while data is being fetched', () => {
        const isLoading = true;

        render(
            <div>
                {isLoading ? (
                    <CardSkeleton />
                ) : (
                    <Card>
                        <CardContent>Actual content</CardContent>
                    </Card>
                )}
            </div>
        );

        expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
        expect(screen.queryByText('Actual content')).not.toBeInTheDocument();
    });

    it('should show content after loading completes', () => {
        const isLoading = false;

        render(
            <div>
                {isLoading ? (
                    <CardSkeleton />
                ) : (
                    <Card>
                        <CardContent>Actual content</CardContent>
                    </Card>
                )}
            </div>
        );

        expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
        expect(screen.getByText('Actual content')).toBeInTheDocument();
    });

    it('should render multiple skeletons for list loading', () => {
        const itemCount = 3;

        render(
            <div className="space-y-4">
                {Array.from({ length: itemCount }).map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>
        );

        // 3 cards × 3 skeletons each = 9 total
        expect(screen.getAllByTestId('skeleton').length).toBe(9);
    });
});

describe('Accessibility for loading states', () => {
    it('should have accessible loading indicator', () => {
        render(<LoadingSpinner />);

        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should announce loading to screen readers', () => {
        render(
            <div aria-busy="true" aria-live="polite">
                <LoadingSpinner />
                <span className="sr-only">Loading content</span>
            </div>
        );

        expect(screen.getByText('Loading content')).toBeInTheDocument();
    });

    it('should disable button during loading', () => {
        render(<LoadingButton isLoading={true}>Action</LoadingButton>);

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });
});