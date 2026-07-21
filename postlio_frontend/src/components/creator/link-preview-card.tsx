// src/components/creator/link-preview-card.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2 } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { getLinkPreview, type LinkPreview } from '@/lib/api/posts';

const URL_REGEX = /https?:\/\/[^\s]+/;
const DEBOUNCE_MS = 600;

function extractFirstUrl(text: string): string | undefined {
    const match = text.match(URL_REGEX);
    return match?.[0];
}

interface LinkPreviewCardProps {
    content: string;
}

export function LinkPreviewCard({ content }: LinkPreviewCardProps) {
    const [preview, setPreview] = useState<LinkPreview | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [dismissedUrl, setDismissedUrl] = useState<string | null>(null);
    const requestIdRef = useRef(0);

    const url = extractFirstUrl(content);

    useEffect(() => {
        if (!url || url === dismissedUrl) {
            setPreview(null);
            setIsLoading(false);
            return;
        }

        const requestId = ++requestIdRef.current;
        setIsLoading(true);

        const timer = setTimeout(async () => {
            try {
                const data = await getLinkPreview(url);
                if (requestIdRef.current !== requestId) return;
                setPreview(data);
            } catch {
                // Podgląd to funkcja pomocnicza - błąd (np. strona bez OG,
                // zablokowany/niedostępny adres) nie powinien przeszkadzać w pisaniu posta.
                if (requestIdRef.current !== requestId) return;
                setPreview(null);
            } finally {
                if (requestIdRef.current === requestId) {
                    setIsLoading(false);
                }
            }
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [url, dismissedUrl]);

    if (!url || url === dismissedUrl) return null;
    if (!isLoading && !preview) return null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={url}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
            >
                <div className="relative flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    {isLoading ? (
                        <>
                            <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
                            <div className="flex-1 space-y-2 py-1">
                                <Skeleton className="h-3.5 w-3/4" />
                                <Skeleton className="h-3 w-full" />
                            </div>
                        </>
                    ) : preview ? (
                        <>
                            {preview.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={preview.image}
                                    alt=""
                                    className="h-16 w-16 shrink-0 rounded-lg object-cover bg-black/20"
                                />
                            ) : (
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-black/20">
                                    <Link2 className="h-5 w-5 text-muted-foreground" />
                                </div>
                            )}
                            <div className="min-w-0 flex-1 py-0.5">
                                {preview.site_name && (
                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">
                                        {preview.site_name}
                                    </p>
                                )}
                                {preview.title && (
                                    <p className="text-sm font-medium truncate">{preview.title}</p>
                                )}
                                {preview.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {preview.description}
                                    </p>
                                )}
                            </div>
                        </>
                    ) : null}

                    <button
                        type="button"
                        onClick={() => setDismissedUrl(url)}
                        className="absolute top-2 right-2 rounded-full bg-background/80 p-1 backdrop-blur-sm hover:bg-background"
                        aria-label="Ukryj podgląd linku"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export default LinkPreviewCard;
