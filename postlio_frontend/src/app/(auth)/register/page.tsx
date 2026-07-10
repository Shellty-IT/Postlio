// src/app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLogo } from '@/components/common/app-logo';
import { useRegister } from '@/hooks';

const registerSchema = z.object({
    full_name: z
        .string()
        .min(1, 'Imię i nazwisko jest wymagane')
        .min(2, 'Minimum 2 znaki')
        .max(100, 'Maksimum 100 znaków'),
    email: z
        .string()
        .min(1, 'Email jest wymagany')
        .email('Nieprawidłowy format email'),
    password: z
        .string()
        .min(1, 'Hasło jest wymagane')
        .min(8, 'Hasło musi mieć minimum 8 znaków')
        .regex(/[A-Z]/, 'Hasło musi zawierać wielką literę')
        .regex(/[0-9]/, 'Hasło musi zawierać cyfrę'),
    confirmPassword: z
        .string()
        .min(1, 'Potwierdzenie hasła jest wymagane'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Hasła muszą być identyczne',
    path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

function getPasswordStrength(password: string): {
    score: number;
    label: string;
    color: string;
} {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Słabe', color: 'bg-red-500' };
    if (score <= 3) return { score, label: 'Średnie', color: 'bg-yellow-500' };
    if (score <= 4) return { score, label: 'Dobre', color: 'bg-blue-500' };
    return { score, label: 'Silne', color: 'bg-green-500' };
}

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { mutate: register, isPending } = useRegister();

    const {
        register: registerField,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            full_name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    const password = watch('password');
    const passwordStrength = getPasswordStrength(password || '');

    const onSubmit = (data: RegisterFormData) => {
        register({
            email: data.email,
            password: data.password,
            full_name: data.full_name,
        });
    };

    const requirements = [
        { label: '8+ znaków', met: (password?.length || 0) >= 8 },
        { label: 'Wielka litera', met: /[A-Z]/.test(password || '') },
        { label: 'Cyfra', met: /[0-9]/.test(password || '') },
    ];

    return (
        <div className="min-h-screen flex">
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-500/20 via-primary/20 to-violet-500/10 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-500/30 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
                </div>

                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Link href="/" className="flex items-center gap-3 mb-8">
                            <AppLogo className="h-12 w-12" />
                            <span className="text-3xl font-bold bg-gradient-to-r from-violet-500 to-primary bg-clip-text text-transparent">
                                Postlio
                            </span>
                        </Link>

                        <h1 className="text-4xl xl:text-5xl font-bold text-foreground mb-6">
                            Zacznij tworzyć<br />
                            <span className="bg-gradient-to-r from-violet-500 to-primary bg-clip-text text-transparent">
                                z AI już dziś
                            </span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-md mb-8">
                            Rozpocznij bezpłatny okres próbny i odkryj moc AI w tworzeniu
                            treści dla social media.
                        </p>

                        <div className="space-y-4">
                            {[
                                'Bez karty kredytowej',
                                '14 dni za darmo',
                                'Wszystkie funkcje dostępne',
                                'Anuluj kiedy chcesz',
                            ].map((feature) => (
                                <div key={feature} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <Check className="w-3 h-3 text-green-500" />
                                    </div>
                                    <span className="text-muted-foreground">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 xs:p-6 sm:p-8 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full max-w-md py-4"
                >
                    <div className="lg:hidden flex items-center gap-2 xs:gap-3 mb-6 xs:mb-8 justify-center">
                        <Link href="/" className="flex items-center gap-2 xs:gap-3">
                            <AppLogo className="h-9 w-9 xs:h-10 xs:w-10" />
                            <span className="text-xl xs:text-2xl font-bold bg-gradient-to-r from-violet-500 to-primary bg-clip-text text-transparent">
                                Postlio
                            </span>
                        </Link>
                    </div>

                    <div className="mb-6 xs:mb-8">
                        <h2 className="text-xl xs:text-2xl font-bold text-foreground">Utwórz konto</h2>
                        <p className="text-sm xs:text-base text-muted-foreground mt-1 xs:mt-2">
                            Wypełnij formularz, aby rozpocząć
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 xs:space-y-5">
                        <div className="space-y-1.5 xs:space-y-2">
                            <Label htmlFor="full_name" className="text-sm">Imię i nazwisko</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 text-muted-foreground" />
                                <Input
                                    id="full_name"
                                    type="text"
                                    placeholder="Jan Kowalski"
                                    className="pl-9 xs:pl-10 h-10 xs:h-11 text-sm"
                                    disabled={isPending}
                                    {...registerField('full_name')}
                                />
                            </div>
                            {errors.full_name && (
                                <p className="text-xs xs:text-sm text-destructive">{errors.full_name.message}</p>
                            )}
                        </div>

                        <div className="space-y-1.5 xs:space-y-2">
                            <Label htmlFor="email" className="text-sm">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nazwa@firma.pl"
                                    className="pl-9 xs:pl-10 h-10 xs:h-11 text-sm"
                                    disabled={isPending}
                                    {...registerField('email')}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-xs xs:text-sm text-destructive">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-1.5 xs:space-y-2">
                            <Label htmlFor="password" className="text-sm">Hasło</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="pl-9 xs:pl-10 pr-10 h-10 xs:h-11 text-sm"
                                    disabled={isPending}
                                    {...registerField('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4 xs:w-5 xs:h-5" /> : <Eye className="w-4 h-4 xs:w-5 xs:h-5" />}
                                </button>
                            </div>

                            {password && (
                                <div className="space-y-1.5 xs:space-y-2">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-colors ${
                                                    i <= passwordStrength.score
                                                        ? passwordStrength.color
                                                        : 'bg-muted'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-[10px] xs:text-xs text-muted-foreground">
                                        Siła: <span className="font-medium">{passwordStrength.label}</span>
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-1.5 xs:gap-2 mt-1.5 xs:mt-2">
                                {requirements.map((req) => (
                                    <span
                                        key={req.label}
                                        className={`text-[10px] xs:text-xs px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full transition-colors ${
                                            req.met
                                                ? 'bg-green-500/10 text-green-500'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {req.met && <Check className="w-2.5 h-2.5 xs:w-3 xs:h-3 inline mr-0.5 xs:mr-1" />}
                                        {req.label}
                                    </span>
                                ))}
                            </div>

                            {errors.password && (
                                <p className="text-xs xs:text-sm text-destructive">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="space-y-1.5 xs:space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm">Potwierdź hasło</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="pl-9 xs:pl-10 pr-10 h-10 xs:h-11 text-sm"
                                    disabled={isPending}
                                    {...registerField('confirmPassword')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4 xs:w-5 xs:h-5" /> : <Eye className="w-4 h-4 xs:w-5 xs:h-5" />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-xs xs:text-sm text-destructive">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <p className="text-[10px] xs:text-xs text-muted-foreground">
                            Rejestrując się, akceptujesz{' '}
                            <Link href="/terms" className="text-primary hover:underline">Regulamin</Link>{' '}
                            oraz{' '}
                            <Link href="/privacy" className="text-primary hover:underline">Politykę Prywatności</Link>.
                        </p>

                        <Button
                            type="submit"
                            className="w-full h-10 xs:h-11 bg-gradient-to-r from-violet-500 to-primary hover:from-violet-500/90 hover:to-primary/90 text-sm xs:text-base"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Tworzenie...
                                </div>
                            ) : (
                                'Utwórz konto'
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground mt-6 xs:mt-8">
                        Masz już konto?{' '}
                        <Link
                            href="/login"
                            className="text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                            Zaloguj się
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
