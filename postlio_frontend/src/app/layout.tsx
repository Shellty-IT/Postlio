// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/providers';
import './globals.css';

const inter = Inter({
    subsets: ['latin', 'latin-ext'],
    variable: '--font-inter',
});

export const metadata: Metadata = {
    metadataBase: new URL('https://postlio.netlify.app'),
    title: {
        default: 'Postlio - AI Social Media Manager',
        template: '%s | Postlio',
    },
    description: 'Automatyzuj tworzenie postów na social media z pomocą AI.',
    manifest: '/manifest.json',
    icons: {
        icon: '/favicon.svg',
        apple: '/apple-touch-icon.png',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
        { media: '(prefers-color-scheme: dark)', color: '#0A0F1C' },
    ],
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pl" suppressHydrationWarning>
        <head>
            <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        </head>
        <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
        </body>
        </html>
    );
}