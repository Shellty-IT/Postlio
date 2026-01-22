/**
 * Test utilities for React Testing Library.
 * Provides custom render with all necessary providers.
 */
import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';

// Create a new QueryClient for each test
const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
                staleTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });

// All providers wrapper
interface AllProvidersProps {
    children: ReactNode;
}

function AllProviders({ children }: AllProvidersProps) {
    const queryClient = createTestQueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                {children}
            </ThemeProvider>
        </QueryClientProvider>
    );
}

// Custom render function
function customRender(
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
    return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override render with custom render
export { customRender as render };

// Export query client creator for tests that need direct access
export { createTestQueryClient };

// ============================================================
// MOCK FACTORIES
// ============================================================

export const mockUser = (overrides = {}) => ({
    id: 1,
    email: 'test@example.com',
    full_name: 'Test User',
    is_active: true,
    is_verified: true,
    created_at: new Date().toISOString(),
    ...overrides,
});

export const mockBrand = (overrides = {}) => ({
    id: 1,
    user_id: 1,
    name: 'Test Brand',
    description: 'A test brand',
    industry: 'technology',
    voice_dna: {
        formality: 50,
        energy: 60,
        humor: 30,
    },
    is_active: true,
    created_at: new Date().toISOString(),
    ...overrides,
});

export const mockSocialAccount = (overrides = {}) => ({
    id: 1,
    user_id: 1,
    platform: 'facebook',
    account_type: 'facebook_page',
    platform_username: 'testpage',
    page_name: 'Test Page',
    is_active: true,
    ...overrides,
});

export const mockAutopilotConfig = (overrides = {}) => ({
    id: 1,
    user_id: 1,
    brand_id: 1,
    posts_per_week: 5,
    schedule_days: ['monday', 'wednesday', 'friday'],
    schedule_time: '10:00',
    platforms: ['facebook', 'instagram'],
    categories: ['technology'],
    creativity_level: 60,
    post_length: 'medium',
    include_images: true,
    include_hashtags: true,
    is_active: true,
    is_paused: false,
    ...overrides,
});

export const mockQueueItem = (overrides = {}) => ({
    id: 1,
    config_id: 1,
    user_id: 1,
    brand_id: 1,
    platform: 'facebook',
    content: 'Test post content',
    hashtags: ['test', 'postlio'],
    status: 'pending',
    scheduled_for: new Date(Date.now() + 3600000).toISOString(),
    ...overrides,
});

export const mockPost = (overrides = {}) => ({
    id: 1,
    user_id: 1,
    brand_id: 1,
    content: 'Test post content',
    platforms: ['facebook'],
    status: 'draft',
    created_at: new Date().toISOString(),
    ...overrides,
});

// ============================================================
// MOCK API RESPONSES
// ============================================================

export const mockApiSuccess = <T,>(data: T) => ({
    ok: true,
    json: () => Promise.resolve(data),
    status: 200,
});

export const mockApiError = (status: number, message: string) => ({
    ok: false,
    json: () => Promise.resolve({ detail: message }),
    status,
});

// ============================================================
// WAIT UTILITIES
// ============================================================

export const waitForLoadingToFinish = () =>
    new Promise((resolve) => setTimeout(resolve, 0));

export const flushPromises = () =>
    new Promise((resolve) => setImmediate(resolve));