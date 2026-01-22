/**
 * Tests for Input component.
 *
 * Testuje różne typy inputów, stany i interakcje.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';
import { createRef } from 'react';

describe('Input', () => {
    describe('rendering', () => {
        it('should render input element', () => {
            render(<Input />);

            expect(screen.getByRole('textbox')).toBeInTheDocument();
        });

        it('should render with placeholder', () => {
            render(<Input placeholder="Enter text..." />);

            expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
        });

        it('should render with default value', () => {
            render(<Input defaultValue="Default text" />);

            expect(screen.getByDisplayValue('Default text')).toBeInTheDocument();
        });

        it('should render with controlled value', () => {
            render(<Input value="Controlled" onChange={() => {}} />);

            expect(screen.getByDisplayValue('Controlled')).toBeInTheDocument();
        });

        it('should have correct displayName', () => {
            expect(Input.displayName).toBe('Input');
        });
    });

    describe('types', () => {
        it('should render text input by default', () => {
            render(<Input data-testid="test-input" />);

            const input = screen.getByTestId('test-input');
            expect(input).toBeInTheDocument();
            expect(input.tagName).toBe('INPUT');
            // HTML input bez atrybutu type domyślnie ma type="text"
            // getAttribute zwraca null, ale właściwość DOM zwraca "text"
            expect((input as HTMLInputElement).type).toBe('text');
        });

        it('should render email input', () => {
            render(<Input type="email" />);

            const input = screen.getByRole('textbox');
            expect(input).toHaveAttribute('type', 'email');
        });

        it('should render password input', () => {
            render(<Input type="password" placeholder="Password" />);

            // Password inputs don't have textbox role
            const input = screen.getByPlaceholderText('Password');
            expect(input).toHaveAttribute('type', 'password');
        });

        it('should render number input', () => {
            render(<Input type="number" aria-label="Number input" />);

            const input = screen.getByRole('spinbutton');
            expect(input).toHaveAttribute('type', 'number');
        });

        it('should render search input', () => {
            render(<Input type="search" aria-label="Search" />);

            const input = screen.getByRole('searchbox');
            expect(input).toHaveAttribute('type', 'search');
        });

        it('should render tel input', () => {
            render(<Input type="tel" placeholder="Phone" />);

            const input = screen.getByPlaceholderText('Phone');
            expect(input).toHaveAttribute('type', 'tel');
        });

        it('should render url input', () => {
            render(<Input type="url" placeholder="URL" />);

            const input = screen.getByPlaceholderText('URL');
            expect(input).toHaveAttribute('type', 'url');
        });
    });

    describe('states', () => {
        it('should be disabled when disabled prop is true', () => {
            render(<Input disabled />);

            const input = screen.getByRole('textbox');
            expect(input).toBeDisabled();
            expect(input).toHaveClass('disabled:cursor-not-allowed');
            expect(input).toHaveClass('disabled:opacity-50');
        });

        it('should be readonly when readOnly prop is true', () => {
            render(<Input readOnly value="Read only" onChange={() => {}} />);

            const input = screen.getByRole('textbox');
            expect(input).toHaveAttribute('readonly');
        });

        it('should be required when required prop is true', () => {
            render(<Input required />);

            const input = screen.getByRole('textbox');
            expect(input).toBeRequired();
        });

        it('should show as invalid with aria-invalid', () => {
            render(<Input aria-invalid="true" />);

            const input = screen.getByRole('textbox');
            expect(input).toHaveAttribute('aria-invalid', 'true');
        });
    });

    describe('interactions', () => {
        it('should accept user input', async () => {
            render(<Input />);

            const input = screen.getByRole('textbox');
            await userEvent.type(input, 'Hello World');

            expect(input).toHaveValue('Hello World');
        });

        it('should call onChange when value changes', async () => {
            const handleChange = jest.fn();
            render(<Input onChange={handleChange} />);

            const input = screen.getByRole('textbox');
            await userEvent.type(input, 'a');

            expect(handleChange).toHaveBeenCalled();
        });

        it('should call onFocus when focused', () => {
            const handleFocus = jest.fn();
            render(<Input onFocus={handleFocus} />);

            const input = screen.getByRole('textbox');
            fireEvent.focus(input);

            expect(handleFocus).toHaveBeenCalled();
        });

        it('should call onBlur when blurred', () => {
            const handleBlur = jest.fn();
            render(<Input onBlur={handleBlur} />);

            const input = screen.getByRole('textbox');
            fireEvent.focus(input);
            fireEvent.blur(input);

            expect(handleBlur).toHaveBeenCalled();
        });

        it('should not accept input when disabled', async () => {
            render(<Input disabled />);

            const input = screen.getByRole('textbox');
            await userEvent.type(input, 'test');

            expect(input).toHaveValue('');
        });

        it('should clear value on clear', async () => {
            render(<Input defaultValue="To be cleared" />);

            const input = screen.getByRole('textbox');
            await userEvent.clear(input);

            expect(input).toHaveValue('');
        });
    });

    describe('ref forwarding', () => {
        it('should forward ref to input element', () => {
            const ref = createRef<HTMLInputElement>();
            render(<Input ref={ref} />);

            expect(ref.current).toBeInstanceOf(HTMLInputElement);
        });

        it('should allow focus via ref', () => {
            const ref = createRef<HTMLInputElement>();
            render(<Input ref={ref} />);

            ref.current?.focus();

            expect(ref.current).toHaveFocus();
        });

        it('should allow value access via ref', async () => {
            const ref = createRef<HTMLInputElement>();
            render(<Input ref={ref} />);

            await userEvent.type(screen.getByRole('textbox'), 'Test value');

            expect(ref.current?.value).toBe('Test value');
        });
    });

    describe('styling', () => {
        it('should have default classes', () => {
            render(<Input />);

            const input = screen.getByRole('textbox');
            expect(input).toHaveClass('flex');
            expect(input).toHaveClass('h-9');
            expect(input).toHaveClass('w-full');
            expect(input).toHaveClass('rounded-md');
            expect(input).toHaveClass('border');
        });

        it('should merge custom className', () => {
            render(<Input className="custom-input" />);

            const input = screen.getByRole('textbox');
            expect(input).toHaveClass('custom-input');
            expect(input).toHaveClass('flex'); // Still has default
        });

        it('should have focus styles', () => {
            render(<Input />);

            const input = screen.getByRole('textbox');
            expect(input).toHaveClass('focus-visible:outline-none');
            expect(input).toHaveClass('focus-visible:ring-1');
        });

        it('should have placeholder styles', () => {
            render(<Input placeholder="Placeholder" />);

            const input = screen.getByRole('textbox');
            expect(input).toHaveClass('placeholder:text-muted-foreground');
        });
    });

    describe('HTML attributes', () => {
        it('should pass through standard attributes', () => {
            render(
                <Input
                    id="test-input"
                    name="testName"
                    autoComplete="off"
                    maxLength={50}
                    minLength={5}
                    pattern="[a-z]+"
                />
            );

            const input = screen.getByRole('textbox');
            expect(input).toHaveAttribute('id', 'test-input');
            expect(input).toHaveAttribute('name', 'testName');
            expect(input).toHaveAttribute('autocomplete', 'off');
            expect(input).toHaveAttribute('maxlength', '50');
            expect(input).toHaveAttribute('minlength', '5');
            expect(input).toHaveAttribute('pattern', '[a-z]+');
        });

        it('should support aria attributes', () => {
            render(
                <Input
                    aria-label="Email address"
                    aria-describedby="email-help"
                    aria-required="true"
                />
            );

            const input = screen.getByRole('textbox');
            expect(input).toHaveAttribute('aria-label', 'Email address');
            expect(input).toHaveAttribute('aria-describedby', 'email-help');
            expect(input).toHaveAttribute('aria-required', 'true');
        });
    });

    describe('accessibility', () => {
        it('should be accessible by label', () => {
            render(
                <>
                    <label htmlFor="email">Email</label>
                    <Input id="email" type="email" />
                </>
            );

            expect(screen.getByLabelText('Email')).toBeInTheDocument();
        });

        it('should support aria-invalid for form validation', () => {
            render(<Input aria-invalid="true" aria-errormessage="error-msg" />);

            const input = screen.getByRole('textbox');
            expect(input).toHaveAttribute('aria-invalid', 'true');
            expect(input).toHaveAttribute('aria-errormessage', 'error-msg');
        });
    });

    describe('file input', () => {
        it('should handle file input type', () => {
            render(<Input type="file" data-testid="file-input" />);

            const input = screen.getByTestId('file-input');
            expect(input).toHaveAttribute('type', 'file');
        });

        it('should have file-specific styles', () => {
            render(<Input type="file" data-testid="file-input" />);

            const input = screen.getByTestId('file-input');
            expect(input.className).toContain('file:');
        });
    });
});