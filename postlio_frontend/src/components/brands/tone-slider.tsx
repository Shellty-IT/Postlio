// src/components/brands/tone-slider.tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ToneSliderProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    leftLabel: string;
    rightLabel: string;
    color?: string;
}

export function ToneSlider({
                               label,
                               value,
                               onChange,
                               leftLabel,
                               rightLabel,
                               color = '#8B5CF6',
                           }: ToneSliderProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{value}%</span>
            </div>

            <div className="relative">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>{leftLabel}</span>
                    <span>{rightLabel}</span>
                </div>

                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    {/* Track gradient */}
                    <div
                        className="absolute inset-0 opacity-30"
                        style={{
                            background: `linear-gradient(to right, transparent, ${color})`,
                        }}
                    />

                    {/* Value indicator */}
                    <motion.div
                        className="absolute top-0 bottom-0 rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                {/* Slider input */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value, 10))}
                    className={cn(
                        "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
                    )}
                />

                {/* Thumb indicator */}
                <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg pointer-events-none"
                    style={{
                        backgroundColor: color,
                        left: `calc(${value}% - 10px)`,
                    }}
                    animate={{ left: `calc(${value}% - 10px)` }}
                    transition={{ duration: 0.1 }}
                />
            </div>
        </div>
    );
}