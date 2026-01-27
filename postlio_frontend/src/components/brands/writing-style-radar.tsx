// src/components/brands/writing-style-radar.tsx
'use client';

import { useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BrandVoiceDNA } from '@/types/brand';

interface WritingStyleRadarProps {
    voiceDNA: BrandVoiceDNA;
    primaryColor?: string;
    size?: number;
    className?: string;
}

/**
 * Radar chart wizualizujący Styl pisania marki.
 * Dawniej: VoiceDNARadar
 */
export function WritingStyleRadar({
                                      voiceDNA,
                                      primaryColor = '#8B5CF6',
                                      size = 200,
                                      className
                                  }: WritingStyleRadarProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const metrics = useMemo(() => [
        { key: 'formality', label: 'Formalność', value: voiceDNA.toneFormality },
        { key: 'energy', label: 'Energia', value: voiceDNA.toneEnergy },
        { key: 'humor', label: 'Humor', value: voiceDNA.toneHumor },
        { key: 'emotion', label: 'Emocje', value: voiceDNA.toneEmotion },
    ], [voiceDNA.toneFormality, voiceDNA.toneEnergy, voiceDNA.toneHumor, voiceDNA.toneEmotion]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = size / 2;
        const centerY = size / 2;
        const radius = (size / 2) - 30;

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // Draw background circles
        const levels = 4;
        for (let i = levels; i > 0; i--) {
            const levelRadius = (radius / levels) * i;
            ctx.beginPath();
            ctx.arc(centerX, centerY, levelRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw axes
        const angleStep = (Math.PI * 2) / metrics.length;
        metrics.forEach((_, index) => {
            const angle = angleStep * index - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        // Draw data polygon
        ctx.beginPath();
        metrics.forEach((metric, index) => {
            const angle = angleStep * index - Math.PI / 2;
            const valueRadius = (metric.value / 100) * radius;
            const x = centerX + Math.cos(angle) * valueRadius;
            const y = centerY + Math.sin(angle) * valueRadius;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.closePath();

        // Fill polygon
        ctx.fillStyle = `${primaryColor}30`;
        ctx.fill();

        // Stroke polygon
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw data points
        metrics.forEach((metric, index) => {
            const angle = angleStep * index - Math.PI / 2;
            const valueRadius = (metric.value / 100) * radius;
            const x = centerX + Math.cos(angle) * valueRadius;
            const y = centerY + Math.sin(angle) * valueRadius;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = primaryColor;
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

    }, [metrics, primaryColor, size]);

    return (
        <div className={cn("relative", className)}>
            <canvas
                ref={canvasRef}
                width={size}
                height={size}
                className="mx-auto"
            />

            {/* Labels */}
            {metrics.map((metric, index) => {
                const angleStep = (Math.PI * 2) / metrics.length;
                const angle = angleStep * index - Math.PI / 2;
                const labelRadius = (size / 2) - 10;
                const x = (size / 2) + Math.cos(angle) * labelRadius;
                const y = (size / 2) + Math.sin(angle) * labelRadius;

                return (
                    <div
                        key={metric.key}
                        className="absolute text-xs font-medium text-muted-foreground transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: x, top: y }}
                    >
                        {metric.label}
                    </div>
                );
            })}
        </div>
    );
}

// Alias dla kompatybilności wstecznej
export const VoiceDNARadar = WritingStyleRadar;