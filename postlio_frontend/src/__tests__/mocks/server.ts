/**
 * MSW server setup for tests.
 *
 * This file sets up the MSW server for intercepting API calls in tests.
 * Import and use setupMswServer() in test files that need API mocking.
 */

// Note: We use dynamic require to avoid issues with MSW in different environments
let server: any = null;

try {
    // Only import MSW in Node environment
    if (typeof window === 'undefined') {
        const { setupServer } = require('msw/node');
        const { handlers } = require('./handlers');
        server = setupServer(...handlers);
    }
} catch (error) {
    // MSW not available or not in Node environment
    console.warn('MSW server not available:', error);
}

export { server };

/**
 * Setup MSW server for tests.
 * Call this in your test file's beforeAll/afterEach/afterAll.
 */
export const setupMswServer = () => {
    if (!server) {
        console.warn('MSW server not initialized. API calls will not be mocked.');
        return;
    }

    beforeAll(() => {
        server.listen({ onUnhandledRequest: 'warn' });
    });

    afterEach(() => {
        server.resetHandlers();
    });

    afterAll(() => {
        server.close();
    });
};