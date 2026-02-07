// src/components/brands/writing-style-radar.tsx
'use client';

import { useRef, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { BrandVoiceDNA } from '@/types/brand';

interface WritingStyleRadarProps {
    voiceDNA: BrandVoiceDNA;
    primaryColor?: string;
    size?: number;
    className?: string;
}

export function WritingStyleRadar({
                                      voiceDNA,
                                      primaryColor = '#8B5CF6',
                                      size: propSize,
                                      className
                                  }: WritingStyleRadarProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState(propSize || 200);

    useEffect(() => {
        if (propSize) {
            setSize(propSize);
            return;
        }

        const updateSize = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const newSize = Math.min(containerWidth, 220);
                setSize(Math.max(newSize, 140));
            }
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, [propSize]);

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

        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        const centerX = size / 2;
        const centerY = size / 2;
        const radius = (size / 2) - 25;

        ctx.clearRect(0, 0, size, size);

        const levels = 4;
        for (let i = levels; i > 0; i--) {
            const levelRadius = (radius / levels) * i;
            ctx.beginPath();
            ctx.arc(centerX, centerY, levelRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

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

        ctx.fillStyle = `${primaryColor}30`;
        ctx.fill();

        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2;
        ctx.stroke();

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

    const labelOffset = size < 180 ? 8 : 10;

    return (
        <div ref={containerRef} className={cn("relative w-full max-w-[220px]", className)}>
            <canvas
                ref={canvasRef}
                style={{ width: size, height: size }}
                className="mx-auto"
            />

            {metrics.map((metric, index) => {
                const angleStep = (Math.PI * 2) / metrics.length;
                const angle = angleStep * index - Math.PI / 2;
                const labelRadius = (size / 2) - labelOffset;
                const x = (size / 2) + Math.cos(angle) * labelRadius;
                const y = (size / 2) + Math.sin(angle) * labelRadius;

                return (
                    <div
                        key={metric.key}
                        className="absolute text-[10px] xs:text-xs font-medium text-muted-foreground transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
                        style={{ left: x, top: y }}
                    >
                        {size < 160 ? metric.label.slice(0, 4) + '.' : metric.label}
                    </div>
                );
            })}
        </div>
    );
}

export const VoiceDNARadar = WritingStyleRadar;