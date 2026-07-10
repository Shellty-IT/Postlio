// src/app/(auth)/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Zap, Shield, Bot, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLogo } from '@/components/common/app-logo';
import { useLogin } from '@/hooks';
import { authApi, TokenManager } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

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

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showPassword, setShowPassword] = useState(false);
    const [oauthLoading, setOauthLoading] = useState<'facebook' | 'google' | null>(null);
    const { mutate: login, isPending } = useLogin();
    const { login: authLogin } = useAuthStore();

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

    useEffect(() => {
        const handleOAuthCallback = async () => {
            const oauthSuccess = searchParams.get('oauth_success');
            const oauthCode = searchParams.get('oauth_code');
            const oauthState = searchParams.get('oauth_state');
            const platform = searchParams.get('platform');
            const oauthError = searchParams.get('oauth_error');
            const oauthErrorDescription = searchParams.get('oauth_error_description');

            if (oauthError) {
                toast.error('Błąd logowania', {
                    description: oauthErrorDescription || 'Autoryzacja została anulowana',
                });
                router.replace('/login', { scroll: false });
                return;
            }

            if (oauthSuccess === 'true' && oauthCode && oauthState && platform) {
                setOauthLoading(platform as 'facebook' | 'google');

                try {
                    const result = await authApi.handleOAuthLoginCallback(platform, oauthCode, oauthState);

                    if (result.success && result.access_token && result.refresh_token && result.user) {
                        TokenManager.setTokens(result.access_token, result.refresh_token);
                        authLogin(result.user);

                        toast.success(result.is_new_user ? 'Konto utworzone!' : 'Zalogowano!', {
                            description: `Witaj, ${result.user.full_name || result.user.email}!`,
                        });

                        if (result.user.needs_onboarding) {
                            router.replace('/onboarding');
                        } else {
                            router.replace('/dashboard');
                        }
                    } else {
                        toast.error('Błąd logowania', {
                            description: result.error_description || result.error || 'Nie udało się zalogować',
                        });
                    }
                } catch (error) {
                    console.error('OAuth callback error:', error);
                    toast.error('Błąd logowania', {
                        description: 'Wystąpił nieoczekiwany błąd',
                    });
                } finally {
                    setOauthLoading(null);
                    router.replace('/login', { scroll: false });
                }
            }
        };

        handleOAuthCallback();
    }, [searchParams, router, authLogin]);

    const onSubmit = (data: LoginFormData) => {
        login(data);
    };

    const handleOAuthLogin = async (platform: 'facebook' | 'google') => {
        setOauthLoading(platform);
        try {
            await authApi.startOAuthLogin(platform);
        } catch (error) {
            console.error('OAuth init error:', error);
            toast.error('Błąd', {
                description: 'Nie udało się rozpocząć logowania',
            });
            setOauthLoading(null);
        }
    };

    return (
        <div className="min-h-screen flex">
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-violet-500/20 to-primary/10 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/30 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
                </div>

                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Link href="/" className="flex items-center gap-3 mb-8">
                            <AppLogo className="h-12 w-12" />
                            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                                Postlio
                            </span>
                        </Link>

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

            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 xs:p-6 sm:p-8">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full max-w-md"
                >
                    <div className="lg:hidden flex items-center gap-2 xs:gap-3 mb-6 xs:mb-8 justify-center">
                        <Link href="/" className="flex items-center gap-2 xs:gap-3">
                            <AppLogo className="h-9 w-9 xs:h-10 xs:w-10" />
                            <span className="text-xl xs:text-2xl font-bold bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                                Postlio
                            </span>
                        </Link>
                    </div>

                    <div className="mb-6 xs:mb-8">
                        <h2 className="text-xl xs:text-2xl font-bold text-foreground">Witaj ponownie!</h2>
                        <p className="text-sm xs:text-base text-muted-foreground mt-1 xs:mt-2">
                            Zaloguj się, aby kontynuować
                        </p>
                    </div>

                    <div className="space-y-2 xs:space-y-3 mb-4 xs:mb-6">
                        <Button
                            variant="outline"
                            type="button"
                            className="w-full h-10 xs:h-11 relative text-sm"
                            onClick={() => handleOAuthLogin('google')}
                            disabled={!!oauthLoading || isPending}
                        >
                            {oauthLoading === 'google' ? (
                                <Loader2 className="w-4 h-4 xs:w-5 xs:h-5 animate-spin" />
                            ) : (
                                <>
                                    <svg className="w-4 h-4 xs:w-5 xs:h-5 mr-2 xs:mr-3" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span className="hidden xs:inline">Kontynuuj z Google</span>
                                    <span className="xs:hidden">Google</span>
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            type="button"
                            className="w-full h-10 xs:h-11 relative bg-[#1877F2] hover:bg-[#1877F2]/90 text-white border-[#1877F2] text-sm"
                            onClick={() => handleOAuthLogin('facebook')}
                            disabled={!!oauthLoading || isPending}
                        >
                            {oauthLoading === 'facebook' ? (
                                <Loader2 className="w-4 h-4 xs:w-5 xs:h-5 animate-spin" />
                            ) : (
                                <>
                                    <svg className="w-4 h-4 xs:w-5 xs:h-5 mr-2 xs:mr-3" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                    <span className="hidden xs:inline">Kontynuuj z Facebook</span>
                                    <span className="xs:hidden">Facebook</span>
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="relative my-4 xs:my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs xs:text-sm">
                            <span className="px-3 xs:px-4 bg-background text-muted-foreground">
                                lub zaloguj się emailem
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 xs:space-y-6">
                        <div className="space-y-1.5 xs:space-y-2">
                            <Label htmlFor="email" className="text-sm">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nazwa@firma.pl"
                                    className="pl-9 xs:pl-10 h-10 xs:h-11 text-sm"
                                    disabled={isPending || !!oauthLoading}
                                    {...register('email')}
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
                                    disabled={isPending || !!oauthLoading}
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4 xs:w-5 xs:h-5" />
                                    ) : (
                                        <Eye className="w-4 h-4 xs:w-5 xs:h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs xs:text-sm text-destructive">{errors.password.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-10 xs:h-11 bg-gradient-to-r from-primary to-violet-500 hover:from-primary/90 hover:to-violet-500/90 text-sm xs:text-base"
                            disabled={isPending || !!oauthLoading}
                        >
                            {isPending ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Logowanie...
                                </div>
                            ) : (
                                'Zaloguj się'
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground mt-6 xs:mt-8">
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
