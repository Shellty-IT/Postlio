import { test as base, expect, Page, BrowserContext } from '@playwright/test';

// ============================================================
// TYPES
// ============================================================

interface TestUser {
    email: string;
    password: string;
    fullName: string;
}

interface TestBrand {
    name: string;
    description: string;
    industry: string;
}

interface AuthFixtures {
    authenticatedPage: Page;
    testUser: TestUser;
}

interface DataFixtures {
    testBrand: TestBrand;
}

// ============================================================
// TEST DATA
// ============================================================

export const TEST_USER: TestUser = {
    email: 'e2e-test@postlio.app',
    password: 'TestPassword123!',
    fullName: 'E2E Test User',
};

export const TEST_BRAND: TestBrand = {
    name: 'E2E Test Brand',
    description: 'Brand created for E2E testing',
    industry: 'technology',
};

// ============================================================
// CUSTOM FIXTURES
// ============================================================

export const test = base.extend<AuthFixtures & DataFixtures>({
    // Test user data
    testUser: async ({}, use) => {
        await use(TEST_USER);
    },

    // Test brand data
    testBrand: async ({}, use) => {
        await use(TEST_BRAND);
    },

    // Authenticated page - logs in before test
    authenticatedPage: async ({ page, testUser }, use) => {
        // Go to login page
        await page.goto('/login');

        // Fill login form
        await page.getByLabel(/email/i).fill(testUser.email);
        await page.getByLabel(/hasło|password/i).fill(testUser.password);

        // Submit
        await page.getByRole('button', { name: /zaloguj|login/i }).click();

        // Wait for redirect to dashboard
        await page.waitForURL('**/dashboard', { timeout: 10000 });

        // Verify we're logged in
        await expect(page).toHaveURL(/dashboard/);

        await use(page);
    },
});

export { expect };

// ============================================================
// PAGE OBJECT MODELS
// ============================================================

export class LoginPage {
    constructor(private page: Page) {}

    async goto(): Promise<void> {
        await this.page.goto('/login');
    }

    async login(email: string, password: string): Promise<void> {
        await this.page.getByLabel(/email/i).fill(email);
        await this.page.getByLabel(/hasło|password/i).fill(password);
        await this.page.getByRole('button', { name: /zaloguj|login/i }).click();
    }

    async expectError(message: string | RegExp): Promise<void> {
        await expect(this.page.getByText(message)).toBeVisible();
    }

    async expectLoggedIn(): Promise<void> {
        await expect(this.page).toHaveURL(/dashboard/);
    }
}

export class RegisterPage {
    constructor(private page: Page) {}

    async goto(): Promise<void> {
        await this.page.goto('/register');
    }

    async register(fullName: string, email: string, password: string): Promise<void> {
        await this.page.getByLabel(/imię|name/i).fill(fullName);
        await this.page.getByLabel(/email/i).fill(email);
        await this.page.getByLabel(/hasło|password/i).first().fill(password);

        // If there's a confirm password field
        const confirmPassword = this.page.getByLabel(/potwierdź|confirm/i);
        if (await confirmPassword.isVisible()) {
            await confirmPassword.fill(password);
        }

        await this.page.getByRole('button', { name: /zarejestruj|register|utwórz/i }).click();
    }

    async expectError(message: string | RegExp): Promise<void> {
        await expect(this.page.getByText(message)).toBeVisible();
    }

    async expectRegistered(): Promise<void> {
        await expect(this.page).toHaveURL(/dashboard/);
    }
}

export class DashboardPage {
    constructor(private page: Page) {}

    async goto(): Promise<void> {
        await this.page.goto('/dashboard');
    }

    async expectLoaded(): Promise<void> {
        // Wait for main content to load
        await expect(this.page.getByRole('main')).toBeVisible();

        // Check for dashboard elements
        await expect(
            this.page.getByRole('heading').filter({ hasText: /dashboard|panel/i })
        ).toBeVisible({ timeout: 10000 });
    }

    async navigateTo(section: 'creator' | 'calendar' | 'brands' | 'autopilot' | 'settings'): Promise<void> {
        await this.page.getByRole('link', { name: new RegExp(section, 'i') }).click();
        await this.page.waitForURL(`**/${section}`);
    }

    async expectStatsCards(): Promise<void> {
        await expect(this.page.getByText(/wszystkie posty|total posts/i)).toBeVisible();
        await expect(this.page.getByText(/zaplanowane|scheduled/i)).toBeVisible();
        await expect(this.page.getByText(/opublikowane|published/i)).toBeVisible();
    }
}

export class CreatorPage {
    constructor(private page: Page) {}

    async goto(): Promise<void> {
        await this.page.goto('/creator');
    }

    async expectLoaded(): Promise<void> {
        await expect(
            this.page.getByRole('heading').filter({ hasText: /kreator|creator/i })
        ).toBeVisible({ timeout: 10000 });
    }

