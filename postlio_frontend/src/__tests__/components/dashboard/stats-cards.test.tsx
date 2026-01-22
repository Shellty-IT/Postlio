/**
 * Tests for StatsCards component.
 *
 * Testuje wyświetlanie statystyk na dashboardzie.
 */
import { render, screen } from '@testing-library/react';
import { StatsCards } from '@/components/dashboard/stats-cards';

// Define the stats type to match what the component expects
interface StatsCardData {
    totalPosts: number;
    scheduledPosts: number;
    publishedPosts: number;
    engagementRate: number;
    totalPostsChange?: number;
    scheduledPostsChange?: number;
    publishedPostsChange?: number;
    engagementChange?: number;
}

describe('StatsCards', () => {
    describe('rendering with default data', () => {
        it('should render all four stat cards', () => {
            render(<StatsCards />);

            expect(screen.getByText('Wszystkie posty')).toBeInTheDocument();
            expect(screen.getByText('Zaplanowane')).toBeInTheDocument();
            expect(screen.getByText('Opublikowane')).toBeInTheDocument();
            expect(screen.getByText('Engagement')).toBeInTheDocument();
        });

        it('should display mock values when no stats provided', () => {
            render(<StatsCards />);

            // Default mock values
            expect(screen.getByText('47')).toBeInTheDocument(); // totalPosts
            expect(screen.getByText('12')).toBeInTheDocument(); // scheduledPosts
            expect(screen.getByText('35')).toBeInTheDocument(); // publishedPosts
            expect(screen.getByText('4.8%')).toBeInTheDocument(); // engagementRate
        });

        it('should display change labels', () => {
            render(<StatsCards />);

            expect(screen.getByText('vs poprzedni miesiąc')).toBeInTheDocument();
            expect(screen.getByText('do publikacji')).toBeInTheDocument();
            expect(screen.getByText('w tym miesiącu')).toBeInTheDocument();
            expect(screen.getByText('średni współczynnik')).toBeInTheDocument();
        });
    });

    describe('rendering with custom stats', () => {
        const customStats: StatsCardData = {
            totalPosts: 100,
            scheduledPosts: 25,
            publishedPosts: 75,
            engagementRate: 6.5,
            totalPostsChange: 20,
            scheduledPostsChange: -5,
            publishedPostsChange: 30,
            engagementChange: 10,
        };

        it('should display custom values', () => {
            render(<StatsCards stats={customStats} />);

            expect(screen.getByText('100')).toBeInTheDocument();
            expect(screen.getByText('25')).toBeInTheDocument();
            expect(screen.getByText('75')).toBeInTheDocument();
            expect(screen.getByText('6.5%')).toBeInTheDocument();
        });

        it('should display positive changes correctly', () => {
            render(<StatsCards stats={customStats} />);

            // 20% change should be shown
            expect(screen.getByText('20%')).toBeInTheDocument();
            expect(screen.getByText('30%')).toBeInTheDocument();
            expect(screen.getByText('10%')).toBeInTheDocument();
        });

        it('should display negative changes correctly', () => {
            render(<StatsCards stats={customStats} />);

            // -5% should be shown as 5%
            expect(screen.getByText('5%')).toBeInTheDocument();
        });
    });

    describe('change indicators', () => {
        it('should show positive change with correct styling', () => {
            const stats: StatsCardData = {
                totalPosts: 50,
                scheduledPosts: 10,
                publishedPosts: 40,
                engagementRate: 5,
                totalPostsChange: 15,
                scheduledPostsChange: 0,
                publishedPostsChange: 0,
                engagementChange: 0,
            };

            render(<StatsCards stats={stats} />);

            // Find the container with 15%
            const changeElement = screen.getByText('15%').closest('div');
            expect(changeElement).toHaveClass('text-success');
        });

        it('should show negative change with correct styling', () => {
            const stats: StatsCardData = {
                totalPosts: 50,
                scheduledPosts: 10,
                publishedPosts: 40,
                engagementRate: 5,
                totalPostsChange: -10,
                scheduledPostsChange: 0,
                publishedPostsChange: 0,
                engagementChange: 0,
            };

            render(<StatsCards stats={stats} />);

            // Find the container with 10%
            const changeElement = screen.getByText('10%').closest('div');
            expect(changeElement).toHaveClass('text-destructive');
        });
    });

    describe('grid layout', () => {
        it('should render in a grid container', () => {
            const { container } = render(<StatsCards />);

            const grid = container.firstChild;
            expect(grid).toHaveClass('grid');
            expect(grid).toHaveClass('gap-4');
        });

        it('should have responsive grid columns', () => {
            const { container } = render(<StatsCards />);

            const grid = container.firstChild;
            expect(grid).toHaveClass('sm:grid-cols-2');
            expect(grid).toHaveClass('lg:grid-cols-4');
        });
    });

    describe('card styling', () => {
        it('should render cards with proper styling', () => {
            const { container } = render(<StatsCards />);

            // Each card should have rounded corners and border
            const cards = container.querySelectorAll('.rounded-2xl');
            expect(cards.length).toBe(4);
        });

        it('should have hover effects', () => {
            const { container } = render(<StatsCards />);

            const cards = container.querySelectorAll('.hover\\:shadow-lg');
            expect(cards.length).toBe(4);
        });
    });

    describe('icons', () => {
        it('should render icons for each stat card', () => {
            const { container } = render(<StatsCards />);

            // Check that SVG icons are rendered
            const icons = container.querySelectorAll('svg');
            expect(icons.length).toBeGreaterThanOrEqual(4); // At least one icon per card
        });
    });

    describe('color variants', () => {
        it('should apply blue color to first card', () => {
            const { container } = render(<StatsCards />);

            const firstCard = container.querySelector('.border-primary\\/20');
            expect(firstCard).toBeInTheDocument();
        });

        it('should apply different colors to each card', () => {
            const { container } = render(<StatsCards />);

            // Check that different color classes are applied
            expect(container.querySelector('.border-primary\\/20')).toBeInTheDocument();
            expect(container.querySelector('.border-accent\\/20')).toBeInTheDocument();
            expect(container.querySelector('.border-success\\/20')).toBeInTheDocument();
            expect(container.querySelector('.border-warning\\/20')).toBeInTheDocument();
        });
    });

    describe('accessibility', () => {
        it('should have accessible text content', () => {
            render(<StatsCards />);

            // All important text should be readable
            expect(screen.getByText('Wszystkie posty')).toBeVisible();
            expect(screen.getByText('Zaplanowane')).toBeVisible();
            expect(screen.getByText('Opublikowane')).toBeVisible();
            expect(screen.getByText('Engagement')).toBeVisible();
        });

        it('should have semantic structure', () => {
            render(<StatsCards />);

            // Values should be in headings (h3)
            const headings = screen.getAllByRole('heading', { level: 3 });
            expect(headings.length).toBe(4);
        });
    });

    describe('edge cases', () => {
        it('should handle zero values', () => {
            const stats: StatsCardData = {
                totalPosts: 0,
                scheduledPosts: 0,
                publishedPosts: 0,  // ← było publishedThisMonth, musi być publishedPosts
                engagementRate: 0,
            };

            render(<StatsCards stats={stats} />);

            // Use getAllByText since there are multiple "0" values
            const zeroElements = screen.getAllByText('0');
            expect(zeroElements.length).toBeGreaterThanOrEqual(3);
            expect(screen.getByText('0%')).toBeInTheDocument();
        });

        it('should handle large numbers', () => {
            const stats: StatsCardData = {
                totalPosts: 999999,
                scheduledPosts: 50000,
                publishedPosts: 949999,
                engagementRate: 99.9,
            };

            render(<StatsCards stats={stats} />);

            expect(screen.getByText('999999')).toBeInTheDocument();
            expect(screen.getByText('99.9%')).toBeInTheDocument();
        });

        it('should handle decimal engagement rate', () => {
            const stats: StatsCardData = {
                totalPosts: 10,
                scheduledPosts: 5,
                publishedPosts: 5,
                engagementRate: 3.14159,
            };

            render(<StatsCards stats={stats} />);

            expect(screen.getByText('3.14159%')).toBeInTheDocument();
        });

        it('should handle undefined changes', () => {
            const stats: StatsCardData = {
                totalPosts: 10,
                scheduledPosts: 5,
                publishedPosts: 5,
                engagementRate: 5,
                // No change values provided
            };

            render(<StatsCards stats={stats} />);

            // Should still render without errors
            expect(screen.getByText('10')).toBeInTheDocument();
        });
    });
});

describe('StatCard (internal component)', () => {
    // Note: StatCard is not exported, so we test it through StatsCards
    // If you need to test StatCard directly, export it from the module

    it('should render stat card with all props via StatsCards', () => {
        const stats: StatsCardData = {
            totalPosts: 42,
            scheduledPosts: 10,
            publishedPosts: 32,
            engagementRate: 5.5,
            totalPostsChange: 15,
            scheduledPostsChange: -3,
            publishedPostsChange: 20,
            engagementChange: 0,
        };

        render(<StatsCards stats={stats} />);

        // Verify all cards are rendered correctly
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('32')).toBeInTheDocument();
        expect(screen.getByText('5.5%')).toBeInTheDocument();
    });
});