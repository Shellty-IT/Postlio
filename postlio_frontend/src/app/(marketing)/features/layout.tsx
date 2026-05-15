// src/app/(marketing)/features/layout.tsx
import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FeaturesLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Powrót
                            </Button>
                        </Link>
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">P</span>
                            </div>
                            <span className="font-bold text-xl bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
                                Postlio
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/login">
                            <Button variant="ghost" size="sm">
                                Zaloguj się
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button size="sm" className="bg-gradient-to-r from-blue-500 to-violet-500 text-white">
                                Wypróbuj za darmo
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main>{children}</main>

            {/* Footer */}
            <footer className="border-t border-border/40 py-12 mt-20">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">P</span>
                            </div>
                            <span className="font-bold text-xl">Postlio</span>
                        </div>

                        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
                            <Link href="/features/kreator-ai" className="hover:text-foreground transition-colors">
                                Kreator AI
                            </Link>
                            <Link href="/features/autopilot" className="hover:text-foreground transition-colors">
                                Autopilot
                            </Link>
                            <Link href="/features/kalendarz" className="hover:text-foreground transition-colors">
                                Kalendarz
                            </Link>
                            <Link href="/features/brand-voice" className="hover:text-foreground transition-colors">
                                Brand Voice
                            </Link>
                        </nav>

                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} Postlio. Wszelkie prawa zastrzeżone.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}