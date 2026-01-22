// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';

export default defineConfig({
    testDir: './e2e',
    testMatch: '**/*.spec.ts',
    timeout: 30 * 1000,

    expect: {
        timeout: 10000,
    },

    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,

    reporter: [
        ['html', { open: 'never' }],
        ['list'],
    ],

    use: {
        baseURL: BASE_URL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        locale: 'pl-PL',
        timezoneId: 'Europe/Warsaw',
        navigationTimeout: 15000,
        actionTimeout: 10000,
    },

    projects: [
        {
            name: 'public',
            testMatch: /public\/.*\.spec\.ts/,
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'mobile',
            testMatch: /public\/.*\.spec\.ts/,
            use: { ...devices['iPhone 12'] },
        },
    ],

    outputDir: 'test-results/',
});