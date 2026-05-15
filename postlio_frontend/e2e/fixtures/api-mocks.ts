// e2e/fixtures/api-mocks.ts
import { Page, Route } from '@playwright/test';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Mock data
export const mockUser = {
    id: 'mock-user-123',
    email: 'test@postlio.app',
    full_name: 'Test User',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

export const mockBrands = [
    {
        id: 'brand-1',
        name: 'Test Brand',
        description: 'A test brand for E2E testing',
        categories: ['lifestyle', 'technology'],
        target_audience: 'Young professionals',
        voice_dna: {
            tone: 0.7,
            formality: 0.5,
            humor: 0.3,
            expertise: 0.8,
            empathy: 0.6,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

export const mockPosts = [
    {
        id: 'post-1',
        content: 'This is a test post content',
        platforms: ['facebook', 'instagram'],
        status: 'draft',
        brand_id: 'brand-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

export const mockStats = {
    total_posts: 42,
    published_posts: 28,
    draft_posts: 14,
    total_brands: 3,
    connected_accounts: 2,
    ai_generations: 156,
};

export const mockSocialAccounts = [
    {
        id: 'social-1',
        platform: 'facebook',
        account_type: 'facebook_page',
        account_name: 'Test Page',
        is_connected: true,
        can_autopublish: true,
    },
    {
        id: 'social-2',
        platform: 'instagram',
        account_type: 'instagram_business',
        account_name: '@testaccount',
        is_connected: true,
        can_autopublish: true,
    },
];

/**
 * Setup API mocking for a page.
 */
export async function setupApiMocks(page: Page): Promise<void> {
    // Auth endpoints
    await page.route(`${API_BASE}/auth/me`, async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockUser),
        });
    });

    await page.route(`${API_BASE}/auth/login`, async (route: Route) => {
        const request = route.request();
        const body = request.postDataJSON();

        if (body?.email === 'test@postlio.app' && body?.password === 'TestPassword123!') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    access_token: 'mock-jwt-token',
                    token_type: 'bearer',
                    user: mockUser,
                }),
            });
        } else {
            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({ detail: 'Invalid credentials' }),
            });
        }
    });

    // Brands endpoints
    await page.route(`${API_BASE}/brands`, async (route: Route) => {
        if (route.request().method() === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockBrands),
            });
        } else if (route.request().method() === 'POST') {
            const body = route.request().postDataJSON();
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'brand-new',
                    ...body,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }),
            });
        }
    });

    await page.route(`${API_BASE}/brands/*`, async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockBrands[0]),
        });
    });

    // Posts endpoints
    await page.route(`${API_BASE}/posts`, async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockPosts),
        });
    });

    await page.route(`${API_BASE}/posts/calendar*`, async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockPosts),
        });
    });

    // Stats endpoint
    await page.route(`${API_BASE}/stats`, async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockStats),
        });
    });

    await page.route(`${API_BASE}/dashboard/stats`, async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockStats),
        });
    });

    // Social accounts
    await page.route(`${API_BASE}/social/accounts`, async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockSocialAccounts),
        });
    });

    // AI endpoints
    await page.route(`${API_BASE}/ai/generate`, async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                content: 'This is AI generated content for your post! 🚀',
                hashtags: ['#postlio', '#socialmedia', '#ai'],
                suggestions: ['Add an image', 'Include a call to action'],
            }),
        });
    });

    await page.route(`${API_BASE}/ai/image`, async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                url: 'https://picsum.photos/800/600',
                prompt: 'Generated image',
            }),
        });
    });

    // Autopilot endpoints
    await page.route(`${API_BASE}/autopilot/config`, async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                is_enabled: false,
                frequency: 'daily',
                time_slots: ['09:00', '14:00', '19:00'],
                platforms: ['facebook', 'instagram'],
                brand_id: 'brand-1',
            }),
        });
    });

    await page.route(`${API_BASE}/autopilot/queue`, async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        });
    });

    // Catch-all for unhandled API requests
    await page.route(`${API_BASE}/**`, async (route: Route) => {
        console.log(`[Mock] Unhandled API request: ${route.request().method()} ${route.request().url()}`);
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Mocked response' }),
        });
    });
}

/**
 * Setup API mock that simulates errors.
 */
export async function setupApiMocksWithError(page: Page, endpoint: string, error: { status: number; message: string }): Promise<void> {
    await page.route(`${API_BASE}${endpoint}`, async (route: Route) => {
        await route.fulfill({
            status: error.status,
            contentType: 'application/json',
            body: JSON.stringify({ detail: error.message }),
        });
    });
}