// src/hooks/useWarmup.ts
'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || '';

export function useWarmup() {
    const [status, setStatus] = useState<'idle' | 'warming' | 'ready' | 'error'>('idle');
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        let mounted = true;
        let timeoutId: NodeJS.Timeout;

        const warmup = async () => {
            if (!mounted) return;
            setStatus('warming');

            try {
                const controller = new AbortController();
                timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

                const response = await fetch(`${API_URL}/health`, {
                    method: 'GET',
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (response.ok && mounted) {
                    setStatus('ready');
                } else if (mounted) {
                    throw new Error('Health check failed');
                }
            } catch {
                if (!mounted) return;

                if (retryCount < 3) {
                    // Retry po 2 sekundach
                    setTimeout(() => {
                        if (mounted) {
                            setRetryCount(prev => prev + 1);
                        }
                    }, 2000);
                } else {
                    setStatus('error');
                }
            }
        };

        warmup();

        return () => {
            mounted = false;
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [retryCount]);

    return { status, isWarming: status === 'warming', isReady: status === 'ready' };
}