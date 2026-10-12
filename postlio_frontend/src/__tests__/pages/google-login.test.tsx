import { render, waitFor } from '@testing-library/react';
import LoginPage from '@/app/(auth)/login/page';

const mockReplace = jest.fn();
const mockCallback = jest.fn();
const mockSetAccessToken = jest.fn();
const mockStoreLogin = jest.fn();
let mockParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
    useRouter: () => ({ replace: mockReplace }),
    useSearchParams: () => mockParams,
}));
jest.mock('@/hooks', () => ({ useLogin: () => ({ mutate: jest.fn(), isPending: false }) }));
jest.mock('@/lib/api', () => ({
    authApi: { handleOAuthLoginCallback: (...args: unknown[]) => mockCallback(...args) },
    TokenManager: { setAccessToken: (...args: unknown[]) => mockSetAccessToken(...args) },
}));
jest.mock('@/store/auth-store', () => ({
    useAuthStore: () => ({ login: mockStoreLogin }),
}));
jest.mock('@/components/common/app-logo', () => ({ AppLogo: () => null }));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockParams = new URLSearchParams({
        oauth_success: 'true',
        oauth_code: 'code',
        oauth_state: 'expected-state',
        platform: 'google',
    });
});

test('successful Google signup continues to onboarding', async () => {
    sessionStorage.setItem('oauth_login_state', 'expected-state');
    sessionStorage.setItem('oauth_login_platform', 'google');
    mockCallback.mockResolvedValue({
        success: true,
        access_token: 'postlio-token',
        is_new_user: true,
        user: { email: 'person@example.com', needs_onboarding: true },
    });

    render(<LoginPage />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/onboarding'));
    expect(mockReplace).not.toHaveBeenCalledWith('/login', expect.anything());
    expect(mockSetAccessToken).toHaveBeenCalledWith('postlio-token');
    expect(mockStoreLogin).toHaveBeenCalled();
});

test('mismatched OAuth state does not exchange the authorization code', async () => {
    sessionStorage.setItem('oauth_login_state', 'different-state');
    sessionStorage.setItem('oauth_login_platform', 'google');

    render(<LoginPage />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/login', { scroll: false }));
    expect(mockCallback).not.toHaveBeenCalled();
});
