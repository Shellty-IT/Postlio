'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestimonialCardProps {
    quote: string;
    author: string;
    role: string;
    company: string;
    avatar: string;
    rating: number;
    featured?: boolean;
    index: number;
}

export function TestimonialCard({
                                    quote,
                                    author,
                                    role,
                                    company,
                                    avatar,
                                    rating,
                                    featured,
                                    index,
                                }: TestimonialCardProps) {
    return (
        <motion.div
            className={cn(
                'relative h-full',
                featured && 'md:col-span-2'
            )}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
        >
            <div
                className={cn(
                    'relative h-full p-6 md:p-8 rounded-3xl border transition-all duration-300 hover:shadow-lg',
                    featured
                        ? 'bg-gradient-to-br from-primary/5 to-violet-500/5 border-primary/20'
                        : 'bg-card border-border/50 hover:border-primary/20'
                )}
            >
                {/* Quote icon */}
                <div
                    className={cn(
                        'absolute top-6 right-6 w-10 h-10 rounded-xl flex items-center justify-center',
                        featured ? 'bg-primary/10' : 'bg-muted'
                    )}
                >
                    <Quote
                        className={cn(
                            'w-5 h-5',
                            featured ? 'text-primary' : 'text-muted-foreground'
                        )}
                    />
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={cn(
                                'w-4 h-4',
                                i < rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'fill-muted text-muted'
                            )}
                        />
                    ))}
                </div>

                {/* Quote */}
                <blockquote
                    className={cn(
                        'mb-6 leading-relaxed',
                        featured ? 'text-lg md:text-xl' : 'text-base'
                    )}
                >
                    &ldquo;{quote}&rdquo;
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4">
                    <div
                        className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold',
                            'bg-gradient-to-br from-primary/20 to-violet-500/20'
                        )}
                    >
                        {avatar}
                    </div>
                    <div>
                        <p className="font-semibold">{author}</p>
                        <p className="text-sm text-muted-foreground">
                            {role} · {company}
                        </p>
                    </div>
                </div>

                {/* Decorative gradient */}
                {featured && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-3xl bg-gradient-to-r from-primary to-violet-500 opacity-50" />
                )}
            </div>
        </motion.div>
    );
}