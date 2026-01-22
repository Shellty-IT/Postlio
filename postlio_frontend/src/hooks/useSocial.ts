// src/hooks/useSocial.ts
/**
 * React Query hooks dla Social Media integration.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    type SocialPlatform,
    type PublishPostRequest,
} from '@/lib/api/social';

// ==================== Query Keys ====================

export const socialKeys = {
    all: ['social'] as const,
    accounts: () => [...socialKeys.all, 'accounts'] as const,
    account: (id: number) => [...socialKeys.accounts(), id] as const,
    platforms: () => [...socialKeys.all, 'platforms'] as const,
};

// ==================== Queries ====================

/**
 * Hook do pobierania listy połączonych kont.
 */
export function useConnectedAccounts() {
    return useQuery({
        queryKey: socialKeys.accounts(),
        queryFn: getConnectedAccounts,
        staleTime: 1000 * 60 * 5,
        retry: 1,
    });
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

// ==================== Mutations ====================

/**
 * Hook do inicjalizacji OAuth.
 */
export function useInitOAuth() {
    return useMutation({
        mutationFn: (platform: SocialPlatform) => initOAuth(platform),
        onSuccess: (data) => {
            sessionStorage.setItem('oauth_state', data.state);
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
 * Hook do obsługi callback OAuth.
 */
export function useOAuthCallback() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ platform, code, state }: {
            platform: SocialPlatform;
            code: string;
            state: string;
        }) => handleOAuthCallback(platform, code, state),
        onSuccess: (data) => {
            if (data.success) {
                toast.success('Konto połączone!', {
                    description: `Połączono: ${data.account_name || data.platform}`,
                });
                queryClient.invalidateQueries({ queryKey: socialKeys.accounts() });
            } else {
                toast.error('Błąd połączenia', {
                    description: data.error_description || data.error,
                });
            }
            sessionStorage.removeItem('oauth_state');
        },
        onError: (error: Error) => {
            toast.error('Błąd autoryzacji', { description: error.message });
            sessionStorage.removeItem('oauth_state');
        },
    });
}

/**
 * Hook do rozłączania konta.
 */
export function useDisconnectAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (accountId: number) => disconnectAccount(accountId),
        onSuccess: () => {
            toast.success('Konto rozłączone');
            queryClient.invalidateQueries({ queryKey: socialKeys.accounts() });
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
 */
export function usePublishToSocial() {
    return useMutation({
        mutationFn: (request: PublishPostRequest) => publishPost(request),
        onSuccess: (data) => {
            if (data.success) {
                toast.success('Opublikowano!', {
                    description: data.post_url ? 'Kliknij aby zobaczyć post' : 'Post został opublikowany',
                    action: data.post_url ? {
                        label: 'Zobacz',
                        onClick: () => window.open(data.post_url, '_blank'),
                    } : undefined,
                });
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
}> = {
    facebook: {
        name: 'Facebook',
        icon: 'facebook',
        color: '#1877F2',
        bgColor: 'bg-[#1877F2]',
        supportsImages: true,
        maxLength: 63206,
    },
    instagram: {
        name: 'Instagram',
        icon: 'instagram',
        color: '#E4405F',
        bgColor: 'bg-[#E4405F]',
        supportsImages: true,
        maxLength: 2200,
    },
    linkedin: {
        name: 'LinkedIn',
        icon: 'linkedin',
        color: '#0A66C2',
        bgColor: 'bg-[#0A66C2]',
        supportsImages: true,
        maxLength: 3000,
    },
    twitter: {
        name: 'Twitter/X',
        icon: 'twitter',
        color: '#000000',
        bgColor: 'bg-black',
        supportsImages: true,
        maxLength: 280,
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