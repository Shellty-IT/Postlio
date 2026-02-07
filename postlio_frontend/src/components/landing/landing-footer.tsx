// src/components/landing/landing-footer.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sparkles,
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
    Mail,
    ArrowRight
} from 'lucide-react';

const footerLinks = {
    product: {
        title: 'Produkt',
        links: [
            { label: 'Funkcje', href: '#features' },
            { label: 'Cennik', href: '#pricing' },
            { label: 'Integracje', href: '#' },
            { label: 'API', href: '#' },
            { label: 'Changelog', href: '#' },
        ],
    },
    company: {
        title: 'Firma',
        links: [
            { label: 'O nas', href: '#' },
            { label: 'Blog', href: '#' },
            { label: 'Kariera', href: '#' },
            { label: 'Kontakt', href: '#' },
            { label: 'Partnerzy', href: '#' },
        ],
    },
    resources: {
        title: 'Zasoby',
        links: [
            { label: 'Dokumentacja', href: '#' },
            { label: 'Poradniki', href: '#' },
            { label: 'Webinary', href: '#' },
            { label: 'Status', href: '#' },
            { label: 'FAQ', href: '#faq' },
        ],
    },
    legal: {
        title: 'Prawne',
        links: [
            { label: 'Polityka prywatności', href: '#' },
            { label: 'Regulamin', href: '#' },
            { label: 'Cookies', href: '#' },
            { label: 'RODO', href: '#' },
        ],
    },
};

const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Twitter, href: '#', label: 'Twitter' },
];

export function LandingFooter() {
    return (
        <footer className="bg-muted/30 border-t border-border/50">
            <div className="container mx-auto px-4 py-10 sm:py-16">
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-8">
                    <div className="col-span-2 sm:col-span-2 lg:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4 sm:mb-6">
                            <motion.div
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-lg shadow-primary/25"
                                whileHover={{ scale: 1.05, rotate: 5 }}
                            >
                                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </motion.div>
                            <span className="text-lg sm:text-xl font-bold">Postlio</span>
                        </Link>

                        <p className="text-sm text-muted-foreground mb-4 sm:mb-6 max-w-sm">
                            Automatyzuj social media z pomocą AI. Twórz angażujące treści,
                            planuj publikacje i rozwijaj swoją markę.
                        </p>

                        <div className="space-y-2.5 sm:space-y-3">
                            <p className="text-xs sm:text-sm font-medium">Zapisz się do newslettera</p>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        placeholder="Twój email"
                                        className="pl-10 h-10 sm:h-11 bg-background text-sm"
                                        aria-label="Adres email do newslettera"
                                    />
                                </div>
                                {/* ✅ FIX: Dodano aria-label */}
                                <Button
                                    size="icon"
                                    className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0"
                                    aria-label="Zapisz się do newslettera"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-[10px] xs:text-xs text-muted-foreground">
                                Porady AI, nowości produktowe i ekskluzywne oferty
                            </p>
                        </div>
                    </div>

                    {Object.entries(footerLinks).map(([key, section]) => (
                        <div key={key}>
                            {/* ✅ FIX: Zmieniono h4 na h3 dla poprawnej hierarchii */}
                            <h3 className="font-semibold mb-3 sm:mb-4 text-xs sm:text-sm">{section.title}</h3>
                            <ul className="space-y-2 sm:space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-border/50">
                <div className="container mx-auto px-4 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                            © {new Date().getFullYear()} Postlio. Wszelkie prawa zastrzeżone.
                        </p>

                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {socialLinks.map((social) => (
                                <motion.a
                                    key={social.label}
                                    href={social.href}
                                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    aria-label={social.label}
                                >
                                    <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                </motion.a>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <span className="w-5 h-5 rounded-sm overflow-hidden">🇵🇱</span>
                            <span>Polski (PL)</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}