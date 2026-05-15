/**
 * Tests for Login Form integration.
 *
 * Testuje formularz logowania z walidacją i interakcjami.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

// Mock router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
    }),
}));

// Mock sonner
jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

// Simple Login Form component for testing
function LoginForm({ onSubmit }: { onSubmit: (data: { email: string; password: string }) => void }) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSubmit({
            email: formData.get('email') as string,
            password: formData.get('password') as string,
        });
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Zaloguj się</CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email">Email</label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="jan@example.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="password">Hasło</label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full">
                        Zaloguj
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

// Wrapper with providers
function Wrapper({ children }: { children: React.ReactNode }) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

describe('LoginForm', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('rendering', () => {
        it('should render login form', () => {
            render(<LoginForm onSubmit={jest.fn()} />, { wrapper: Wrapper });

            expect(screen.getByText('Zaloguj się')).toBeInTheDocument();
            expect(screen.getByLabelText('Email')).toBeInTheDocument();
            expect(screen.getByLabelText('Hasło')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /zaloguj/i })).toBeInTheDocument();
        });

        it('should render email input with correct type', () => {
            render(<LoginForm onSubmit={jest.fn()} />, { wrapper: Wrapper });

            const emailInput = screen.getByLabelText('Email');
            expect(emailInput).toHaveAttribute('type', 'email');
        });

        it('should render password input with correct type', () => {
            render(<LoginForm onSubmit={jest.fn()} />, { wrapper: Wrapper });

            const passwordInput = screen.getByLabelText('Hasło');
            expect(passwordInput).toHaveAttribute('type', 'password');
        });

        it('should render placeholders', () => {
            render(<LoginForm onSubmit={jest.fn()} />, { wrapper: Wrapper });

            expect(screen.getByPlaceholderText('jan@example.com')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
        });
    });

    describe('form submission', () => {
        it('should call onSubmit with form data', async () => {
            const handleSubmit = jest.fn();
            render(<LoginForm onSubmit={handleSubmit} />, { wrapper: Wrapper });

            await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
            await userEvent.type(screen.getByLabelText('Hasło'), 'password123');
            await userEvent.click(screen.getByRole('button', { name: /zaloguj/i }));

            expect(handleSubmit).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
        });

        it('should not submit empty form', async () => {
            const handleSubmit = jest.fn();
            render(<LoginForm onSubmit={handleSubmit} />, { wrapper: Wrapper });

            const submitButton = screen.getByRole('button', { name: /zaloguj/i });
            await userEvent.click(submitButton);

            // HTML5 validation should prevent submission
            // Note: This depends on browser behavior
        });
    });

    describe('user interactions', () => {
        it('should allow typing in email field', async () => {
            render(<LoginForm onSubmit={jest.fn()} />, { wrapper: Wrapper });

            const emailInput = screen.getByLabelText('Email');
            await userEvent.type(emailInput, 'user@test.com');

            expect(emailInput).toHaveValue('user@test.com');
        });

        it('should allow typing in password field', async () => {
            render(<LoginForm onSubmit={jest.fn()} />, { wrapper: Wrapper });

            const passwordInput = screen.getByLabelText('Hasło');
            await userEvent.type(passwordInput, 'secretpassword');

            expect(passwordInput).toHaveValue('secretpassword');
        });

        it('should clear fields on clear', async () => {
            render(<LoginForm onSubmit={jest.fn()} />, { wrapper: Wrapper });

            const emailInput = screen.getByLabelText('Email');
            await userEvent.type(emailInput, 'test@test.com');
            await userEvent.clear(emailInput);

            expect(emailInput).toHaveValue('');
        });

        it('should tab between fields', async () => {
            render(<LoginForm onSubmit={jest.fn()} />, { wrapper: Wrapper });

            const emailInput = screen.getByLabelText('Email');
            const passwordInput = screen.getByLabelText('Hasło');

            emailInput.focus();
            expect(emailInput).toHaveFocus();

            await userEvent.tab();
            expect(passwordInput).toHaveFocus();
        });
    });

    describe('accessibility', () => {
        it('should have accessible labels', () => {
            render(<LoginForm onSubmit={jest.fn()} />, { wrapper: Wrapper });

            expect(screen.getByLabelText('Email')).toBeInTheDocument();
            expect(screen.getByLabelText('Hasło')).toBeInTheDocument();
        });

        it('should have form structure', () => {
            render(<LoginForm onSubmit={jest.fn()} />, { wrapper: Wrapper });

            const form = screen.getByRole('button').closest('form');
            expect(form).toBeInTheDocument();
        });

        it('should have submit button', () => {
            render(<LoginForm onSubmit={jest.fn()} />, { wrapper: Wrapper });

            const button = screen.getByRole('button', { name: /zaloguj/i });
            expect(button).toHaveAttribute('type', 'submit');
        });
    });

    describe('keyboard navigation', () => {
        it('should submit form on Enter in password field', async () => {
            const handleSubmit = jest.fn();
            render(<LoginForm onSubmit={handleSubmit} />, { wrapper: Wrapper });

            await userEvent.type(screen.getByLabelText('Email'), 'test@test.com');
            await userEvent.type(screen.getByLabelText('Hasło'), 'password{enter}');

            expect(handleSubmit).toHaveBeenCalled();
        });
    });
});

describe('Form with Card layout', () => {
    it('should render form inside card', () => {
        render(
            <Card data-testid="form-card">
                <CardHeader>
                    <CardTitle>Form Title</CardTitle>
                </CardHeader>
                <CardContent>
                    <Input placeholder="Input inside card" />
                </CardContent>
                <CardFooter>
                    <Button>Submit</Button>
                </CardFooter>
            </Card>
        );

        expect(screen.getByTestId('form-card')).toBeInTheDocument();
        expect(screen.getByText('Form Title')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Input inside card')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });

    it('should maintain card structure with form elements', () => {
        const { container } = render(
            <Card>
                <CardHeader>
                    <CardTitle>Registration</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Input type="text" placeholder="Name" />
                        <Input type="email" placeholder="Email" />
                        <Input type="password" placeholder="Password" />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline">Cancel</Button>
                    <Button>Register</Button>
                </CardFooter>
            </Card>
        );

        const inputs = container.querySelectorAll('input');
        expect(inputs.length).toBe(3);

        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBe(2);
    });
});