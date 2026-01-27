// src/hooks/useSocial.ts
/**
 * React Query hooks dla Social Media integration.
 * Rozszerzone o obsługę onboardingu, capabilities i typów kont.
 */

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    getConnectedAccounts,
    getAccount,
    initOAuth,
    handleOAuthCallback,
    disconnectAccount,
    refreshAccountToken,
    publishPost,
    getAvailablePlatforms,
    getUserCapabilities,
} from '@/lib/api/social';
import { useAuthStore } from '@/store/auth-store';
import type {
    SocialPlatform,
    PublishPostRequest,
    OAuthCallbackResponse,
    ConnectedAccount,
} from '@/types';

// ==================== Query Keys ====================

export const socialKeys = {
    all: ['social'] as const,
    accounts: () => [...socialKeys.all, 'accounts'] as const,
    account: (id: number) => [...socialKeys.accounts(), id] as const,
    platforms: () => [...socialKeys.all, 'platforms'] as const,
    capabilities: () => [...socialKeys.all, 'capabilities'] as const,
};

// ==================== Queries ====================

/**
 * Hook do pobierania listy połączonych kont.
 */
export function useConnectedAccounts() {
    const { setConnectedAccounts } = useAuthStore();

    const query = useQuery({
        queryKey: socialKeys.accounts(),
        queryFn: getConnectedAccounts,
        staleTime: 1000 * 60 * 5,
        retry: 1,
    });

    // Synchronizuj z auth store
    useEffect(() => {
        if (query.data?.accounts) {
            setConnectedAccounts(query.data.accounts);
        }
    }, [query.data, setConnectedAccounts]);

    return query;
}

/**
 * Hook do pobierania pojedynczego konta.
 */
export function useAccount(accountId: number) {
    return useQuery({
        queryKey: socialKeys.account(accountId),
        queryFn: () => getAccount(accountId),
        enabled: !!accountId && accountId > 0,
    });
}

/**
 * Hook do pobierania dostępnych platform.
 */
export function useAvailablePlatforms() {
    return useQuery({
        queryKey: socialKeys.platforms(),
        queryFn: getAvailablePlatforms,
        staleTime: 1000 * 60 * 60,
    });
}

/**
 * Hook do pobierania capabilities użytkownika.
 */
export function useUserCapabilities() {
    const { setCapabilities, isAuthenticated } = useAuthStore();

    const query = useQuery({
        queryKey: socialKeys.capabilities(),
        queryFn: getUserCapabilities,
        staleTime: 1000 * 60 * 5,
        enabled: isAuthenticated,
    });

    // Synchronizuj z auth store
    useEffect(() => {
        if (query.data) {
            setCapabilities(query.data);
        }
    }, [query.data, setCapabilities]);

    return query;
}

// ==================== Mutations ====================

/**
 * Hook do inicjalizacji OAuth.
 * Rozszerzony o kontekst (onboarding/settings/login).
 */
export function useInitOAuth() {
    const { startSocialLogin } = useAuthStore();

    return useMutation({
        mutationFn: ({
                         platform,
                         context = 'settings',
                         isLogin = false,
                     }: {
            platform: SocialPlatform;
            context?: 'onboarding' | 'settings' | 'login';
            isLogin?: boolean;
        }) => {
            // Zapisz kontekst w store i sessionStorage
            startSocialLogin(platform, isLogin, context);
            return initOAuth(platform);
        },
        onSuccess: (data, variables) => {
            // Zapisz state w sessionStorage
            sessionStorage.setItem('oauth_state', data.state);
            sessionStorage.setItem('oauth_platform', variables.platform);
            sessionStorage.setItem('oauth_context', variables.context || 'settings');

            // Przekieruj do OAuth
            window.location.href = data.authorization_url;
        },
        onError: (error: Error) => {
            toast.error('Błąd połączenia', {
                description: error.message || 'Nie udało się rozpocząć łączenia konta',
            });
        },
    });
}

/**
 * Hook do obsługi callback OAuth (mutation).
 * Podstawowa wersja - tylko wywołuje API.
 */
