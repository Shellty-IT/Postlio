/**
 * Tests for Card components.
 *
 * Testuje Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter.
 */
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from '@/components/ui/card';

describe('Card', () => {
    describe('rendering', () => {
        it('should render card element', () => {
            render(<Card data-testid="card">Content</Card>);

            expect(screen.getByTestId('card')).toBeInTheDocument();
        });

        it('should render children', () => {
            render(<Card>Card content here</Card>);

            expect(screen.getByText('Card content here')).toBeInTheDocument();
        });

        it('should have correct displayName', () => {
            expect(Card.displayName).toBe('Card');
        });
    });

    describe('styling', () => {
        it('should have default classes', () => {
            render(<Card data-testid="card">Content</Card>);

            const card = screen.getByTestId('card');
            expect(card).toHaveClass('rounded-xl');
            expect(card).toHaveClass('border');
            expect(card).toHaveClass('bg-card');
            expect(card).toHaveClass('text-card-foreground');
            expect(card).toHaveClass('shadow');
        });

        it('should merge custom className', () => {
            render(<Card className="custom-card" data-testid="card">Content</Card>);

            const card = screen.getByTestId('card');
            expect(card).toHaveClass('custom-card');
            expect(card).toHaveClass('rounded-xl');
        });
    });

    describe('ref forwarding', () => {
        it('should forward ref', () => {
            const ref = createRef<HTMLDivElement>();
            render(<Card ref={ref}>Content</Card>);

            expect(ref.current).toBeInstanceOf(HTMLDivElement);
        });
    });

    describe('HTML attributes', () => {
        it('should pass through HTML attributes', () => {
            render(
                <Card id="my-card" role="article" aria-label="Product card" data-testid="card">
                    Content
                </Card>
            );

            const card = screen.getByTestId('card');
            expect(card).toHaveAttribute('id', 'my-card');
            expect(card).toHaveAttribute('role', 'article');
            expect(card).toHaveAttribute('aria-label', 'Product card');
        });
    });
});

describe('CardHeader', () => {
    it('should render header element', () => {
        render(<CardHeader data-testid="header">Header</CardHeader>);

        expect(screen.getByTestId('header')).toBeInTheDocument();
    });

    it('should have default classes', () => {
        render(<CardHeader data-testid="header">Header</CardHeader>);

        const header = screen.getByTestId('header');
        expect(header).toHaveClass('flex');
        expect(header).toHaveClass('flex-col');
        expect(header).toHaveClass('space-y-1.5');
        expect(header).toHaveClass('p-6');
    });

    it('should merge custom className', () => {
        render(<CardHeader className="custom-header" data-testid="header">Header</CardHeader>);

        const header = screen.getByTestId('header');
        expect(header).toHaveClass('custom-header');
        expect(header).toHaveClass('p-6');
    });

    it('should forward ref', () => {
        const ref = createRef<HTMLDivElement>();
        render(<CardHeader ref={ref}>Header</CardHeader>);

        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should have correct displayName', () => {
        expect(CardHeader.displayName).toBe('CardHeader');
    });
});

