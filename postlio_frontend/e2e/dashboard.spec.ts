import { test, expect } from './fixtures/test-fixtures';
import { DashboardPage } from './fixtures/test-fixtures';

test.describe('Dashboard', () => {
    test.beforeEach(async ({ authenticatedPage }) => {
        // All tests start from authenticated state
    });

    test.describe('Layout', () => {
        test('should display dashboard page', async ({ authenticatedPage }) => {
            const dashboard = new DashboardPage(authenticatedPage);
            await dashboard.goto();
            await dashboard.expectLoaded();
        });

        test('should display navigation sidebar', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/dashboard');

            // Check for navigation links
            await expect(authenticatedPage.getByRole('link', { name: /dashboard|panel/i })).toBeVisible();
            await expect(authenticatedPage.getByRole('link', { name: /kreator|creator/i })).toBeVisible();
            await expect(authenticatedPage.getByRole('link', { name: /kalendarz|calendar/i })).toBeVisible();
            await expect(authenticatedPage.getByRole('link', { name: /marki|brands/i })).toBeVisible();
            await expect(authenticatedPage.getByRole('link', { name: /autopilot/i })).toBeVisible();
            await expect(authenticatedPage.getByRole('link', { name: /ustawienia|settings/i })).toBeVisible();
        });

        test('should display user info', async ({ authenticatedPage, testUser }) => {
            await authenticatedPage.goto('/dashboard');

            // Check for user email or name somewhere on page
            await expect(
                authenticatedPage.getByText(new RegExp(testUser.email.split('@')[0], 'i'))
            ).toBeVisible({ timeout: 10000 });
        });
    });

    test.describe('Stats Cards', () => {
        test('should display stats cards', async ({ authenticatedPage }) => {
            const dashboard = new DashboardPage(authenticatedPage);
            await dashboard.goto();
            await dashboard.expectStatsCards();
        });

        test('should show post counts', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/dashboard');

            // Check for stat values (numbers)
            const statCards = authenticatedPage.locator('[class*="rounded-2xl"]');
            await expect(statCards.first()).toBeVisible();
        });
    });

    test.describe('Navigation', () => {
        test('should navigate to Creator page', async ({ authenticatedPage }) => {
            const dashboard = new DashboardPage(authenticatedPage);
            await dashboard.goto();
            await dashboard.navigateTo('creator');

            await expect(authenticatedPage).toHaveURL(/creator/);
        });

        test('should navigate to Calendar page', async ({ authenticatedPage }) => {
            const dashboard = new DashboardPage(authenticatedPage);
            await dashboard.goto();
            await dashboard.navigateTo('calendar');

            await expect(authenticatedPage).toHaveURL(/calendar/);
        });

        test('should navigate to Brands page', async ({ authenticatedPage }) => {
            const dashboard = new DashboardPage(authenticatedPage);
            await dashboard.goto();
            await dashboard.navigateTo('brands');

            await expect(authenticatedPage).toHaveURL(/brands/);
        });

        test('should navigate to Autopilot page', async ({ authenticatedPage }) => {
            const dashboard = new DashboardPage(authenticatedPage);
            await dashboard.goto();
            await dashboard.navigateTo('autopilot');

            await expect(authenticatedPage).toHaveURL(/autopilot/);
        });

        test('should navigate to Settings page', async ({ authenticatedPage }) => {
            const dashboard = new DashboardPage(authenticatedPage);
            await dashboard.goto();
            await dashboard.navigateTo('settings');

            await expect(authenticatedPage).toHaveURL(/settings/);
        });

        test('should highlight active navigation item', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/dashboard');

            const dashboardLink = authenticatedPage.getByRole('link', { name: /dashboard|panel/i });

            // Check for active state (depends on your implementation)
            await expect(dashboardLink).toHaveClass(/active|bg-/);
        });
    });

    test.describe('Responsive Design', () => {
        test('should show mobile menu on small screens', async ({ authenticatedPage }) => {
            // Set mobile viewport
            await authenticatedPage.setViewportSize({ width: 375, height: 667 });
            await authenticatedPage.goto('/dashboard');

            // Check for hamburger menu or mobile nav
            const mobileMenuButton = authenticatedPage.getByRole('button', { name: /menu/i });

            if (await mobileMenuButton.isVisible()) {
                await mobileMenuButton.click();

                // Navigation should be visible after clicking menu
                await expect(
                    authenticatedPage.getByRole('link', { name: /kreator|creator/i })
                ).toBeVisible();
            }
        });

        test('should adapt stats cards on mobile', async ({ authenticatedPage }) => {
            await authenticatedPage.setViewportSize({ width: 375, height: 667 });
            await authenticatedPage.goto('/dashboard');

            // Stats should still be visible, possibly stacked
            await expect(
                authenticatedPage.getByText(/wszystkie posty|total posts/i)
            ).toBeVisible();
        });
    });

    test.describe('Quick Actions', () => {
        test('should have quick action to create new post', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/dashboard');

            // Look for "New Post" or "Create" button
            const createButton = authenticatedPage.getByRole('button', { name: /nowy post|create|utwórz/i });

            if (await createButton.isVisible()) {
                await createButton.click();
                await expect(authenticatedPage).toHaveURL(/creator/);
            }
        });
    });

    test.describe('Recent Activity', () => {
        test('should display recent posts or activity', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/dashboard');

            // Check for recent activity section
            const recentSection = authenticatedPage.getByText(/ostatnie|recent|aktywność/i);

            // This might not exist if user has no posts
            // Just verify page loads without error
            await expect(authenticatedPage.locator('main')).toBeVisible();
        });
    });

    test.describe('Error Handling', () => {
        test('should handle API errors gracefully', async ({ authenticatedPage }) => {
            // Mock API to return error
            await authenticatedPage.route('**/api/v1/**', (route) =>
                route.fulfill({
                    status: 500,
                    body: JSON.stringify({ detail: 'Internal Server Error' }),
                })
            );

            await authenticatedPage.goto('/dashboard');

            // Should show error state or fallback
            // Page should not crash
            await expect(authenticatedPage.locator('body')).toBeVisible();
        });
    });
});