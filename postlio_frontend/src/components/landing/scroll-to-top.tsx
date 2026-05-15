// src/components/landing/scroll-to-top.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            setIsVisible(window.scrollY > 500);
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    onClick={scrollToTop}
                    className={cn(
                        'fixed bottom-20 sm:bottom-8 right-4 sm:right-8 z-40',
                        'w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl',
                        'bg-gradient-to-br from-primary to-violet-500',
                        'text-white shadow-lg shadow-primary/25',
                        'flex items-center justify-center',
                        'hover:shadow-xl hover:shadow-primary/30 transition-shadow'
                    )}
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Scroll to top"
                >
                    <motion.div
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.div>
                </motion.button>
            )}
        </AnimatePresence>
    );
}