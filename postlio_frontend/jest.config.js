import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files
    dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
    // Setup files after env
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    // Test environment
    testEnvironment: 'jsdom',

    // Module name mapper for path aliases
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@/components/(.*)$': '<rootDir>/src/components/$1',
        '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
        '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
        '^@/store/(.*)$': '<rootDir>/src/store/$1',
        '^@/types/(.*)$': '<rootDir>/src/types/$1',
        '^@/providers/(.*)$': '<rootDir>/src/providers/$1',
    },

    // Test patterns - only files with .test. or .spec. in name
    testMatch: [
        '**/__tests__/**/*.test.[jt]s?(x)',
        '**/__tests__/**/*.spec.[jt]s?(x)',
        '**/?(*.)+(spec|test).[jt]s?(x)',
    ],

    // Ignore patterns - exclude helper files and mocks that aren't tests
    testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/.next/',
        '<rootDir>/e2e/',
        '<rootDir>/src/__tests__/mocks/',
        '<rootDir>/src/__tests__/test-utils.tsx',
        '<rootDir>/src/__tests__/fixtures/',
        '<rootDir>/src/__tests__/helpers/',
    ],

    // Transform ignore patterns
    transformIgnorePatterns: [
        '/node_modules/',
        '^.+\\.module\\.(css|sass|scss)$',
    ],

    // Coverage configuration
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.stories.{js,jsx,ts,tsx}',
        '!src/app/**/layout.tsx',
        '!src/app/**/loading.tsx',
        '!src/app/**/error.tsx',
        '!src/app/**/not-found.tsx',
        '!src/types/**/*',
        '!src/__tests__/**/*',
    ],

    // Module directories
    moduleDirectories: ['node_modules', '<rootDir>/'],

    // Verbose output
    verbose: true,

    // Max workers
    maxWorkers: '50%',

    // Clear mocks between tests
    clearMocks: true,

    // Restore mocks between tests
    restoreMocks: true,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);