    async selectPlatform(platform: 'facebook' | 'instagram' | 'linkedin'): Promise<void> {
        await this.page.getByRole('button', { name: new RegExp(platform, 'i') }).click();
    }

    async fillContent(content: string): Promise<void> {
        await this.page.getByRole('textbox', { name: /treść|content/i }).fill(content);
    }

    async generateWithAI(topic: string): Promise<void> {
        // Click AI generate button
        await this.page.getByRole('button', { name: /generuj|generate|ai/i }).click();

        // Fill topic if modal appears
        const topicInput = this.page.getByPlaceholder(/temat|topic/i);
        if (await topicInput.isVisible()) {
            await topicInput.fill(topic);
            await this.page.getByRole('button', { name: /generuj|generate/i }).click();
        }

        // Wait for content to be generated
        await this.page.waitForResponse((response) =>
            response.url().includes('/ai/generate') && response.status() === 200
        );
    }

    async expectPreview(): Promise<void> {
        await expect(this.page.getByTestId('post-preview')).toBeVisible();
    }
}

export class AutopilotPage {
    constructor(private page: Page) {}

    async goto(): Promise<void> {
        await this.page.goto('/autopilot');
    }

    async expectLoaded(): Promise<void> {
        await expect(
            this.page.getByRole('heading').filter({ hasText: /autopilot/i })
        ).toBeVisible({ timeout: 10000 });
    }

    async createConfig(brandName: string): Promise<void> {
        await this.page.getByRole('button', { name: /nowa konfiguracja|new config|utwórz/i }).click();

        // Select brand
        await this.page.getByRole('combobox', { name: /marka|brand/i }).click();
        await this.page.getByRole('option', { name: new RegExp(brandName, 'i') }).click();

        // Submit
        await this.page.getByRole('button', { name: /zapisz|save|utwórz/i }).click();
    }

    async toggleAutopilot(enable: boolean): Promise<void> {
        const toggle = this.page.getByRole('switch', { name: /aktywny|active/i });
        const isChecked = await toggle.isChecked();

        if (enable !== isChecked) {
            await toggle.click();
        }
    }

    async expectQueueItems(): Promise<void> {
        await expect(this.page.getByText(/kolejka|queue/i)).toBeVisible();
    }
}

export class BrandsPage {
    constructor(private page: Page) {}

    async goto(): Promise<void> {
        await this.page.goto('/brands');
    }

    async expectLoaded(): Promise<void> {
        await expect(
            this.page.getByRole('heading').filter({ hasText: /marki|brands/i })
        ).toBeVisible({ timeout: 10000 });
    }

    async createBrand(name: string, description: string): Promise<void> {
        await this.page.getByRole('button', { name: /nowa marka|new brand|dodaj/i }).click();

        await this.page.getByLabel(/nazwa|name/i).fill(name);
        await this.page.getByLabel(/opis|description/i).fill(description);

        await this.page.getByRole('button', { name: /zapisz|save|utwórz/i }).click();
    }

    async expectBrand(name: string): Promise<void> {
        await expect(this.page.getByText(name)).toBeVisible();
    }

    async deleteBrand(name: string): Promise<void> {
        const brandCard = this.page.getByText(name).locator('..');
        await brandCard.getByRole('button', { name: /usuń|delete/i }).click();

        // Confirm deletion
        await this.page.getByRole('button', { name: /potwierdź|confirm|tak/i }).click();
    }
}

export class SettingsPage {
    constructor(private page: Page) {}

    async goto(): Promise<void> {
        await this.page.goto('/settings');
    }

    async expectLoaded(): Promise<void> {
        await expect(
            this.page.getByRole('heading').filter({ hasText: /ustawienia|settings/i })
        ).toBeVisible({ timeout: 10000 });
    }

    async connectSocialAccount(platform: 'facebook' | 'instagram' | 'linkedin'): Promise<void> {
        await this.page.getByRole('button', { name: new RegExp(`połącz.*${platform}|connect.*${platform}`, 'i') }).click();
    }

    async expectConnectedAccount(platform: string): Promise<void> {
        await expect(this.page.getByText(new RegExp(`${platform}.*połączono|connected`, 'i'))).toBeVisible();
    }

    async changeTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
        await this.page.getByRole('combobox', { name: /motyw|theme/i }).click();
        await this.page.getByRole('option', { name: new RegExp(theme, 'i') }).click();
    }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export async function mockApiResponse(
    page: Page,
    url: string | RegExp,
    response: object,
    status = 200
): Promise<void> {
    await page.route(url, (route) =>
        route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify(response),
        })
    );
}

export async function waitForToast(page: Page, message: string | RegExp): Promise<void> {
    await expect(page.getByText(message)).toBeVisible({ timeout: 5000 });
}

export async function clearLocalStorage(page: Page): Promise<void> {
    await page.evaluate(() => localStorage.clear());
}

export async function setLocalStorage(page: Page, key: string, value: string): Promise<void> {
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value]);
}