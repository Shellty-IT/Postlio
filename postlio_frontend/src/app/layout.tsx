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
    title: {
        default: 'Postlio - AI Social Media Manager',
        template: '%s | Postlio',
    },
    description: 'Automatyzuj tworzenie postów na social media z pomocą AI. Facebook, Instagram, LinkedIn w jednym miejscu.',
    keywords: ['social media', 'AI', 'automatyzacja', 'posty', 'Facebook', 'Instagram', 'LinkedIn'],
    authors: [{ name: 'Postlio' }],
    creator: 'Postlio',
    manifest: '/manifest.json',
    icons: {
        icon: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },
    openGraph: {
        type: 'website',
        locale: 'pl_PL',
        url: 'https://postlio.app',
        siteName: 'Postlio',
        title: 'Postlio - AI Social Media Manager',
        description: 'Automatyzuj tworzenie postów na social media z pomocą AI.',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Postlio - AI Social Media Manager',
        description: 'Automatyzuj tworzenie postów na social media z pomocą AI.',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
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
        <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
        </body>
        </html>
    );
}