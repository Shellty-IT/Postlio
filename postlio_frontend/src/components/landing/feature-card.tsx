'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    gradient: string;
    index: number;
    href?: string;
}

export function FeatureCard({
                                icon: Icon,
                                title,
                                description,
                                gradient,
                                index,
                                href,
                            }: FeatureCardProps) {
    const cardContent = (
        <>
            {/* Background gradient on hover */}
            <div
                className={cn(
                    'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                    gradient
                )}
            />

            {/* Shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Icon */}
                <motion.div
                    className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110',
                        'bg-gradient-to-br',
                        gradient.replace('bg-gradient-to-br', '').replace('/5', '/20')
                    )}
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                >
                    <Icon className="w-7 h-7 text-primary" />
                </motion.div>

                {/* Title */}
                <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
                    {title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed">
                    {description}
                </p>

                {/* Learn more link */}
                {href && (
                    <motion.div
                        className="mt-4 flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                        initial={{ x: -10 }}
                        whileHover={{ x: 0 }}
                    >
                        <span>Dowiedz się więcej</span>
                        <motion.span
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            →
                        </motion.span>
                    </motion.div>
                )}
            </div>

            {/* Corner decoration */}
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />
        </>
    );

    const cardClasses = "block relative h-full p-6 md:p-8 rounded-3xl bg-card border border-border/50 overflow-hidden transition-all duration-500 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5";

    return (
        <motion.div
            className="group relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
        >
            {href ? (
                <Link href={href} className={cardClasses}>
                    {cardContent}
                </Link>
            ) : (
                <div className={cardClasses}>
                    {cardContent}
                </div>
            )}
        </motion.div>
    );
}