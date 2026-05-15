// src/providers/query-provider.tsx
'use client';

/**
 * React Query Provider
 *
 * Konfiguracja cache'owania i synchronizacji danych.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

interface QueryProviderProps {
    children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Dane są świeże przez 30 sekund
                        staleTime: 30 * 1000,
                        // Cache przez 5 minut
                        gcTime: 5 * 60 * 1000,
                        // Retry 2 razy przy błędzie
                        retry: 2,
                        // Nie refetchuj przy focus dla lepszego UX
                        refetchOnWindowFocus: false,
                    },
                    mutations: {
                        // Retry raz przy błędzie mutacji
                        retry: 1,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} position="bottom" />
            )}
        </QueryClientProvider>
    );
}

export default QueryProvider;