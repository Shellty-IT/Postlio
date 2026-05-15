// src/components/landing/faq-item.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItemProps {
    question: string;
    answer: string;
    index: number;
    isOpen: boolean;
    onToggle: () => void;
}

export function FAQItem({ question, answer, index, isOpen, onToggle }: FAQItemProps) {
    return (
        <motion.div
            className="border-b border-border/50 last:border-0"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
        >
            <button
                onClick={onToggle}
                className="w-full py-4 sm:py-6 flex items-center justify-between text-left group min-h-[44px]"
                aria-expanded={isOpen}
            >
                <span className={cn(
                    'text-sm sm:text-base md:text-lg font-medium pr-4 sm:pr-8 transition-colors',
                    isOpen ? 'text-primary' : 'text-foreground group-hover:text-primary'
                )}>
                    {question}
                </span>
                <motion.div
                    className={cn(
                        'flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors',
                        isOpen
                            ? 'bg-primary text-white'
                            : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                    )}
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.div>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="pb-4 sm:pb-6 pr-4 sm:pr-16">
                            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                {answer}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}