'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Menu,
    X,
    Sparkles,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
    { href: '#features', label: 'Funkcje' },
    { href: '#how-it-works', label: 'Jak to działa' },
    { href: '#pricing', label: 'Cennik' },
    { href: '#faq', label: 'FAQ' },
];

export function LandingHeader() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('');

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);

            // Update active section based on scroll position
            const sections = navLinks.map(link => link.href.slice(1));
            for (const section of sections.reverse()) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 100) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (href: string) => {
        const element = document.getElementById(href.slice(1));
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            <motion.header
                className={cn(
                    'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
                    isScrolled
                        ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm'
                        : 'bg-transparent'
                )}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16 md:h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 group">
                            <motion.div
                                className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-lg shadow-primary/25"
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Sparkles className="w-5 h-5 text-white" />
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
                            </motion.div>
                            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Postlio
              </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <button
                                    key={link.href}
                                    onClick={() => scrollToSection(link.href)}
                                    className={cn(
                                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors relative',
                                        activeSection === link.href.slice(1)
                                            ? 'text-primary'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                    )}
                                >
                                    {link.label}
                                    {activeSection === link.href.slice(1) && (
                                        <motion.div
                                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                                            layoutId="activeIndicator"
                                        />
                                    )}
                                </button>
                            ))}
                        </nav>

                        {/* Desktop CTA */}
                        <div className="hidden md:flex items-center gap-3">
                            <Button variant="ghost" asChild>
                                <Link href="/login">Zaloguj się</Link>
                            </Button>
                            <Button asChild className="group">
                                <Link href="/register" className="flex items-center gap-2">
                                    Zacznij za darmo
                                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        {/* Menu Panel */}
                        <motion.div
                            className="fixed top-16 left-0 right-0 bg-background border-b border-border z-40 md:hidden"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
                                {navLinks.map((link, index) => (
                                    <motion.button
                                        key={link.href}
                                        onClick={() => scrollToSection(link.href)}
                                        className="w-full text-left px-4 py-3 rounded-xl text-foreground hover:bg-muted/50 transition-colors font-medium"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        {link.label}
                                    </motion.button>
                                ))}

                                <div className="h-px bg-border my-2" />

                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" asChild>
                                        <Link href="/login">Zaloguj się</Link>
                                    </Button>
                                    <Button className="flex-1" asChild>
                                        <Link href="/register">Zacznij</Link>
                                    </Button>
                                </div>
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}