// src/hooks/useAutopilotQueueStream.ts
'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, TokenManager } from '@/lib/api/client';
import { autopilotKeys } from './useAutopilot';

const RECONNECT_DELAY_MS = 3000;

/**
 * Nasłuchuje live-updates kolejki Autopilota przez SSE zamiast pollingu -
 * status zmieniony w tle przez scheduler (np. publikacja o zaplanowanej
 * godzinie, bez żadnej akcji użytkownika) pojawia się na dashboardzie
 * natychmiast zamiast czekać na ręczne odświeżenie.
 *
 * Używa fetch + ReadableStream zamiast natywnego EventSource, bo trzeba
 * dołączyć nagłówek Authorization - EventSource nie pozwala na custom
 * nagłówki, a token dostępowy celowo żyje tylko w pamięci i nigdy nie
 * trafia do URL (patrz TokenManager w lib/api/client.ts).
 */
export function useAutopilotQueueStream(configId: number | null) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!configId) return;

        let cancelled = false;
        let abortController: AbortController | null = null;

        async function connect() {
            while (!cancelled) {
                abortController = new AbortController();

                try {
                    const token = TokenManager.getAccessToken();
                    const response = await fetch(
                        `${API_BASE_URL}/autopilot/configs/${configId}/queue/stream`,
                        {
                            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                            credentials: 'include',
                            signal: abortController.signal,
                        }
                    );

                    if (!response.ok || !response.body) {
                        throw new Error(`Stream request failed: ${response.status}`);
                    }

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';

                    while (!cancelled) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const messages = buffer.split('\n\n');
                        buffer = messages.pop() || '';

                        for (const message of messages) {
                            const dataLine = message.split('\n').find((line) => line.startsWith('data: '));
                            if (!dataLine) continue;

                            try {
                                const event = JSON.parse(dataLine.slice('data: '.length));
                                if (event?.config_id) {
                                    queryClient.invalidateQueries({ queryKey: autopilotKeys.queue(event.config_id) });
                                    queryClient.invalidateQueries({ queryKey: autopilotKeys.queueStats(event.config_id) });
                                    queryClient.invalidateQueries({ queryKey: autopilotKeys.dashboard(event.config_id) });
                                }
                            } catch {
                                // Malformed event - najbliższy keep-alive/refetch i tak przywróci spójny stan.
                            }
                        }
                    }
                } catch (error) {
                    if (cancelled || (error instanceof DOMException && error.name === 'AbortError')) {
                        return;
                    }
                }

                if (!cancelled) {
                    await new Promise((resolve) => setTimeout(resolve, RECONNECT_DELAY_MS));
                }
            }
        }

        connect();

        return () => {
            cancelled = true;
            abortController?.abort();
        };
    }, [configId, queryClient]);
}

export default useAutopilotQueueStream;
