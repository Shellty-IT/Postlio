// e2e/fixtures/mocked.setup.ts
import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/mocked-user.json';

/**
 * Setup for mocked tests - creates fake auth state without real backend.
 */
setup('mock authenticate', async ({ page }) => {
    // Go to app to initialize storage
    await page.goto('/');

    // Set up mocked auth state in localStorage
    await page.evaluate(() => {
        const mockUser = {
            id: 'mock-user-123',
            email: 'test@postlio.app',
            fullName: 'Test User',
            createdAt: new Date().toISOString(),
        };

        const mockToken = 'mock-jwt-token-for-testing';

        localStorage.setItem('auth-storage', JSON.stringify({
            state: {
                user: mockUser,
                token: mockToken,
                isAuthenticated: true,
            },
            version: 0,
        }));
    });

    // Save the storage state
    await page.context().storageState({ path: authFile });
});