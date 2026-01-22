// ============================================================
// POLYFILLS - MUST BE FIRST (before any imports)!
// ============================================================

// TextEncoder/TextDecoder polyfill (required by MSW and other libs)
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// BroadcastChannel polyfill (required by MSW)
global.BroadcastChannel = class BroadcastChannel {
    constructor() {}
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
};

// ============================================================
// TESTING LIBRARY
// ============================================================

require('@testing-library/jest-dom');

// ============================================================
// NEXT.JS MOCKS
// ============================================================

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
}));

// Mock next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props) => {
        const React = require('react');
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        return React.createElement('img', props);
    },
}));

// Mock next-themes
jest.mock('next-themes', () => ({
    useTheme: () => ({
        theme: 'light',
        setTheme: jest.fn(),
        resolvedTheme: 'light',
        themes: ['light', 'dark', 'system'],
        systemTheme: 'light',
    }),
    ThemeProvider: ({ children }) => children,
}));

// ============================================================
// FRAMER MOTION MOCK
// ============================================================

jest.mock('framer-motion', () => {
    const React = require('react');

    // Helper to forward all props except motion-specific ones
    const filterMotionProps = (props) => {
        const {
            initial,
            animate,
            exit,
            transition,
            variants,
            whileHover,
            whileTap,
            whileFocus,
            whileInView,
            viewport,
            drag,
            dragConstraints,
            dragElastic,
            onDragStart,
            onDragEnd,
            layout,
            layoutId,
            ...rest
        } = props;
        return rest;
    };

    return {
        motion: {
            div: React.forwardRef(({ children, ...props }, ref) =>
                React.createElement('div', { ref, ...filterMotionProps(props) }, children)
            ),
            span: React.forwardRef(({ children, ...props }, ref) =>
                React.createElement('span', { ref, ...filterMotionProps(props) }, children)
            ),
            button: React.forwardRef(({ children, ...props }, ref) =>
                React.createElement('button', { ref, ...filterMotionProps(props) }, children)
            ),
            a: React.forwardRef(({ children, ...props }, ref) =>
                React.createElement('a', { ref, ...filterMotionProps(props) }, children)
            ),
            ul: React.forwardRef(({ children, ...props }, ref) =>
                React.createElement('ul', { ref, ...filterMotionProps(props) }, children)
            ),
            li: React.forwardRef(({ children, ...props }, ref) =>
                React.createElement('li', { ref, ...filterMotionProps(props) }, children)
            ),
            p: React.forwardRef(({ children, ...props }, ref) =>
                React.createElement('p', { ref, ...filterMotionProps(props) }, children)
            ),
            h1: React.forwardRef(({ children, ...props }, ref) =>
                React.createElement('h1', { ref, ...filterMotionProps(props) }, children)
            ),
            h2: React.forwardRef(({ children, ...props }, ref) =>
                React.createElement('h2', { ref, ...filterMotionProps(props) }, children)
            ),
            h3: React.forwardRef(({ children, ...props }, ref) =>
                React.createElement('h3', { ref, ...filterMotionProps(props) }, children)
            ),
            section: React.forwardRef(({ children, ...props }, ref) =>
                React.createElement('section', { ref, ...filterMotionProps(props) }, children)
            ),
            article: React.forwardRef(({ children, ...props }, ref) =>
                React.createElement('article', { ref, ...filterMotionProps(props) }, children)
            ),
            nav: React.forwardRef(({ children, ...props }, ref) =>
                React.createElement('nav', { ref, ...filterMotionProps(props) }, children)
            ),
            form: React.forwardRef(({ children, ...props }, ref) =>
                React.createElement('form', { ref, ...filterMotionProps(props) }, children)
            ),
            img: React.forwardRef((props, ref) =>
                React.createElement('img', { ref, ...filterMotionProps(props) })
            ),
            svg: React.forwardRef(({ children, ...props }, ref) =>
                React.createElement('svg', { ref, ...filterMotionProps(props) }, children)
            ),
        },
        AnimatePresence: ({ children }) => children,
        useAnimation: () => ({
            start: jest.fn(),
            stop: jest.fn(),
            set: jest.fn(),
        }),
        useMotionValue: (initial) => ({
            get: () => initial,
            set: jest.fn(),
            onChange: jest.fn(),
        }),
        useTransform: (value, input, output) => ({
            get: () => output?.[0] ?? 0,
        }),
        useSpring: (value) => value,
        useInView: () => true,
        useScroll: () => ({
            scrollY: { get: () => 0 },
            scrollYProgress: { get: () => 0 },
        }),
    };
});

// ============================================================
// BROWSER API MOCKS
// ============================================================

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', { value: localStorageMock });

// Mock Notification API
global.Notification = {
    permission: 'granted',
    requestPermission: jest.fn().mockResolvedValue('granted'),
};

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
        readText: jest.fn().mockResolvedValue(''),
    },
});

// Mock fetch (fallback)
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
    })
);

// ============================================================
// CONSOLE SUPPRESSION
// ============================================================

const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
    console.error = (...args) => {
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('Warning: ReactDOM.render') ||
                args[0].includes('Warning: An update to') ||
                args[0].includes('act(...)') ||
                args[0].includes('Not implemented: HTMLFormElement'))
        ) {
            return;
        }
        originalError.call(console, ...args);
    };

    console.warn = (...args) => {
        if (
            typeof args[0] === 'string' &&
            args[0].includes('componentWillReceiveProps')
        ) {
            return;
        }
        originalWarn.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
});

// ============================================================
// CLEANUP
// ============================================================

afterEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
});