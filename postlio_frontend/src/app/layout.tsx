// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Providers } from '@/providers';
import './globals.css';

export const metadata: Metadata = {
    metadataBase: new URL('https://postlio.netlify.app'),
    title: {
        default: 'Postlio \u2014 AI do social medi\u00f3w',
        template: '%s | Postlio',
    },
    description: 'Tw\u00f3rz, planuj i publikuj tre\u015bci na Facebooku, Instagramie i LinkedInie. Postlio \u0142\u0105czy kreator AI, g\u0142os marki i Autopilot w jednym miejscu.',
    openGraph: {
        type: 'website',
        locale: 'pl_PL',
        url: '/',
        siteName: 'Postlio',
        title: 'Postlio \u2014 AI do social medi\u00f3w',
        description: 'Tw\u00f3rz, planuj i publikuj tre\u015bci na Facebooku, Instagramie i LinkedInie. Kreator AI, g\u0142os marki i Autopilot w jednym miejscu.',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'Postlio \u2014 Autopilot AI do social medi\u00f3w',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Postlio \u2014 AI do social medi\u00f3w',
        description: 'Tw\u00f3rz, planuj i publikuj tre\u015bci na Facebooku, Instagramie i LinkedInie. Kreator AI, g\u0142os marki i Autopilot w jednym miejscu.',
        images: ['/og-image.jpg'],
    },
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
