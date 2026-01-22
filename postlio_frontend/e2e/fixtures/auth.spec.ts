import { test, expect, Page } from '@playwright/test';

const TEST_USER = {
    email: 'e2e-test@postlio.app',
    password: 'TestPassword123!',
    fullName: 'E2E Test User',
};

// Page Object for Login
class LoginPage {
    constructor(private page: Page) {}

    async goto(): Promise<void> {
        await this.page.goto('/login');
    }

    async login(email: string, password: string): Promise<void> {
        await this.page.getByLabel(/email/i).fill(email);
        await this.page.getByLabel(/hasło|password/i).fill(password);
        await this.page.getByRole('button', { name: /zaloguj|login/i }).click();
    }

    async expectLoggedIn(): Promise<void> {
        await expect(this.page).toHaveURL(/dashboard/);
    }
}

// Page Object for Register
class RegisterPage {
    constructor(private page: Page) {}

    async goto(): Promise<void> {
        await this.page.goto('/register');
    }

    async register(fullName: string, email: string, password: string): Promise<void> {
        const nameInput = this.page.getByLabel(/imię|name/i);
        if (await nameInput.isVisible()) {
            await nameInput.fill(fullName);
        }
        await this.page.getByLabel(/email/i).fill(email);
        await this.page.getByLabel(/hasło|password/i).first().fill(password);

        const confirmPassword = this.page.getByLabel(/potwierdź|confirm/i);
        if (await confirmPassword.isVisible()) {
            await confirmPassword.fill(password);
        }

        await this.page.getByRole('button', { name: /zarejestruj|register|utwórz/i }).click();
    }
}

test.describe('Authentication', () => {
    test.describe('Login', () => {
        test('should display login form', async ({ page }: { page: Page }) => {
            const loginPage = new LoginPage(page);
            await loginPage.goto();

            await expect(page.getByRole('heading', { name: /zaloguj|login/i })).toBeVisible();
            await expect(page.getByLabel(/email/i)).toBeVisible();
            await expect(page.getByLabel(/hasło|password/i)).toBeVisible();
            await expect(page.getByRole('button', { name: /zaloguj|login/i })).toBeVisible();
        });

        test('should show error for invalid credentials', async ({ page }: { page: Page }) => {
            const loginPage = new LoginPage(page);
            await loginPage.goto();

            await loginPage.login('wrong@email.com', 'wrongpassword');

            // Should show error message
            await expect(page.getByText(/nieprawidłowy|incorrect|błąd/i)).toBeVisible({
                timeout: 10000,
            });

            // Should stay on login page
            await expect(page).toHaveURL(/login/);
        });

        test('should show validation error for empty fields', async ({ page }: { page: Page }) => {
            const loginPage = new LoginPage(page);
            await loginPage.goto();

            // Try to submit without filling fields
            await page.getByRole('button', { name: /zaloguj|login/i }).click();

            // HTML5 validation or custom validation should prevent submission
            await expect(page).toHaveURL(/login/);
        });

        test('should show validation error for invalid email format', async ({ page }: { page: Page }) => {
            const loginPage = new LoginPage(page);
            await loginPage.goto();

            await page.getByLabel(/email/i).fill('notanemail');
            await page.getByLabel(/hasło|password/i).fill('password123');
            await page.getByRole('button', { name: /zaloguj|login/i }).click();

            // Should show validation error or stay on page
            await expect(page).toHaveURL(/login/);
        });

        test('should redirect to dashboard after successful login', async ({ page }: { page: Page }) => {
            const loginPage = new LoginPage(page);
            await loginPage.goto();

            await loginPage.login(TEST_USER.email, TEST_USER.password);
            await loginPage.expectLoggedIn();
        });

        test('should have link to registration', async ({ page }: { page: Page }) => {
            await page.goto('/login');

            const registerLink = page.getByRole('link', { name: /zarejestruj|register|utwórz konto/i });
            await expect(registerLink).toBeVisible();

            await registerLink.click();
            await expect(page).toHaveURL(/register/);
        });
    });

    test.describe('Registration', () => {
        test('should display registration form', async ({ page }: { page: Page }) => {
            const registerPage = new RegisterPage(page);
            await registerPage.goto();

            await expect(page.getByRole('heading', { name: /zarejestruj|register|rejestracja/i })).toBeVisible();
            await expect(page.getByLabel(/email/i)).toBeVisible();
            await expect(page.getByRole('button', { name: /zarejestruj|register|utwórz/i })).toBeVisible();
        });

        test('should show error for existing email', async ({ page }: { page: Page }) => {
            const registerPage = new RegisterPage(page);
            await registerPage.goto();

            // Try to register with existing email
            await registerPage.register(TEST_USER.fullName, TEST_USER.email, TEST_USER.password);

            // Should show error
            await expect(page.getByText(/istnieje|exists|zajęty/i)).toBeVisible({
                timeout: 10000,
            });
        });

        test('should show validation for weak password', async ({ page }: { page: Page }) => {
            const registerPage = new RegisterPage(page);
            await registerPage.goto();

            await registerPage.register('Test User', 'newuser@test.com', '123');

            // Should show password validation error
            await expect(page.getByText(/hasło|password/i)).toBeVisible();
            await expect(page).toHaveURL(/register/);
        });

        test('should have link to login', async ({ page }: { page: Page }) => {
            await page.goto('/register');

            const loginLink = page.getByRole('link', { name: /zaloguj|login|masz już konto/i });
            await expect(loginLink).toBeVisible();

            await loginLink.click();
            await expect(page).toHaveURL(/login/);
        });
    });

    test.describe('Protected Routes', () => {
        test('should redirect to login when accessing dashboard without auth', async ({ page }: { page: Page }) => {
            // Clear any existing auth
            await page.context().clearCookies();
            await page.evaluate(() => localStorage.clear());

            await page.goto('/dashboard');

            // Should redirect to login
            await expect(page).toHaveURL(/login/);
        });

        test('should redirect to login when accessing creator without auth', async ({ page }: { page: Page }) => {
            await page.context().clearCookies();
            await page.evaluate(() => localStorage.clear());

            await page.goto('/creator');

            await expect(page).toHaveURL(/login/);
        });

        test('should redirect to login when accessing settings without auth', async ({ page }: { page: Page }) => {
            await page.context().clearCookies();
            await page.evaluate(() => localStorage.clear());

            await page.goto('/settings');

            await expect(page).toHaveURL(/login/);
        });
    });
});