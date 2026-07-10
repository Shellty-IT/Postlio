// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Providers } from '@/providers';
import './globals.css';

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
    themeColor: '#070709',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pl" className={`dark ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
        <head>
            <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        </head>
        <body className="font-sans">
        <Providers>{children}</Providers>
        </body>
        </html>
    );
}