export function useOAuthCallback() {
    const queryClient = useQueryClient();
    const { addConnectedAccount, clearPendingSocialLogin, setOnboardingStep } = useAuthStore();

    return useMutation({
        mutationFn: ({ platform, code, state }: {
            platform: SocialPlatform;
            code: string;
            state: string;
        }) => handleOAuthCallback(platform, code, state),
        onSuccess: (data) => {
            if (data.success) {
                // Utwórz obiekt ConnectedAccount z odpowiedzi
                const connectedAccount: ConnectedAccount = {
                    id: parseInt(data.account_id || '0'),
                    platform: data.platform,
                    account_type: data.account_type!,
                    platform_user_id: data.account_id || '',
                    platform_username: data.account_name,
                    is_active: true,
                    status: 'connected',
                    connected_at: new Date().toISOString(),
                    permissions: [],
                    is_business_account: data.is_business_account,
                    supports_auto_publish: data.supports_auto_publish,
                    supports_autopilot: data.supports_autopilot,
                    supports_images: true,
                    supports_videos: data.platform !== 'linkedin',
                    supports_links: data.platform !== 'instagram',
                    supports_scheduling: data.is_business_account,
                    max_text_length: data.platform === 'instagram' ? 2200 : data.platform === 'linkedin' ? 3000 : 63206,
                    requires_image: data.platform === 'instagram',
                    display_name: data.display_name || data.account_name || '',
                    publish_method: data.is_business_account ? 'auto' : (data.platform === 'instagram' ? 'manual_copy' : 'share_dialog'),
                };

                // Dodaj do store
                addConnectedAccount(connectedAccount);

                toast.success('Konto połączone!', {
                    description: `Połączono: ${data.display_name || data.account_name || data.platform}`,
                });

                // Invalidate queries
                queryClient.invalidateQueries({ queryKey: socialKeys.accounts() });
                queryClient.invalidateQueries({ queryKey: socialKeys.capabilities() });

                // Sprawdź kontekst
                const context = sessionStorage.getItem('oauth_context');
                if (context === 'onboarding') {
                    setOnboardingStep('success');
                }
            } else {
                toast.error('Błąd połączenia', {
                    description: data.error_description || data.error,
                });
            }

            // Cleanup
            clearPendingSocialLogin();
            sessionStorage.removeItem('oauth_state');
            sessionStorage.removeItem('oauth_platform');
            sessionStorage.removeItem('oauth_context');
        },
        onError: (error: Error) => {
            toast.error('Błąd autoryzacji', { description: error.message });
            clearPendingSocialLogin();
            sessionStorage.removeItem('oauth_state');
            sessionStorage.removeItem('oauth_platform');
            sessionStorage.removeItem('oauth_context');
        },
    });
}

/**
 * Hook do automatycznej obsługi OAuth callback z URL params.
 * Użyj na stronach, które mogą otrzymać callback.
 */
