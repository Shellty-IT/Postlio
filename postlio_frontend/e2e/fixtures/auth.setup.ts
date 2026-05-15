import { test as setup, expect } from '@playwright/test';

const TEST_USER = {
    email: 'e2e-test@postlio.app',
    password: 'TestPassword123!',
    fullName: 'E2E Test User',
};

const authFile = 'playwright/.auth/user.json';

/**
 * Setup: Create authenticated state to reuse across tests.
 *
 * This runs once before all tests and saves the auth state.
 */
setup('authenticate', async ({ page }) => {
    // Go to login page
    await page.goto('/login');

    // Try to login
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/hasło|password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /zaloguj|login/i }).click();

    // Wait for either success or error
    await Promise.race([
        page.waitForURL('**/dashboard', { timeout: 10000 }),
        page.waitForSelector('[data-testid="error-message"], [role="alert"]', { timeout: 10000 }),
    ]);

    // If login failed (user doesn't exist), register first
    if (page.url().includes('login')) {
        console.log('User not found, registering...');

        await page.goto('/register');

        // Fill registration form
        const nameInput = page.getByLabel(/imię|name/i);
        if (await nameInput.isVisible()) {
            await nameInput.fill(TEST_USER.fullName);
        }

        await page.getByLabel(/email/i).fill(TEST_USER.email);

        // Handle password fields
        const passwordFields = page.getByLabel(/hasło|password/i);
        const count = await passwordFields.count();

        if (count >= 2) {
            await passwordFields.nth(0).fill(TEST_USER.password);
            await passwordFields.nth(1).fill(TEST_USER.password);
        } else {
            await passwordFields.first().fill(TEST_USER.password);
        }

        await page.getByRole('button', { name: /zarejestruj|register|utwórz/i }).click();

        // Wait for redirect after registration
        await page.waitForURL('**/dashboard', { timeout: 15000 });
    }

    // Verify we're on dashboard
    await expect(page).toHaveURL(/dashboard/);

    // Save signed-in state
    await page.context().storageState({ path: authFile });
});