describe('CardTitle', () => {
    it('should render title element', () => {
        render(<CardTitle>Card Title</CardTitle>);

        expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('should have default classes', () => {
        render(<CardTitle data-testid="title">Title</CardTitle>);

        const title = screen.getByTestId('title');
        expect(title).toHaveClass('font-semibold');
        expect(title).toHaveClass('leading-none');
        expect(title).toHaveClass('tracking-tight');
    });

    it('should merge custom className', () => {
        render(<CardTitle className="text-2xl" data-testid="title">Title</CardTitle>);

        const title = screen.getByTestId('title');
        expect(title).toHaveClass('text-2xl');
        expect(title).toHaveClass('font-semibold');
    });

    it('should forward ref', () => {
        const ref = createRef<HTMLDivElement>();
        render(<CardTitle ref={ref}>Title</CardTitle>);

        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should have correct displayName', () => {
        expect(CardTitle.displayName).toBe('CardTitle');
    });
});

describe('CardDescription', () => {
    it('should render description element', () => {
        render(<CardDescription>Card description text</CardDescription>);

        expect(screen.getByText('Card description text')).toBeInTheDocument();
    });

    it('should have default classes', () => {
        render(<CardDescription data-testid="desc">Description</CardDescription>);

        const desc = screen.getByTestId('desc');
        expect(desc).toHaveClass('text-sm');
        expect(desc).toHaveClass('text-muted-foreground');
    });

    it('should merge custom className', () => {
        render(<CardDescription className="italic" data-testid="desc">Description</CardDescription>);

        const desc = screen.getByTestId('desc');
        expect(desc).toHaveClass('italic');
        expect(desc).toHaveClass('text-sm');
    });

    it('should forward ref', () => {
        const ref = createRef<HTMLDivElement>();
        render(<CardDescription ref={ref}>Description</CardDescription>);

        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should have correct displayName', () => {
        expect(CardDescription.displayName).toBe('CardDescription');
    });
});

describe('CardContent', () => {
    it('should render content element', () => {
        render(<CardContent>Card content</CardContent>);

        expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('should have default classes', () => {
        render(<CardContent data-testid="content">Content</CardContent>);

        const content = screen.getByTestId('content');
        expect(content).toHaveClass('p-6');
        expect(content).toHaveClass('pt-0');
    });

    it('should merge custom className', () => {
        render(<CardContent className="space-y-4" data-testid="content">Content</CardContent>);

        const content = screen.getByTestId('content');
        expect(content).toHaveClass('space-y-4');
        expect(content).toHaveClass('p-6');
    });

    it('should forward ref', () => {
        const ref = createRef<HTMLDivElement>();
        render(<CardContent ref={ref}>Content</CardContent>);

        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should have correct displayName', () => {
        expect(CardContent.displayName).toBe('CardContent');
    });
});

describe('CardFooter', () => {
    it('should render footer element', () => {
        render(<CardFooter>Card footer</CardFooter>);

        expect(screen.getByText('Card footer')).toBeInTheDocument();
    });

    it('should have default classes', () => {
        render(<CardFooter data-testid="footer">Footer</CardFooter>);

        const footer = screen.getByTestId('footer');
        expect(footer).toHaveClass('flex');
        expect(footer).toHaveClass('items-center');
        expect(footer).toHaveClass('p-6');
        expect(footer).toHaveClass('pt-0');
    });

    it('should merge custom className', () => {
        render(<CardFooter className="justify-between" data-testid="footer">Footer</CardFooter>);

        const footer = screen.getByTestId('footer');
        expect(footer).toHaveClass('justify-between');
        expect(footer).toHaveClass('flex');
    });

    it('should forward ref', () => {
        const ref = createRef<HTMLDivElement>();
        render(<CardFooter ref={ref}>Footer</CardFooter>);

        expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('should have correct displayName', () => {
        expect(CardFooter.displayName).toBe('CardFooter');
    });
});

describe('Card composition', () => {
    it('should render complete card with all subcomponents', () => {
        render(
            <Card data-testid="full-card">
                <CardHeader>
                    <CardTitle>Product Name</CardTitle>
                    <CardDescription>Product description goes here</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Main content of the card</p>
                </CardContent>
                <CardFooter>
                    <button>Buy Now</button>
                </CardFooter>
            </Card>
        );

        expect(screen.getByTestId('full-card')).toBeInTheDocument();
        expect(screen.getByText('Product Name')).toBeInTheDocument();
        expect(screen.getByText('Product description goes here')).toBeInTheDocument();
        expect(screen.getByText('Main content of the card')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Buy Now' })).toBeInTheDocument();
    });

    it('should maintain proper structure', () => {
        const { container } = render(
            <Card>
                <CardHeader>
                    <CardTitle>Title</CardTitle>
                </CardHeader>
                <CardContent>Content</CardContent>
            </Card>
        );

        const card = container.firstChild;
        expect(card?.childNodes).toHaveLength(2);
    });

    it('should allow cards inside cards', () => {
        render(
            <Card data-testid="outer-card">
                <CardContent>
                    <Card data-testid="inner-card">
                        <CardContent>Nested content</CardContent>
                    </Card>
                </CardContent>
            </Card>
        );

        expect(screen.getByTestId('outer-card')).toBeInTheDocument();
        expect(screen.getByTestId('inner-card')).toBeInTheDocument();
        expect(screen.getByText('Nested content')).toBeInTheDocument();
    });
});

describe('Card accessibility', () => {
    it('should support role attribute', () => {
        render(
            <Card role="article" data-testid="card">
                <CardContent>Content</CardContent>
            </Card>
        );

        expect(screen.getByRole('article')).toBeInTheDocument();
    });

    it('should support aria-labelledby', () => {
        render(
            <Card aria-labelledby="card-title" data-testid="card">
                <CardHeader>
                    <CardTitle id="card-title">Accessible Card</CardTitle>
                </CardHeader>
            </Card>
        );

        const card = screen.getByTestId('card');
        expect(card).toHaveAttribute('aria-labelledby', 'card-title');
    });
});