export function useOAuthCallbackHandler(options: {
    onSuccess?: (response: OAuthCallbackResponse, account?: ConnectedAccount) => void;
    onError?: (error: string, description?: string) => void;
    autoProcess?: boolean;
} = {}) {
    const { onSuccess, onError, autoProcess = true } = options;

    const searchParams = useSearchParams();
    const router = useRouter();
    const oauthCallback = useOAuthCallback();

    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pobierz parametry z URL
    const oauthSuccess = searchParams.get('oauth_success');
    const oauthCode = searchParams.get('oauth_code');
    const oauthState = searchParams.get('oauth_state');
    const oauthError = searchParams.get('oauth_error');
    const oauthErrorDescription = searchParams.get('oauth_error_description');
    const platform = searchParams.get('platform') as SocialPlatform | null;
    const context = searchParams.get('oauth_context') as 'onboarding' | 'settings' | 'login' | null;

    // Wyczyść parametry z URL
    const clearParams = useCallback(() => {
        const url = new URL(window.location.href);
        const paramsToRemove = [
            'oauth_success', 'oauth_code', 'oauth_state',
            'oauth_error', 'oauth_error_description',
            'platform', 'oauth_context'
        ];
        paramsToRemove.forEach(param => url.searchParams.delete(param));
        router.replace(url.pathname, { scroll: false });
    }, [router]);

    // Przetwórz callback
    const processCallback = useCallback(async () => {
        if (!platform || !oauthCode || !oauthState || isProcessing) {
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const result = await oauthCallback.mutateAsync({
                platform,
                code: oauthCode,
                state: oauthState,
            });

            if (result.success) {
                const connectedAccount: ConnectedAccount = {
                    id: parseInt(result.account_id || '0'),
                    platform: result.platform,
                    account_type: result.account_type!,
                    platform_user_id: result.account_id || '',
                    platform_username: result.account_name,
                    is_active: true,
                    status: 'connected',
                    connected_at: new Date().toISOString(),
                    permissions: [],
                    is_business_account: result.is_business_account,
                    supports_auto_publish: result.supports_auto_publish,
                    supports_autopilot: result.supports_autopilot,
                    supports_images: true,
                    supports_videos: result.platform !== 'linkedin',
                    supports_links: result.platform !== 'instagram',
                    supports_scheduling: result.is_business_account,
                    max_text_length: result.platform === 'instagram' ? 2200 : result.platform === 'linkedin' ? 3000 : 63206,
                    requires_image: result.platform === 'instagram',
                    display_name: result.display_name || result.account_name || '',
                    publish_method: result.is_business_account ? 'auto' : (result.platform === 'instagram' ? 'manual_copy' : 'share_dialog'),
                };

                onSuccess?.(result, connectedAccount);
            } else {
                const errorMsg = result.error || 'Nie udało się połączyć konta';
                setError(errorMsg);
                onError?.(result.error || 'unknown_error', result.error_description);
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Wystąpił błąd';
            setError(errorMsg);
            onError?.('request_error', errorMsg);
        } finally {
            setIsProcessing(false);
            clearParams();
        }
    }, [platform, oauthCode, oauthState, isProcessing, oauthCallback, onSuccess, onError, clearParams]);

    // Obsłuż błąd z OAuth providera
    useEffect(() => {
        if (oauthError) {
            const errorDescription = oauthErrorDescription || 'Autoryzacja została anulowana';
            setError(errorDescription);
            toast.error('Błąd autoryzacji', { description: errorDescription });
            onError?.(oauthError, oauthErrorDescription || undefined);
            clearParams();
        }
    }, [oauthError, oauthErrorDescription, onError, clearParams]);

    // Auto-process callback
    useEffect(() => {
        if (autoProcess && oauthSuccess === 'true' && oauthCode && oauthState && platform && !isProcessing) {
            processCallback();
        }
    }, [autoProcess, oauthSuccess, oauthCode, oauthState, platform, isProcessing, processCallback]);

    return {
        isProcessing: isProcessing || oauthCallback.isPending,
        error,
        response: oauthCallback.data,
        processCallback,
        clearParams,
        // Dodatkowe info
        hasOAuthParams: !!(oauthSuccess || oauthError),
        context,
        platform,
    };
}

/**
 * Hook do rozłączania konta.
 */
export function useDisconnectAccount() {
    const queryClient = useQueryClient();
    const { setConnectedAccounts, connectedAccounts } = useAuthStore();

    return useMutation({
        mutationFn: (accountId: number) => disconnectAccount(accountId),
        onSuccess: (_, accountId) => {
            toast.success('Konto rozłączone');

            // Usuń z local store
            const newAccounts = connectedAccounts.filter(acc => acc.id !== accountId);
            setConnectedAccounts(newAccounts);

            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: socialKeys.accounts() });
            queryClient.invalidateQueries({ queryKey: socialKeys.capabilities() });
        },
        onError: (error: Error) => {
            toast.error('Błąd', { description: error.message });
        },
    });
}

/**
 * Hook do odświeżania tokena.
 */
export function useRefreshToken() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (accountId: number) => refreshAccountToken(accountId),
        onSuccess: (data, accountId) => {
            if (data.success) {
                toast.success('Token odświeżony');
                queryClient.invalidateQueries({ queryKey: socialKeys.account(accountId) });
                queryClient.invalidateQueries({ queryKey: socialKeys.accounts() });
            } else {
                toast.error('Błąd odświeżania', { description: data.error });
            }
        },
        onError: (error: Error) => {
            toast.error('Błąd', { description: error.message });
        },
    });
}

/**
 * Hook do publikacji posta na social media.
 * Rozszerzony o obsługę kont osobistych (manual publish).
 */
