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
    description: 'Automatyzuj tworzenie postów na social media z pomocą AI. Facebook, Instagram, LinkedIn w jednym miejscu.',
    keywords: ['social media', 'AI', 'automatyzacja', 'posty', 'Facebook', 'Instagram', 'LinkedIn'],
    authors: [{ name: 'Postlio' }],
    creator: 'Postlio',
    publisher: 'Postlio',
    robots: 'index, follow',

    // PWA
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Postlio',
    },
    formatDetection: {
        telephone: false,
    },

    icons: {
        icon: [
            { url: '/favicon.svg', type: 'image/svg+xml' },
            { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
        shortcut: { url: '/favicon.svg', type: 'image/svg+xml' },
        apple: [
            { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
    },

    // Open Graph
    openGraph: {
        type: 'website',
        locale: 'pl_PL',
        url: 'https://postlio.app',
        siteName: 'Postlio',
        title: 'Postlio - AI Social Media Manager',
        description: 'Automatyzuj tworzenie postów na social media z pomocą AI.',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Postlio - AI Social Media Manager',
            },
        ],
    },

    // Twitter
    twitter: {
        card: 'summary_large_image',
        title: 'Postlio - AI Social Media Manager',
        description: 'Automatyzuj tworzenie postów na social media z pomocą AI.',
        images: ['/og-image.png'],
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
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
            {/* Explicit favicon - zapobiega szukaniu /favicon.ico */}
            <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
            <link rel="alternate icon" href="/icon-192.png" type="image/png" />

            {/* Dodatkowe meta tagi PWA */}
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="msapplication-TileColor" content="#2563EB" />
            <meta name="msapplication-TileImage" content="/icon-192.png" />
            <meta name="msapplication-tap-highlight" content="no" />
        </head>
        <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
        </body>
        </html>
    );
}