// src/app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Sparkles, Zap, Shield, Bot } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/hooks';

// ============================================================
// SCHEMA WALIDACJI
// ============================================================

const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email jest wymagany')
        .email('Nieprawidłowy format email'),
    password: z
        .string()
        .min(1, 'Hasło jest wymagane')
        .min(6, 'Hasło musi mieć minimum 6 znaków'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ============================================================
// KOMPONENT
// ============================================================

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const { mutate: login, isPending } = useLogin();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = (data: LoginFormData) => {
        login(data);
    };

    return (
        <div className="min-h-screen flex">
            {/* Lewa strona - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-violet-500/20 to-primary/10 relative overflow-hidden">
                {/* Animowane tło */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/30 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-lg shadow-primary/25">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                                Postlio
                            </span>
                        </Link>

                        {/* Tekst */}
                        <h1 className="text-4xl xl:text-5xl font-bold text-foreground mb-6">
                            Twórz treści<br />
                            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                                z mocą AI
                            </span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-md mb-8">
                            Automatyzuj publikacje w social media. Generuj angażujące posty z AI
                            dostosowane do głosu Twojej marki.
                        </p>

                        {/* Features zamiast statystyk */}
                        <div className="space-y-4">
                            {[
                                { icon: Bot, text: 'Kreator AI z Brand Voice' },
                                { icon: Zap, text: 'Autopilot publikacji' },
                                { icon: Shield, text: 'Bezpieczne dane' },
                            ].map((feature, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <feature.icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <span className="text-muted-foreground">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Prawa strona - Formularz */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                                Postlio
                            </span>
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-foreground">Witaj ponownie!</h2>
                        <p className="text-muted-foreground mt-2">
                            Zaloguj się, aby kontynuować
                        </p>
                    </div>

                    {/* Formularz */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nazwa@firma.pl"
                                    className="pl-10"
                                    disabled={isPending}
                                    {...register('email')}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Hasło - USUNIĘTY link forgot-password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Hasło</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10"
                                    disabled={isPending}
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Logowanie...
                                </div>
                            ) : (
                                'Zaloguj się'
                            )}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-background text-muted-foreground">
                                lub
                            </span>
                        </div>
                    </div>

                    {/* Social login */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" type="button" disabled>
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Google
                        </Button>
                        <Button variant="outline" type="button" disabled>
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            GitHub
                        </Button>
                    </div>

                    {/* Link do rejestracji */}
                    <p className="text-center text-muted-foreground mt-8">
                        Nie masz konta?{' '}
                        <Link
                            href="/register"
                            className="text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                            Zarejestruj się
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}