export function usePublishToSocial() {
    return useMutation({
        mutationFn: (request: PublishPostRequest) => publishPost(request),
        onSuccess: (data) => {
            if (data.success) {
                if (data.requires_manual_publish) {
                    // Konto osobiste - pokaż instrukcje
                    toast.info('Przygotowano do publikacji', {
                        description: 'Otwórz platformę i opublikuj ręcznie',
                        action: data.share_dialog_url ? {
                            label: 'Otwórz',
                            onClick: () => window.open(data.share_dialog_url, '_blank'),
                        } : undefined,
                        duration: 10000,
                    });
                } else {
                    // Automatyczna publikacja
                    toast.success('Opublikowano!', {
                        description: data.post_url ? 'Kliknij aby zobaczyć post' : 'Post został opublikowany',
                        action: data.post_url ? {
                            label: 'Zobacz',
                            onClick: () => window.open(data.post_url, '_blank'),
                        } : undefined,
                    });
                }
            } else {
                toast.error('Błąd publikacji', { description: data.error });
            }
        },
        onError: (error: Error) => {
            toast.error('Błąd publikacji', { description: error.message });
        },
    });
}

// ==================== Helper Functions ====================

/**
 * Informacje o platformach social media.
 */
const platformInfoMap: Record<string, {
    name: string;
    icon: string;
    color: string;
    bgColor: string;
    supportsImages: boolean;
    maxLength: number;
    supportsAutoPublish: boolean;
}> = {
    facebook: {
        name: 'Facebook',
        icon: 'facebook',
        color: '#1877F2',
        bgColor: 'bg-[#1877F2]',
        supportsImages: true,
        maxLength: 63206,
        supportsAutoPublish: true,
    },
    instagram: {
        name: 'Instagram',
        icon: 'instagram',
        color: '#E4405F',
        bgColor: 'bg-[#E4405F]',
        supportsImages: true,
        maxLength: 2200,
        supportsAutoPublish: true,
    },
    linkedin: {
        name: 'LinkedIn',
        icon: 'linkedin',
        color: '#0A66C2',
        bgColor: 'bg-[#0A66C2]',
        supportsImages: true,
        maxLength: 3000,
        supportsAutoPublish: true,
    },
    twitter: {
        name: 'Twitter/X',
        icon: 'twitter',
        color: '#000000',
        bgColor: 'bg-black',
        supportsImages: true,
        maxLength: 280,
        supportsAutoPublish: false,
    },
};

/**
 * Pobierz informacje o platformie.
 */
export function getPlatformInfo(platform: string) {
    return platformInfoMap[platform.toLowerCase()] || {
        name: platform,
        icon: 'globe',
        color: '#6B7280',
        bgColor: 'bg-gray-500',
        supportsImages: true,
        maxLength: 5000,
        supportsAutoPublish: false,
    };
}

/**
 * Status konta - tekst do wyświetlenia.
 */
export function getStatusText(status: string): string {
    const statusTexts: Record<string, string> = {
        connected: 'Połączone',
        disconnected: 'Rozłączone',
        expired: 'Token wygasł',
        error: 'Błąd',
        pending: 'Oczekujące',
        active: 'Aktywne',
    };
    return statusTexts[status.toLowerCase()] || status;
}

/**
 * Status konta - kolor CSS.
 */
export function getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
        connected: 'text-green-500',
        active: 'text-green-500',
        disconnected: 'text-gray-500',
        expired: 'text-yellow-500',
        error: 'text-red-500',
        pending: 'text-blue-500',
    };
    return statusColors[status.toLowerCase()] || 'text-gray-500';
}

/**
 * Typ konta - tekst do wyświetlenia.
 */
export function getAccountTypeText(accountType: string): string {
    const typeTexts: Record<string, string> = {
        facebook_page: 'Strona Facebook',
        facebook_personal: 'Profil Facebook',
        instagram_business: 'Instagram Business',
        instagram_creator: 'Instagram Creator',
        instagram_personal: 'Instagram (osobiste)',
        linkedin_company: 'Strona firmowa LinkedIn',
        linkedin_personal: 'Profil LinkedIn',
        linkedin_profile: 'Profil LinkedIn',
    };
    return typeTexts[accountType] || accountType;
}

/**
 * Czy typ konta wspiera automatyczną publikację.
 */
export function supportsAutoPublish(accountType: string): boolean {
    const autoPublishTypes = [
        'facebook_page',
        'instagram_business',
        'instagram_creator',
        'linkedin_company',
    ];
    return autoPublishTypes.includes(accountType);
}

/**
 * Czy typ konta jest kontem firmowym.
 */
export function isBusinessAccountType(accountType: string): boolean {
    return supportsAutoPublish(accountType);
}